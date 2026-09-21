namespace HandmadeFinance.Application.Reporting;

/// <summary>Dữ liệu đầu vào để dựng tệp báo cáo.</summary>
public sealed record ReportDocumentData(
    FinancialSummary Summary,
    DateOnly? From,
    DateOnly? To,
    IReadOnlyDictionary<long, string> IncomeCategories,
    IReadOnlyDictionary<long, string> ExpenseCategories,
    DateTimeOffset GeneratedAt
);

/// <summary>Dựng tệp báo cáo tài chính hợp lệ (PDF, XLSX) từ số liệu đã tổng hợp.</summary>
public interface IReportDocumentBuilder
{
    byte[] BuildPdf(ReportDocumentData data);

    byte[] BuildXlsx(ReportDocumentData data);
}
