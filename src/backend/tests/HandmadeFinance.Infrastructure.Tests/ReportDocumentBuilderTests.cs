using System.Globalization;
using ClosedXML.Excel;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Ledger;
using HandmadeFinance.Application.Reporting;
using HandmadeFinance.Infrastructure;
using PdfSharp.Pdf.IO;
using Xunit;

namespace HandmadeFinance.Infrastructure.Tests;

public sealed class ReportDocumentBuilderTests
{
    private static LedgerEntry Entry(
        long id,
        EntryKind kind,
        string day,
        string text,
        long category,
        decimal amount,
        decimal tax = 0
    ) =>
        new()
        {
            Id = id,
            Kind = kind,
            Date = DateOnly.Parse(day, CultureInfo.InvariantCulture),
            Description = text,
            CategoryId = category,
            Amount = amount,
            TaxPercent = tax,
            AmountAfterTax = decimal.Round(amount * (1 + tax / 100), 2),
        };

    private static ReportDocumentData Data(int extraRows = 0)
    {
        List<LedgerEntry> incomes =
        [
            Entry(1, EntryKind.INCOME, "2026-09-02", "Đơn hàng Etsy", 1, 100, 10),
            Entry(2, EntryKind.INCOME, "2026-09-01", "Workshop", 2, 50),
        ];
        for (var i = 0; i < extraRows; i++)
            incomes.Add(Entry(100 + i, EntryKind.INCOME, "2026-09-03", $"Row {i}", 1, 1));
        List<LedgerEntry> expenses = [Entry(10, EntryKind.EXPENSE, "2026-09-01", "Mua len", 3, 40)];
        return new(
            new(
                "USD",
                incomes.Sum(x => x.AmountAfterTax),
                expenses.Sum(x => x.AmountAfterTax),
                incomes,
                expenses
            ),
            new(2026, 9, 1),
            new(2026, 9, 30),
            new Dictionary<long, string> { [1] = "Sales", [2] = "Other Income" },
            new Dictionary<long, string> { [3] = "Raw Materials" },
            new(2026, 9, 17, 8, 0, 0, TimeSpan.Zero)
        );
    }

    [Fact]
    public void Xlsx_has_overview_and_two_ledger_sheets_with_correct_values()
    {
        var bytes = new ReportDocumentBuilder().BuildXlsx(Data());
        using var wb = new XLWorkbook(new MemoryStream(bytes));
        Assert.Equal(
            ["Tổng quan", "Khoản thu", "Khoản chi"],
            wb.Worksheets.Select(w => w.Name).ToArray()
        );

        var overview = wb.Worksheet("Tổng quan");
        Assert.Equal(160m, overview.Cell(5, 2).GetValue<decimal>());
        Assert.Equal(40m, overview.Cell(6, 2).GetValue<decimal>());
        Assert.Equal(120m, overview.Cell(7, 2).GetValue<decimal>());
        Assert.Equal(2, overview.Cell(8, 2).GetValue<int>());
        Assert.Equal(1, overview.Cell(9, 2).GetValue<int>());
        Assert.Contains("2026-09-01", overview.Cell(2, 2).GetString());

        var incomes = wb.Worksheet("Khoản thu");
        Assert.Equal("Ngày", incomes.Cell(1, 1).GetString());
        Assert.Equal("Workshop", incomes.Cell(2, 2).GetString()); // sắp theo ngày
        Assert.Equal("Đơn hàng Etsy", incomes.Cell(3, 2).GetString());
        Assert.Equal("Sales", incomes.Cell(3, 3).GetString());
        Assert.Equal(110m, incomes.Cell(3, 6).GetValue<decimal>());
        Assert.Equal("Raw Materials", wb.Worksheet("Khoản chi").Cell(2, 3).GetString());
    }

    [Fact]
    public void Xlsx_uses_a_placeholder_for_unknown_categories()
    {
        var data = Data() with { IncomeCategories = new Dictionary<long, string>() };
        using var wb = new XLWorkbook(new MemoryStream(new ReportDocumentBuilder().BuildXlsx(data)));
        Assert.Equal("#2", wb.Worksheet("Khoản thu").Cell(2, 3).GetString());
    }

    [Fact]
    public void Xlsx_for_an_empty_period_still_has_headers()
    {
        var empty = Data() with { Summary = new("USD", 0, 0, [], []) };
        using var wb = new XLWorkbook(new MemoryStream(new ReportDocumentBuilder().BuildXlsx(empty)));
        Assert.Equal("Nội dung", wb.Worksheet("Khoản thu").Cell(1, 2).GetString());
        Assert.True(wb.Worksheet("Khoản thu").Cell(2, 1).IsEmpty());
    }

    [Fact]
    public void Pdf_is_structurally_valid()
    {
        if (!FontAvailable())
            return;
        var bytes = new ReportDocumentBuilder().BuildPdf(Data());
        Assert.Equal("%PDF-", System.Text.Encoding.ASCII.GetString(bytes, 0, 5));
        Assert.Contains("%%EOF", System.Text.Encoding.ASCII.GetString(bytes, bytes.Length - 16, 16));
    }

    [Fact]
    public void Long_reports_paginate_onto_extra_pages()
    {
        if (!FontAvailable())
            return;
        var builder = new ReportDocumentBuilder();
        var small = PageCount(builder.BuildPdf(Data()));
        var large = PageCount(builder.BuildPdf(Data(extraRows: 200)));
        Assert.Equal(1, small);
        Assert.True(large >= 3, $"expected several pages, got {large}");
    }

    private static int PageCount(byte[] pdf)
    {
        using var doc = PdfReader.Open(new MemoryStream(pdf), PdfDocumentOpenMode.Import);
        return doc.PageCount;
    }

    private static bool FontAvailable() =>
        new[]
        {
            Environment.GetEnvironmentVariable("REPORT_FONT_PATH"),
            @"C:\Windows\Fonts\arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            "/Library/Fonts/Arial.ttf",
            "/System/Library/Fonts/Supplemental/Arial.ttf",
        }.Any(p => !string.IsNullOrWhiteSpace(p) && File.Exists(p));
}
