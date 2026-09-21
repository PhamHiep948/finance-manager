using ClosedXML.Excel;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Infrastructure;
using Xunit;

namespace HandmadeFinance.Infrastructure.Tests;

public sealed class ClosedXmlSheetReaderTests
{
    private static MemoryStream Workbook(Action<IXLWorksheet> fill)
    {
        using var wb = new XLWorkbook();
        fill(wb.Worksheets.Add("Data"));
        var stream = new MemoryStream();
        wb.SaveAs(stream);
        stream.Position = 0;
        return stream;
    }

    [Fact]
    public void Reads_headers_and_rows_with_sheet_row_numbers()
    {
        using var stream = Workbook(s =>
        {
            s.Cell(1, 1).Value = "Ngày thu";
            s.Cell(1, 2).Value = "Số tiền";
            s.Cell(2, 1).Value = "2026-09-01";
            s.Cell(2, 2).Value = 85.5;
        });
        var rows = new ClosedXmlSheetReader().Read(stream);
        Assert.Equal([1, 2], rows.Select(r => r.Number).ToArray());
        Assert.Equal(["Ngày thu", "Số tiền"], rows[0].Cells);
        Assert.Equal(["2026-09-01", "85.5"], rows[1].Cells);
    }

    [Fact]
    public void Real_date_cells_become_iso_dates_and_numbers_use_invariant_format()
    {
        using var stream = Workbook(s =>
        {
            s.Cell(1, 1).Value = "d";
            s.Cell(1, 2).Value = "n";
            s.Cell(2, 1).Value = new DateTime(2026, 9, 17);
            s.Cell(2, 2).Value = 1234.5;
        });
        var row = new ClosedXmlSheetReader().Read(stream)[1];
        Assert.Equal("2026-09-17", row.Cells[0]);
        Assert.Equal("1234.5", row.Cells[1]);
    }

    [Fact]
    public void Empty_cells_between_values_are_empty_strings()
    {
        using var stream = Workbook(s =>
        {
            s.Cell(1, 1).Value = "a";
            s.Cell(1, 3).Value = "c";
        });
        Assert.Equal(["a", "", "c"], new ClosedXmlSheetReader().Read(stream)[0].Cells);
    }

    [Fact]
    public void Blank_workbook_yields_no_rows()
    {
        using var stream = Workbook(_ => { });
        Assert.Empty(new ClosedXmlSheetReader().Read(stream));
    }

    [Theory]
    [InlineData(new byte[] { })]
    [InlineData(new byte[] { 1, 2, 3, 4 })]
    public void Non_workbook_bytes_are_a_validation_error(byte[] bytes)
    {
        using var stream = new MemoryStream(bytes);
        var ex = Assert.Throws<AppException>(() => new ClosedXmlSheetReader().Read(stream));
        Assert.Equal(400, ex.Status);
    }
}
