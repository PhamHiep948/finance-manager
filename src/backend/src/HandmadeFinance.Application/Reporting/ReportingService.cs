using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Ledger;

namespace HandmadeFinance.Application.Reporting;

public sealed record FinancialSummary(
    string CurrencyCode,
    decimal TotalIncome,
    decimal TotalExpense,
    IReadOnlyList<LedgerEntry> Incomes,
    IReadOnlyList<LedgerEntry> Expenses
)
{
    public decimal NetResult => TotalIncome - TotalExpense;
}

public interface IReportingService
{
    Task<FinancialSummary> GetSummaryAsync(
        DateOnly? dateFrom,
        DateOnly? dateTo,
        CancellationToken ct
    );
}

public sealed class ReportingService(ILedgerRepository repository) : IReportingService
{
    public async Task<FinancialSummary> GetSummaryAsync(
        DateOnly? dateFrom,
        DateOnly? dateTo,
        CancellationToken ct
    )
    {
        if (dateFrom > dateTo)
            throw AppException.Validation("dateFrom must not be after dateTo.");

        var incomes = Filter(await repository.ListAsync(EntryKind.INCOME, ct), dateFrom, dateTo);
        var expenses = Filter(await repository.ListAsync(EntryKind.EXPENSE, ct), dateFrom, dateTo);
        return new(
            "USD",
            incomes.Sum(x => x.AmountAfterTax),
            expenses.Sum(x => x.AmountAfterTax),
            incomes,
            expenses
        );
    }

    private static List<LedgerEntry> Filter(
        IReadOnlyList<LedgerEntry> entries,
        DateOnly? dateFrom,
        DateOnly? dateTo
    ) =>
        entries
            .Where(x =>
                x.DeletedAt is null
                && (!dateFrom.HasValue || x.Date >= dateFrom)
                && (!dateTo.HasValue || x.Date <= dateTo)
            )
            .ToList();
}
