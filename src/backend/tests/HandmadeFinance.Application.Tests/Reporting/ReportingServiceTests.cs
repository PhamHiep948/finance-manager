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
