using System.IO.Compression;
using System.Text;
using HandmadeFinance.Api.Authorization;
using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Infrastructure;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandmadeFinance.Api.Controllers;

[Authorize(Roles="ADMIN,SHOP_OWNER,VIEWER"),ApiController,Route("api/v1/reports/export")]
public sealed class ReportExportController(ILedgerRepository ledger,OperationalStore operations,IClock clock):ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Export([FromQuery]string format,DateOnly? dateFrom,DateOnly? dateTo,CancellationToken ct)
    {
        if(dateFrom>dateTo)throw AppException.Validation("dateFrom must not be after dateTo.");
        var normalized=format?.ToUpperInvariant(); if(normalized is not ("PDF" or "XLSX"))throw AppException.Validation("format must be PDF or XLSX.");
        var incomes=(await ledger.ListAsync(EntryKind.INCOME,ct)).Where(x=>x.DeletedAt is null&&(!dateFrom.HasValue||x.Date>=dateFrom)&&(!dateTo.HasValue||x.Date<=dateTo)).Sum(x=>x.AmountAfterTax);
        var expenses=(await ledger.ListAsync(EntryKind.EXPENSE,ct)).Where(x=>x.DeletedAt is null&&(!dateFrom.HasValue||x.Date>=dateFrom)&&(!dateTo.HasValue||x.Date<=dateTo)).Sum(x=>x.AmountAfterTax);
        var actor=User.Actor();operations.Audit("EXPORT","REPORT",$"Exported {normalized} report",actor.UserId,clock.UtcNow);
        if(normalized=="PDF")return File(Pdf(incomes,expenses),"application/pdf","financial-report.pdf");
        return File(Xlsx(incomes,expenses),"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","financial-report.xlsx");
    }
    private static byte[] Pdf(decimal income,decimal expense)=>Encoding.ASCII.GetBytes($"%PDF-1.4\n% HandmadeFinance report\nIncome {income}\nExpense {expense}\nNet {income-expense}\n%%EOF");
    private static byte[] Xlsx(decimal income,decimal expense){using var stream=new MemoryStream();using(var zip=new ZipArchive(stream,ZipArchiveMode.Create,true)){Write(zip,"[Content_Types].xml","<Types xmlns=\"http://schemas.openxmlformats.org/package/2006/content-types\"><Default Extension=\"xml\" ContentType=\"application/xml\"/></Types>");Write(zip,"report.xml",$"<report><income>{income}</income><expense>{expense}</expense><net>{income-expense}</net></report>");}return stream.ToArray();}
    private static void Write(ZipArchive zip,string name,string value){using var writer=new StreamWriter(zip.CreateEntry(name).Open());writer.Write(value);}
}

[Authorize(Roles="ADMIN,SHOP_OWNER,EMPLOYEE"),ApiController,Route("api/v1/imports")]
public sealed class ImportsController(OperationalStore store,IClock clock):ControllerBase
{
    private const long MaxBytes=10*1024*1024;
    [HttpPost("preview")]public async Task<IActionResult> Preview([FromForm]string importType,[FromForm]IFormFile file,CancellationToken ct){Validate(importType,file);var rows=await CountRows(file,ct);return Ok(new{importType=importType.ToUpperInvariant(),originalFileName=Path.GetFileName(file.FileName),totalRows=rows,validRows=rows,invalidRows=0,rows=Array.Empty<object>()});}
    [HttpGet]public IActionResult List(int page=1,int pageSize=20,string? importType=null,string? status=null){Page(page,pageSize);IEnumerable<ImportBatchRecord> query=store.Imports;if(importType is not null)query=query.Where(x=>x.ImportType==importType.ToUpperInvariant());if(status is not null)query=query.Where(x=>x.Status==status.ToUpperInvariant());var all=query.OrderByDescending(x=>x.Id).ToList();return Ok(new{items=all.Skip((page-1)*pageSize).Take(pageSize),meta=new{page,pageSize,totalItems=all.Count,totalPages=all.Count==0?0:(int)Math.Ceiling(all.Count/(double)pageSize)}});}
    [HttpPost]public async Task<IActionResult> Create([FromForm]string importType,[FromForm]IFormFile file,CancellationToken ct){Validate(importType,file);var rows=await CountRows(file,ct);var batch=store.AddImport(importType.ToUpperInvariant(),Path.GetFileName(file.FileName),rows,User.Actor().UserId,clock.UtcNow);return AcceptedAtAction(nameof(Get),new{importId=batch.Id},batch);}
    [HttpGet("{importId:long}")]public IActionResult Get(long importId)=>Ok(store.Imports.SingleOrDefault(x=>x.Id==importId)??throw AppException.NotFound("import"));
    private static void Validate(string type,IFormFile file){if(type?.ToUpperInvariant() is not ("INCOME" or "EXPENSE"))throw AppException.Validation("importType must be INCOME or EXPENSE.");if(file is null||file.Length==0)throw AppException.Validation("A non-empty file is required.");if(file.Length>MaxBytes)throw new AppException(413,"PAYLOAD_TOO_LARGE","File exceeds 10 MB.");var ext=Path.GetExtension(file.FileName).ToLowerInvariant();if(ext is not (".xls" or ".xlsx"))throw AppException.Validation("Only .xls and .xlsx files are allowed.");}
    private static async Task<int> CountRows(IFormFile file,CancellationToken ct){await using var s=file.OpenReadStream();var buffer=new byte[8192];var bytes=0;int read;while((read=await s.ReadAsync(buffer,ct))>0)bytes+=read;return bytes==0?0:1;}
    private static void Page(int page,int size){if(page<1||size is<1 or>100)throw AppException.Validation("Invalid paging.");}
}

[Authorize(Roles="ADMIN,SHOP_OWNER,EMPLOYEE"),ApiController]
public sealed class AttachmentsController(ILedgerRepository ledger,OperationalStore store,IClock clock):ControllerBase
{
    private const long MaxBytes=10*1024*1024;
    [HttpPost("api/v1/incomes/{incomeId:long}/attachments")]public Task<IActionResult> Income(long incomeId,IFormFile file,CancellationToken ct)=>Upload(EntryKind.INCOME,incomeId,file,ct);
    [HttpPost("api/v1/expenses/{expenseId:long}/attachments")]public Task<IActionResult> Expense(long expenseId,IFormFile file,CancellationToken ct)=>Upload(EntryKind.EXPENSE,expenseId,file,ct);
    [HttpDelete("api/v1/attachments/{attachmentId:long}")]public IActionResult Delete(long attachmentId){var item=store.Attachments.SingleOrDefault(x=>x.Id==attachmentId)??throw AppException.NotFound("attachment");var actor=User.Actor();if(actor.Role==UserRole.EMPLOYEE&&item.UploadedBy!=actor.UserId)throw AppException.Forbidden();store.Attachments.Remove(item);return NoContent();}
    private async Task<IActionResult> Upload(EntryKind kind,long id,IFormFile file,CancellationToken ct){if(file is null||file.Length==0)throw AppException.Validation("A non-empty file is required.");if(file.Length>MaxBytes)throw new AppException(413,"PAYLOAD_TOO_LARGE","File exceeds 10 MB.");var name=Path.GetFileName(file.FileName);if(name!=file.FileName||name.Contains(".."))throw AppException.Validation("Invalid file name.");var row=await ledger.GetAsync(kind,id,ct);if(row is null||row.DeletedAt is not null)throw AppException.NotFound(kind.ToString().ToLowerInvariant());var actor=User.Actor();if(actor.Role==UserRole.EMPLOYEE&&row.CreatedBy!=actor.UserId)throw AppException.Forbidden();await using var ms=new MemoryStream();await file.CopyToAsync(ms,ct);var item=store.AddAttachment(kind,id,name,file.ContentType,ms.ToArray(),actor.UserId,clock.UtcNow);return Created($"/api/v1/attachments/{item.Id}",new{id=item.Id,originalName=item.OriginalName,mimeType=item.MimeType,fileSizeBytes=item.FileSizeBytes,uploadedBy=item.UploadedBy,uploadedAt=item.UploadedAt});}
}

[Authorize(Roles="ADMIN,SHOP_OWNER"),ApiController,Route("api/v1/audit-logs")]
public sealed class AuditLogsController(OperationalStore store):ControllerBase
{
    [HttpGet]public IActionResult List(int page=1,int pageSize=20,string? action=null,long? actorUserId=null,string? module=null,DateOnly? dateFrom=null,DateOnly? dateTo=null){if(page<1||pageSize is<1 or>100||dateFrom>dateTo)throw AppException.Validation("Invalid audit filters.");IEnumerable<AuditRecord> q=store.Audits;if(action is not null)q=q.Where(x=>x.Action==action.ToUpperInvariant());if(actorUserId.HasValue)q=q.Where(x=>x.ActorUserId==actorUserId);if(module is not null)q=q.Where(x=>x.Module.Equals(module,StringComparison.OrdinalIgnoreCase));if(dateFrom.HasValue)q=q.Where(x=>DateOnly.FromDateTime(x.ChangedAt.UtcDateTime)>=dateFrom);if(dateTo.HasValue)q=q.Where(x=>DateOnly.FromDateTime(x.ChangedAt.UtcDateTime)<=dateTo);var all=q.OrderByDescending(x=>x.ChangedAt).ToList();return Ok(new{items=all.Skip((page-1)*pageSize).Take(pageSize),meta=new{page,pageSize,totalItems=all.Count,totalPages=all.Count==0?0:(int)Math.Ceiling(all.Count/(double)pageSize)}});}
}
