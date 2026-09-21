using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Ledger;
using HandmadeFinance.Application.Reporting;
using Xunit;

namespace HandmadeFinance.Application.Tests.Reporting;

public sealed class ReportingServiceTests
{
    [Fact]
    public async Task Summary_applies_date_range_and_excludes_deleted_entries()
    {
        var repository = new StubLedgerRepository(
            [
                Entry(1, EntryKind.INCOME, new(2026, 9, 1), 100),
                Entry(2, EntryKind.INCOME, new(2026, 8, 31), 200),
                Entry(3, EntryKind.INCOME, new(2026, 9, 2), 300, deleted: true),
                Entry(4, EntryKind.EXPENSE, new(2026, 9, 2), 40),
            ]
        );

        var result = await new ReportingService(repository).GetSummaryAsync(
            new(2026, 9, 1),
            new(2026, 9, 30),
            default
        );

        Assert.Equal(100, result.TotalIncome);
        Assert.Equal(40, result.TotalExpense);
        Assert.Equal(60, result.NetResult);
        Assert.Single(result.Incomes);
        Assert.Single(result.Expenses);
    }

    [Fact]
    public async Task Summary_rejects_an_inverted_date_range()
    {
        var service = new ReportingService(new StubLedgerRepository([]));

        var error = await Assert.ThrowsAsync<AppException>(() =>
            service.GetSummaryAsync(new(2026, 9, 2), new(2026, 9, 1), default)
        );

        Assert.Equal("VALIDATION_ERROR", error.Code);
    }

    [Fact]
    public async Task Summary_without_a_range_includes_every_active_entry()
    {
        var repository = new StubLedgerRepository(
            [
                Entry(1, EntryKind.INCOME, new(2020, 1, 1), 10),
                Entry(2, EntryKind.INCOME, new(2030, 12, 31), 20),
                Entry(3, EntryKind.EXPENSE, new(2026, 6, 1), 5),
            ]
        );
        var result = await new ReportingService(repository).GetSummaryAsync(null, null, default);
        Assert.Equal((30m, 5m, 25m), (result.TotalIncome, result.TotalExpense, result.NetResult));
    }

    [Fact]
    public async Task Summary_range_boundaries_are_inclusive()
    {
        var repository = new StubLedgerRepository(
            [
                Entry(1, EntryKind.INCOME, new(2026, 9, 1), 1),
                Entry(2, EntryKind.INCOME, new(2026, 9, 30), 2),
                Entry(3, EntryKind.INCOME, new(2026, 8, 31), 4),
                Entry(4, EntryKind.INCOME, new(2026, 10, 1), 8),
            ]
        );
        var result = await new ReportingService(repository).GetSummaryAsync(
            new(2026, 9, 1),
            new(2026, 9, 30),
            default
        );
        Assert.Equal(3m, result.TotalIncome);
    }

    [Fact]
    public async Task Summary_supports_open_ended_ranges()
    {
        var repository = new StubLedgerRepository(
            [
                Entry(1, EntryKind.INCOME, new(2026, 9, 1), 1),
                Entry(2, EntryKind.INCOME, new(2026, 9, 10), 2),
            ]
        );
        var service = new ReportingService(repository);
        Assert.Equal(2m, (await service.GetSummaryAsync(new(2026, 9, 5), null, default)).TotalIncome);
        Assert.Equal(1m, (await service.GetSummaryAsync(null, new(2026, 9, 5), default)).TotalIncome);
    }

    [Fact]
    public async Task Summary_totals_use_the_after_tax_amount()
    {
        var taxed = Entry(1, EntryKind.INCOME, new(2026, 9, 1), 100);
        taxed.TaxPercent = 10;
        taxed.AmountAfterTax = 110;
        var result = await new ReportingService(new StubLedgerRepository([taxed])).GetSummaryAsync(
            null,
            null,
            default
        );
        Assert.Equal(110m, result.TotalIncome);
        Assert.Equal("USD", result.CurrencyCode);
    }

    [Fact]
    public async Task Summary_of_nothing_is_all_zero()
    {
        var result = await new ReportingService(new StubLedgerRepository([])).GetSummaryAsync(
            null,
            null,
            default
        );
        Assert.Equal((0m, 0m, 0m), (result.TotalIncome, result.TotalExpense, result.NetResult));
        Assert.Empty(result.Incomes);
        Assert.Empty(result.Expenses);
    }

    [Fact]
    public async Task Summary_accepts_a_single_day_range()
    {
        var repository = new StubLedgerRepository([Entry(1, EntryKind.INCOME, new(2026, 9, 1), 7)]);
        var result = await new ReportingService(repository).GetSummaryAsync(
            new(2026, 9, 1),
            new(2026, 9, 1),
            default
        );
        Assert.Equal(7m, result.TotalIncome);
    }

    private static LedgerEntry Entry(
        long id,
        EntryKind kind,
        DateOnly date,
        decimal amount,
        bool deleted = false
    ) =>
        new()
        {
            Id = id,
            Kind = kind,
            Date = date,
            Description = "entry",
            CategoryId = 1,
            Amount = amount,
            AmountAfterTax = amount,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            DeletedAt = deleted ? DateTimeOffset.UtcNow : null,
        };

    private sealed class StubLedgerRepository(IReadOnlyList<LedgerEntry> entries)
        : ILedgerRepository
    {
        public Task<IReadOnlyList<LedgerEntry>> ListAsync(EntryKind kind, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<LedgerEntry>>(entries.Where(x => x.Kind == kind).ToList());

        public Task<LedgerEntry?> GetAsync(EntryKind kind, long id, CancellationToken ct) =>
            Task.FromResult(entries.SingleOrDefault(x => x.Kind == kind && x.Id == id));

        public Task<LedgerEntry> AddAsync(LedgerEntry entry, CancellationToken ct) =>
            throw new NotSupportedException();

        public Task UpdateAsync(LedgerEntry entry, CancellationToken ct) =>
            throw new NotSupportedException();
    }
}
