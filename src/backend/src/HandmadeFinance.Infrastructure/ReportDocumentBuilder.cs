using System.Globalization;
using ClosedXML.Excel;
using HandmadeFinance.Application.Ledger;
using HandmadeFinance.Application.Reporting;
using PdfSharp.Drawing;
using PdfSharp.Fonts;
using PdfSharp.Pdf;

namespace HandmadeFinance.Infrastructure;

public sealed class ReportDocumentBuilder : IReportDocumentBuilder
{
    private static readonly CultureInfo Inv = CultureInfo.InvariantCulture;

    // ---------------------------------------------------------------- XLSX
    public byte[] BuildXlsx(ReportDocumentData data)
    {
        using var workbook = new XLWorkbook();
        var s = data.Summary;

        var overview = workbook.Worksheets.Add("Tổng quan");
        overview.Cell(1, 1).Value = "HandmadeFinance - Báo cáo tài chính";
        overview.Cell(1, 1).Style.Font.Bold = true;
        overview.Cell(1, 1).Style.Font.FontSize = 14;
        overview.Cell(2, 1).Value = "Kỳ báo cáo";
        overview.Cell(2, 2).Value = Period(data);
        overview.Cell(3, 1).Value = "Ngày xuất";
        overview.Cell(3, 2).Value = data.GeneratedAt.ToString("yyyy-MM-dd HH:mm 'UTC'", Inv);
        (string, decimal, bool)[] totals =
        [
            ($"Tổng thu ({s.CurrencyCode})", s.TotalIncome, true),
            ($"Tổng chi ({s.CurrencyCode})", s.TotalExpense, true),
            ($"Chênh lệch ({s.CurrencyCode})", s.NetResult, true),
            ("Số khoản thu", s.Incomes.Count, false),
            ("Số khoản chi", s.Expenses.Count, false),
        ];
        var row = 5;
        foreach (var (label, value, money) in totals)
        {
            overview.Cell(row, 1).Value = label;
            overview.Cell(row, 2).Value = value;
            if (money)
                overview.Cell(row, 2).Style.NumberFormat.Format = "#,##0.00";
            row++;
        }
        overview.Column(1).Width = 28;
        overview.Column(2).Width = 26;

        AddLedgerSheet(workbook, "Khoản thu", s.Incomes, data.IncomeCategories);
        AddLedgerSheet(workbook, "Khoản chi", s.Expenses, data.ExpenseCategories);

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }

    private static void AddLedgerSheet(
        XLWorkbook workbook,
        string name,
        IReadOnlyList<LedgerEntry> entries,
        IReadOnlyDictionary<long, string> categories
    )
    {
        var sheet = workbook.Worksheets.Add(name);
        string[] headers = ["Ngày", "Nội dung", "Danh mục", "Số tiền", "Thuế (%)", "Sau thuế"];
        for (var i = 0; i < headers.Length; i++)
        {
            var cell = sheet.Cell(1, i + 1);
            cell.Value = headers[i];
            cell.Style.Font.Bold = true;
            cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#E5E7EB");
        }
        var r = 2;
        foreach (var e in entries.OrderBy(x => x.Date).ThenBy(x => x.Id))
        {
            sheet.Cell(r, 1).Value = e.Date.ToDateTime(TimeOnly.MinValue);
            sheet.Cell(r, 1).Style.DateFormat.Format = "yyyy-mm-dd";
            sheet.Cell(r, 2).Value = e.Description;
            sheet.Cell(r, 3).Value = categories.GetValueOrDefault(e.CategoryId, $"#{e.CategoryId}");
            sheet.Cell(r, 4).Value = e.Amount;
            sheet.Cell(r, 5).Value = e.TaxPercent;
            sheet.Cell(r, 6).Value = e.AmountAfterTax;
            sheet.Range(r, 4, r, 6).Style.NumberFormat.Format = "#,##0.00";
            r++;
        }
        sheet.SheetView.FreezeRows(1);
        sheet.Columns().AdjustToContents(1, Math.Min(r, 200));
    }

    // ---------------------------------------------------------------- PDF
    public byte[] BuildPdf(ReportDocumentData data)
    {
        FontSetup.Ensure();
        using var document = new PdfDocument();
        document.Info.Title = "HandmadeFinance - Báo cáo tài chính";
        var writer = new PdfWriter(document);
        var s = data.Summary;

        writer.Text("HandmadeFinance - Báo cáo tài chính", 16, bold: true);
        writer.Text($"Kỳ báo cáo: {Period(data)}", 10);
        writer.Text($"Ngày xuất: {data.GeneratedAt.ToString("yyyy-MM-dd HH:mm 'UTC'", Inv)}", 10);
        writer.Gap(8);
        writer.Text($"Tổng thu: {Money(s.TotalIncome, s.CurrencyCode)}", 11, bold: true);
        writer.Text($"Tổng chi: {Money(s.TotalExpense, s.CurrencyCode)}", 11, bold: true);
        writer.Text($"Chênh lệch: {Money(s.NetResult, s.CurrencyCode)}", 11, bold: true);
        writer.Text($"Số giao dịch: {s.Incomes.Count + s.Expenses.Count} ({s.Incomes.Count} thu, {s.Expenses.Count} chi)", 10);

        Table(writer, "Khoản thu", s.Incomes, data.IncomeCategories);
        Table(writer, "Khoản chi", s.Expenses, data.ExpenseCategories);
        writer.Finish();

        using var stream = new MemoryStream();
        document.Save(stream);
        return stream.ToArray();
    }

    private static void Table(
        PdfWriter w,
        string title,
        IReadOnlyList<LedgerEntry> entries,
        IReadOnlyDictionary<long, string> categories
    )
    {
        w.Gap(14);
        w.Text($"{title} ({entries.Count})", 12, bold: true);
        w.Row(["Ngày", "Nội dung", "Danh mục", "Sau thuế"], bold: true);
        foreach (var e in entries.OrderBy(x => x.Date).ThenBy(x => x.Id))
            w.Row([
                e.Date.ToString("yyyy-MM-dd", Inv),
                e.Description,
                categories.GetValueOrDefault(e.CategoryId, $"#{e.CategoryId}"),
                e.AmountAfterTax.ToString("N2", Inv),
            ]);
        if (entries.Count == 0)
            w.Text("Không có dữ liệu trong kỳ.", 9);
    }

    private static string Period(ReportDocumentData d) =>
        d.From is null && d.To is null
            ? "Tất cả"
            : $"{d.From?.ToString("yyyy-MM-dd", Inv) ?? "..."} đến {d.To?.ToString("yyyy-MM-dd", Inv) ?? "..."}";

    private static string Money(decimal v, string currency) => $"{v.ToString("N2", Inv)} {currency}";

    /// <summary>Vẽ văn bản tuần tự lên các trang A4, tự sang trang khi hết chỗ.</summary>
    private sealed class PdfWriter(PdfDocument document)
    {
        private const double Margin = 40;
        private static readonly double[] ColumnX = [0, 70, 300, 430];
        private PdfPage? _page;
        private XGraphics? _gfx;
        private double _y;

        public void Text(string text, double size, bool bold = false)
        {
            Ensure(size + 6);
            _gfx!.DrawString(text, Font(size, bold), XBrushes.Black, new XPoint(Margin, _y + size));
            _y += size + 6;
        }

        public void Gap(double points) => _y += points;

        public void Row(string[] cells, bool bold = false)
        {
            const double size = 9;
            Ensure(size + 5);
            var font = Font(size, bold);
            for (var i = 0; i < cells.Length; i++)
            {
                var text = Fit(cells[i], i == 1 ? 38 : i == 2 ? 22 : 14);
                var x = Margin + ColumnX[i];
                if (i == 3)
                    _gfx!.DrawString(text, font, XBrushes.Black, new XRect(x, _y, 85, size + 4), XStringFormats.TopRight);
                else
                    _gfx!.DrawString(text, font, XBrushes.Black, new XPoint(x, _y + size));
            }
            _y += size + 5;
        }

        public void Finish() => _gfx?.Dispose();

        private void Ensure(double needed)
        {
            if (_page is not null && _y + needed <= _page.Height.Point - Margin)
                return;
            _gfx?.Dispose();
            _page = document.AddPage();
            _page.Size = PdfSharp.PageSize.A4;
            _gfx = XGraphics.FromPdfPage(_page);
            _y = Margin;
        }

        private static XFont Font(double size, bool bold) =>
            new(FontSetup.Family, size, bold ? XFontStyleEx.Bold : XFontStyleEx.Regular);

        private static string Fit(string text, int max) => text.Length <= max ? text : text[..(max - 1)] + "…";
    }

    /// <summary>
    /// PDFsharp cần tệp font TrueType hỗ trợ tiếng Việt. Tìm font hệ thống, hoặc đường dẫn
    /// trong biến môi trường REPORT_FONT_PATH (kèm REPORT_FONT_BOLD_PATH nếu có).
    /// </summary>
    private sealed class FontSetup : IFontResolver
    {
        public const string Family = "ReportFont";
        private static readonly Lock Gate = new();
        private static bool _ready;
        private static byte[] _regular = [];
        private static byte[] _bold = [];

        public static void Ensure()
        {
            lock (Gate)
            {
                if (_ready)
                    return;
                var regular = Find(Environment.GetEnvironmentVariable("REPORT_FONT_PATH"),
                    @"C:\Windows\Fonts\arial.ttf",
                    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
                    "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
                    "/Library/Fonts/Arial.ttf",
                    "/System/Library/Fonts/Supplemental/Arial.ttf")
                    ?? throw new InvalidOperationException(
                        "No TrueType font found for PDF export. Set REPORT_FONT_PATH to a .ttf file.");
                var bold = Find(Environment.GetEnvironmentVariable("REPORT_FONT_BOLD_PATH"),
                    @"C:\Windows\Fonts\arialbd.ttf",
                    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
                    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
                    "/Library/Fonts/Arial Bold.ttf",
                    "/System/Library/Fonts/Supplemental/Arial Bold.ttf") ?? regular;
                _regular = File.ReadAllBytes(regular);
                _bold = File.ReadAllBytes(bold);
                GlobalFontSettings.FontResolver ??= new FontSetup();
                _ready = true;
            }
        }

        private static string? Find(params string?[] candidates) =>
            candidates.FirstOrDefault(p => !string.IsNullOrWhiteSpace(p) && File.Exists(p));

        public FontResolverInfo? ResolveTypeface(string familyName, bool isBold, bool isItalic) =>
            familyName == Family ? new FontResolverInfo(isBold ? "report-bold" : "report-regular") : null;

        public byte[]? GetFont(string faceName) => faceName == "report-bold" ? _bold : _regular;
    }
}
