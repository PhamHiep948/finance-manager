using HandmadeFinance.Api.Authorization;
using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Categories;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Operations;
using HandmadeFinance.Application.Reporting;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandmadeFinance.Api.Controllers;

[Authorize(Roles = "ADMIN,SHOP_OWNER,VIEWER"), ApiController, Route("api/v1/reports/export")]
public sealed class ReportExportController(
    IReportingService reports,
    IReportDocumentBuilder documents,
    ICategoryRepository categories,
    IOperationalStore operations,
    IClock clock
) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Export(
        [FromQuery] string format,
        DateOnly? dateFrom,
        DateOnly? dateTo,
        CancellationToken ct
    )
    {
        var normalized = format?.ToUpperInvariant();
        if (normalized is not ("PDF" or "XLSX"))
            throw AppException.Validation("format must be PDF or XLSX.");
        var summary = await reports.GetSummaryAsync(dateFrom, dateTo, ct);
        var data = new ReportDocumentData(
            summary,
            dateFrom,
            dateTo,
            await Names(EntryKind.INCOME, ct),
            await Names(EntryKind.EXPENSE, ct),
            clock.UtcNow
        );
        var actor = User.Actor();
        operations.Audit(
            "EXPORT",
            "REPORT",
            $"Exported {normalized} report",
            actor.UserId,
            clock.UtcNow
        );
        if (normalized == "PDF")
            return File(documents.BuildPdf(data), "application/pdf", "financial-report.pdf");
        return File(
            documents.BuildXlsx(data),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "financial-report.xlsx"
        );
    }

    private async Task<IReadOnlyDictionary<long, string>> Names(EntryKind kind, CancellationToken ct) =>
        (await categories.ListActiveAsync(kind, ct)).ToDictionary(c => c.Id, c => c.Name);
}

[Authorize(Roles = "ADMIN,SHOP_OWNER,EMPLOYEE"), ApiController, Route("api/v1/imports")]
public sealed class ImportsController(IOperationalStore store, IImportService imports)
    : ControllerBase
{
    private const long MaxBytes = 10 * 1024 * 1024;

    [HttpPost("preview")]
    public async Task<IActionResult> Preview(
        [FromForm] string importType,
        [FromForm] IFormFile file,
        CancellationToken ct
    )
    {
        Validate(importType, file);
        await using var stream = file.OpenReadStream();
        var preview = await imports.PreviewAsync(
            Kind(importType),
            Path.GetFileName(file.FileName),
            stream,
            ct
        );
        return Ok(
            new
            {
                importType = preview.ImportType,
                originalFileName = preview.OriginalFileName,
                totalRows = preview.TotalRows,
                validRows = preview.ValidRows,
                invalidRows = preview.InvalidRows,
                rows = preview.Rows,
            }
        );
    }

    [HttpGet]
    public IActionResult List(
        int page = 1,
        int pageSize = 20,
        string? importType = null,
        string? status = null
    )
    {
        Page(page, pageSize);
        IEnumerable<ImportBatchRecord> query = store.Imports;
        if (importType is not null)
            query = query.Where(x =>
                x.ImportType.Equals(importType, StringComparison.OrdinalIgnoreCase)
            );
        if (status is not null)
            query = query.Where(x => x.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        var all = query.OrderByDescending(x => x.Id).ToList();
        return Ok(
            new
            {
                items = all.Skip((page - 1) * pageSize).Take(pageSize),
                meta = new
                {
                    page,
                    pageSize,
                    totalItems = all.Count,
                    totalPages = all.Count == 0
                        ? 0
                        : (int)Math.Ceiling(all.Count / (double)pageSize),
                },
            }
        );
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromForm] string importType,
        [FromForm] IFormFile file,
        CancellationToken ct
    )
    {
        Validate(importType, file);
        await using var stream = file.OpenReadStream();
        var batch = await imports.ImportAsync(
            Kind(importType),
            Path.GetFileName(file.FileName),
            stream,
            User.Actor(),
            ct
        );
        return AcceptedAtAction(nameof(Get), new { importId = batch.Id }, batch);
    }

    [HttpGet("{importId:long}")]
    public IActionResult Get(long importId) =>
        Ok(
            store.FindImport(importId)
                ?? throw AppException.NotFound("import")
        );

    private static void Validate(string type, IFormFile file)
    {
        if (type?.ToUpperInvariant() is not ("INCOME" or "EXPENSE"))
            throw AppException.Validation("importType must be INCOME or EXPENSE.");
        if (file is null || file.Length == 0)
            throw AppException.Validation("A non-empty file is required.");
        if (file.Length > MaxBytes)
            throw new AppException(413, "PAYLOAD_TOO_LARGE", "File exceeds 10 MB.");
        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (ext is not ".xlsx")
            throw AppException.Validation("Only .xlsx files are allowed.");
    }

    private static EntryKind Kind(string importType) =>
        importType.Equals("INCOME", StringComparison.OrdinalIgnoreCase)
            ? EntryKind.INCOME
            : EntryKind.EXPENSE;

    private static void Page(int page, int size)
    {
        if (page < 1 || size is < 1 or > 100)
            throw AppException.Validation("Invalid paging.");
    }
}

[Authorize(Roles = "ADMIN,SHOP_OWNER,EMPLOYEE"), ApiController]
public sealed class AttachmentsController(
    ILedgerRepository ledger,
    IOperationalStore store,
    IClock clock
) : ControllerBase
{
    private const long MaxBytes = 10 * 1024 * 1024;

    [HttpPost("api/v1/incomes/{incomeId:long}/attachments")]
    public Task<IActionResult> Income(long incomeId, IFormFile file, CancellationToken ct) =>
        Upload(EntryKind.INCOME, incomeId, file, ct);

    [HttpPost("api/v1/expenses/{expenseId:long}/attachments")]
    public Task<IActionResult> Expense(long expenseId, IFormFile file, CancellationToken ct) =>
        Upload(EntryKind.EXPENSE, expenseId, file, ct);

    [HttpDelete("api/v1/attachments/{attachmentId:long}")]
    public IActionResult Delete(long attachmentId)
    {
        var item =
            store.FindAttachment(attachmentId)
            ?? throw AppException.NotFound("attachment");
        var actor = User.Actor();
        if (actor.Role == UserRole.EMPLOYEE && item.UploadedBy != actor.UserId)
            throw AppException.Forbidden();
        store.RemoveAttachment(item.Id);
        return NoContent();
    }

    private async Task<IActionResult> Upload(
        EntryKind kind,
        long id,
        IFormFile file,
        CancellationToken ct
    )
    {
        if (file is null || file.Length == 0)
            throw AppException.Validation("A non-empty file is required.");
        if (file.Length > MaxBytes)
            throw new AppException(413, "PAYLOAD_TOO_LARGE", "File exceeds 10 MB.");
        var name = Path.GetFileName(file.FileName);
        if (name != file.FileName || name.Contains(".."))
            throw AppException.Validation("Invalid file name.");
        var row = await ledger.GetAsync(kind, id, ct);
        if (row is null || row.DeletedAt is not null)
            throw AppException.NotFound(kind.ToString().ToLowerInvariant());
        var actor = User.Actor();
        if (actor.Role == UserRole.EMPLOYEE && row.CreatedBy != actor.UserId)
            throw AppException.Forbidden();
        await using var ms = new MemoryStream();
        await file.CopyToAsync(ms, ct);
        var item = store.AddAttachment(
            kind,
            id,
            name,
            file.ContentType,
            ms.ToArray(),
            actor.UserId,
            clock.UtcNow
        );
        return Created(
            $"/api/v1/attachments/{item.Id}",
            new
            {
                id = item.Id,
                originalName = item.OriginalName,
                mimeType = item.MimeType,
                fileSizeBytes = item.FileSizeBytes,
                uploadedBy = item.UploadedBy,
                uploadedAt = item.UploadedAt,
            }
        );
    }
}

[Authorize(Roles = "ADMIN,SHOP_OWNER"), ApiController, Route("api/v1/audit-logs")]
public sealed class AuditLogsController(IOperationalStore store, IUserRepository users)
    : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        int page = 1,
        int pageSize = 20,
        string? action = null,
        long? actorUserId = null,
        string? module = null,
        DateOnly? dateFrom = null,
        DateOnly? dateTo = null,
        CancellationToken ct = default
    )
    {
        if (page < 1 || pageSize is < 1 or > 100 || dateFrom > dateTo)
            throw AppException.Validation("Invalid audit filters.");
        IEnumerable<AuditRecord> q = store.Audits;
        if (action is not null)
            q = q.Where(x => x.Action.Equals(action, StringComparison.OrdinalIgnoreCase));
        if (actorUserId.HasValue)
            q = q.Where(x => x.ActorUserId == actorUserId);
        if (module is not null)
            q = q.Where(x => x.Module.Equals(module, StringComparison.OrdinalIgnoreCase));
        if (dateFrom.HasValue)
            q = q.Where(x => DateOnly.FromDateTime(x.ChangedAt.UtcDateTime) >= dateFrom);
        if (dateTo.HasValue)
            q = q.Where(x => DateOnly.FromDateTime(x.ChangedAt.UtcDateTime) <= dateTo);
        var all = q.OrderByDescending(x => x.ChangedAt).ToList();
        var pageItems = all.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        var names = new Dictionary<long, string?>();
        foreach (var id in pageItems.Select(x => x.ActorUserId).Distinct())
            names[id] = (await users.GetAsync(id, ct))?.FullName;
        return Ok(
            new
            {
                items = pageItems.Select(x => new
                {
                    x.Id,
                    x.Action,
                    x.Module,
                    x.Detail,
                    x.ActorUserId,
                    actorName = names[x.ActorUserId],
                    x.ChangedAt,
                }),
                meta = new
                {
                    page,
                    pageSize,
                    totalItems = all.Count,
                    totalPages = all.Count == 0
                        ? 0
                        : (int)Math.Ceiling(all.Count / (double)pageSize),
                },
            }
        );
    }
}
