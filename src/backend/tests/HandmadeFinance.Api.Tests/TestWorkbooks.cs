using ClosedXML.Excel;

namespace HandmadeFinance.Api.Tests;

/// <summary>Dựng tệp .xlsx thật cho các bài kiểm thử import.</summary>
internal static class TestWorkbooks
{
    public static readonly string[] IncomeHeader =
        ["Ngày thu", "Nội dung", "Loại thu", "Số tiền", "Tiền tệ", "Mã tham chiếu"];

    public static readonly string[] ExpenseHeader =
        ["Ngày chi", "Nội dung", "Loại chi", "Số tiền", "Tiền tệ", "Người nhận"];

    public static byte[] Build(string[] header, params string[][] rows)
    {
        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Sheet1");
        for (var c = 0; c < header.Length; c++)
            sheet.Cell(1, c + 1).Value = header[c];
        for (var r = 0; r < rows.Length; r++)
            for (var c = 0; c < rows[r].Length; c++)
                sheet.Cell(r + 2, c + 1).Value = rows[r][c];
        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    public static byte[] Income(params string[][] rows) => Build(IncomeHeader, rows);

    public static byte[] Expense(params string[][] rows) => Build(ExpenseHeader, rows);
}
