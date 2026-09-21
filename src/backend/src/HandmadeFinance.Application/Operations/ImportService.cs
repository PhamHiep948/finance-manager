using System.Globalization;
using System.Text;
using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Categories;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Ledger;

namespace HandmadeFinance.Application.Operations;

/// <summary>Một dòng của bảng tính: số dòng thật trong sheet và văn bản của từng ô.</summary>
public sealed record SheetRow(int Number, IReadOnlyList<string> Cells);

/// <summary>Đọc worksheet đầu tiên của tệp .xlsx (dòng đầu là tiêu đề).</summary>
public interface IImportSheetReader
{
    /// <exception cref="AppException">Tệp không phải workbook .xlsx hợp lệ.</exception>
    IReadOnlyList<SheetRow> Read(Stream stream);
}

public sealed record ImportRowResult(
    int RowNumber,
    string? Date,
    string? Description,
    string? Category,
    decimal? Amount,
    string Status,
    IReadOnlyList<string> Errors
);

public sealed record ImportPreview(
    string ImportType,
    string OriginalFileName,
    int TotalRows,
    int ValidRows,
    int InvalidRows,
    IReadOnlyList<ImportRowResult> Rows
);

public interface IImportService
{
    Task<ImportPreview> PreviewAsync(
        EntryKind kind,
        string fileName,
        Stream file,
        CancellationToken ct
    );

    Task<ImportBatchRecord> ImportAsync(
        EntryKind kind,
        string fileName,
        Stream file,
        Actor actor,
        CancellationToken ct
    );
}

public sealed class ImportService(
    IImportSheetReader reader,
    ICategoryRepository categories,
    ILedgerService ledger,
    IOperationalStore store,
    IClock clock
) : IImportService
{
    public const int MaxRows = 1000;

    private static readonly Dictionary<string, string> CategoryAliases = new()
    {
        ["ban hang"] = "sales",
        ["thu khac"] = "other income",
        ["nguyen vat lieu"] = "raw materials",
        ["bao bi / dong goi"] = "packaging",
        ["van chuyen"] = "shipping",
        ["quang cao"] = "advertising",
        ["phi dich vu"] = "service fees",
        ["luong nhan vien"] = "employee salaries",
        ["dien / nuoc / internet"] = "electricity / water / internet",
        ["thue mat bang"] = "premises rent",
        ["cong cu / thiet bi"] = "tools / equipment",
        ["chi khac"] = "other expenses",
    };

    private static readonly string[] RequiredColumns = ["date", "description", "category", "amount"];

    private static readonly string[] DateFormats =
        ["yyyy-MM-dd", "dd/MM/yyyy", "d/M/yyyy", "yyyy/MM/dd", "dd-MM-yyyy"];

    public async Task<ImportPreview> PreviewAsync(
        EntryKind kind,
        string fileName,
        Stream file,
        CancellationToken ct
    )
    {
        var rows = await ParseAsync(kind, file, ct);
        var valid = rows.Count(x => x.Write is not null);
        return new(
            kind.ToString(),
            fileName,
            rows.Count,
            valid,
            rows.Count - valid,
            rows.Select(x => x.Display).Take(200).ToList()
        );
    }

    public async Task<ImportBatchRecord> ImportAsync(
        EntryKind kind,
        string fileName,
        Stream file,
        Actor actor,
        CancellationToken ct
    )
    {
        var rows = await ParseAsync(kind, file, ct);
        var failures = new List<object>();
        var success = 0;
        foreach (var row in rows)
        {
            var errors = row.Display.Errors.ToList();
            if (row.Write is not null)
            {
                try
                {
                    await ledger.CreateAsync(kind, row.Write, actor, ct);
                    success++;
                    continue;
                }
                catch (AppException ex)
                {
                    errors.Add(ex.Message);
                }
            }
            failures.Add(new { row = row.Display.RowNumber, errors });
        }
        return store.AddImport(
            kind.ToString(),
            fileName,
            rows.Count,
            success,
            rows.Count - success,
            failures.Count == 0 ? null : failures,
            actor.UserId,
            clock.UtcNow
        );
    }

    private sealed record Parsed(ImportRowResult Display, LedgerWrite? Write);

    private async Task<List<Parsed>> ParseAsync(EntryKind kind, Stream file, CancellationToken ct)
    {
        var sheet = reader.Read(file);
        if (sheet.Count == 0)
            throw AppException.Validation("The workbook is empty.");
        var columns = MapColumns(kind, sheet[0]);
        var data = sheet.Skip(1).Where(r => r.Cells.Any(c => !string.IsNullOrWhiteSpace(c))).ToList();
        if (data.Count == 0)
            throw AppException.Validation("The workbook has no data rows.");
        if (data.Count > MaxRows)
            throw AppException.Validation($"A workbook may contain at most {MaxRows} data rows.");

        var lookup = new Dictionary<string, Category>();
        foreach (var c in await categories.ListActiveAsync(kind, ct))
            lookup[Normalize(c.Name)] = c;

        return data.Select(r => ParseRow(kind, r, columns, lookup)).ToList();
    }

    private static Dictionary<string, int> MapColumns(EntryKind kind, SheetRow header)
    {
        var income = kind == EntryKind.INCOME;
        string[][] wanted =
        [
            ["date", income ? "ngay thu" : "ngay chi", "ngay", "date"],
            ["description", "noi dung", "description"],
            ["category", income ? "loai thu" : "loai chi", "nhom", "category"],
            ["amount", "so tien", "amount"],
            ["currency", "tien te", "currency"],
            ["extra", income ? "ma tham chieu" : "nguoi nhan", income ? "ma don" : "payee", "reference", "recipient"],
            ["tax", "thue (%)", "thue", "tax", "tax percent"],
        ];
        var normalized = header.Cells.Select(Normalize).ToList();
        var map = new Dictionary<string, int>();
        foreach (var names in wanted)
        {
            var index = normalized.FindIndex(h => names.Skip(1).Contains(h));
            if (index >= 0)
                map[names[0]] = index;
        }
        var missing = RequiredColumns.Where(k => !map.ContainsKey(k)).ToList();
        if (missing.Count > 0)
            throw AppException.Validation(
                $"Missing required column(s): {string.Join(", ", missing)}. Use the provided template."
            );
        return map;
    }

    private static Parsed ParseRow(
        EntryKind kind,
        SheetRow row,
        Dictionary<string, int> columns,
        Dictionary<string, Category> lookup
    )
    {
        string Cell(string key) =>
            columns.TryGetValue(key, out var i) && i < row.Cells.Count ? row.Cells[i].Trim() : "";

        var errors = new List<string>();
        DateOnly? date = null;
        var rawDate = Cell("date");
        if (DateOnly.TryParseExact(rawDate, DateFormats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var d))
            date = d;
        else
            errors.Add($"Invalid date '{rawDate}'. Use yyyy-MM-dd or dd/MM/yyyy.");

        var description = Cell("description");
        if (description.Length == 0)
            errors.Add("Description is required.");

        var rawCategory = Cell("category");
        var key = Normalize(rawCategory);
        if (CategoryAliases.TryGetValue(key, out var alias))
            key = alias;
        lookup.TryGetValue(key, out var category);
        if (category is null)
            errors.Add($"Unknown category '{rawCategory}'.");

        decimal? amount = null;
        if (
            decimal.TryParse(Cell("amount"), NumberStyles.Number, CultureInfo.InvariantCulture, out var a)
            && a > 0
            && a < 1_000_000_000m
        )
            amount = decimal.Round(a, 2, MidpointRounding.AwayFromZero);
        else
            errors.Add("Amount must be a positive number.");

        var currency = Cell("currency");
        if (currency.Length > 0 && !currency.Equals("USD", StringComparison.OrdinalIgnoreCase))
            errors.Add("Only USD is supported.");

        var tax = 0m;
        var rawTax = Cell("tax");
        if (
            rawTax.Length > 0
            && !(decimal.TryParse(rawTax, NumberStyles.Number, CultureInfo.InvariantCulture, out tax) && tax is >= 0 and <= 100)
        )
            errors.Add("Tax percent must be between 0 and 100.");

        var display = new ImportRowResult(
            row.Number,
            date?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
            description.Length == 0 ? null : description,
            category?.Name ?? (rawCategory.Length == 0 ? null : rawCategory),
            amount,
            errors.Count == 0 ? "VALID" : "INVALID",
            errors
        );
        if (errors.Count > 0)
            return new(display, null);

        var extra = Cell("extra");
        var afterTax = decimal.Round(amount!.Value * (1 + tax / 100m), 2, MidpointRounding.AwayFromZero);
        var write = new LedgerWrite(
            date!.Value,
            description,
            category!.Id,
            amount.Value,
            tax,
            afterTax,
            "USD",
            OrderCode: kind == EntryKind.INCOME && extra.Length > 0 ? extra : null,
            Payee: kind == EntryKind.EXPENSE && extra.Length > 0 ? extra : null
        );
        return new(display, write);
    }

    /// <summary>Chữ thường, bỏ dấu tiếng Việt, gộp khoảng trắng để so khớp tiêu đề và tên nhóm.</summary>
    public static string Normalize(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return "";
        var decomposed = value.Trim().ToLowerInvariant().Replace('đ', 'd').Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(decomposed.Length);
        foreach (var ch in decomposed)
            if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
                sb.Append(ch);
        return string.Join(' ', sb.ToString().Split(' ', StringSplitOptions.RemoveEmptyEntries));
    }
}
