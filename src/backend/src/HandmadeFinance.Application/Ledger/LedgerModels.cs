using HandmadeFinance.Application.Common;

namespace HandmadeFinance.Application.Ledger;

public sealed class LedgerEntry
{
    public long Id { get; set; }
    public EntryKind Kind { get; init; }
    public DateOnly Date { get; set; }
    public string Description { get; set; } = "";
    public long CategoryId { get; set; }
    public decimal Amount { get; set; }
    public decimal TaxPercent { get; set; }
    public decimal AmountAfterTax { get; set; }
    public string CurrencyCode { get; set; } = "USD";
    public long CreatedBy { get; init; }
    public long? UpdatedBy { get; set; }
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }
    public long? DeletedBy { get; set; }
}

public sealed record LedgerWrite(DateOnly Date, string Description, long CategoryId, decimal Amount,
    decimal TaxPercent, decimal AmountAfterTax, string CurrencyCode = "USD");
public sealed record LedgerQuery(int Page = 1, int PageSize = 20, string? Search = null,
    DateOnly? DateFrom = null, DateOnly? DateTo = null);
