using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Common;

namespace HandmadeFinance.Application.Ledger;

public interface ILedgerService
{
    Task<PageResult<LedgerEntry>> ListAsync(EntryKind kind, LedgerQuery query, CancellationToken ct);
    Task<LedgerEntry> GetAsync(EntryKind kind, long id, CancellationToken ct);
    Task<LedgerEntry> CreateAsync(EntryKind kind, LedgerWrite request, Actor actor, CancellationToken ct);
    Task<LedgerEntry> UpdateAsync(EntryKind kind, long id, LedgerWrite request, Actor actor, CancellationToken ct);
    Task DeleteAsync(EntryKind kind, long id, Actor actor, CancellationToken ct);
}

public sealed class LedgerService(ILedgerRepository repository, IClock clock) : ILedgerService
{
    public async Task<PageResult<LedgerEntry>> ListAsync(EntryKind kind, LedgerQuery q, CancellationToken ct)
    {
        ValidatePage(q); ValidateRange(q.DateFrom, q.DateTo);
        var rows = (await repository.ListAsync(kind, ct)).Where(x => x.DeletedAt is null);
        if (!string.IsNullOrWhiteSpace(q.Search)) rows = rows.Where(x => x.Description.Contains(q.Search.Trim(), StringComparison.OrdinalIgnoreCase));
        if (q.DateFrom is not null) rows = rows.Where(x => x.Date >= q.DateFrom);
        if (q.DateTo is not null) rows = rows.Where(x => x.Date <= q.DateTo);
        var ordered = rows.OrderByDescending(x => x.Date).ThenByDescending(x => x.Id).ToList();
        return new(ordered.Skip((q.Page - 1) * q.PageSize).Take(q.PageSize).ToList(), q.Page, q.PageSize, ordered.Count);
    }

    public async Task<LedgerEntry> GetAsync(EntryKind kind, long id, CancellationToken ct) =>
        await repository.GetAsync(kind, id, ct) is { DeletedAt: null } row ? row : throw AppException.NotFound(kind.ToString().ToLowerInvariant());

    public async Task<LedgerEntry> CreateAsync(EntryKind kind, LedgerWrite request, Actor actor, CancellationToken ct)
    {
        RequireWrite(actor); Validate(request);
        var now = clock.UtcNow;
        return await repository.AddAsync(new LedgerEntry { Kind = kind, Date = request.Date, Description = request.Description.Trim(), CategoryId = request.CategoryId,
            Amount = request.Amount, TaxPercent = request.TaxPercent, AmountAfterTax = request.AmountAfterTax, CurrencyCode = request.CurrencyCode,
            CreatedBy = actor.UserId, CreatedAt = now, UpdatedAt = now }, ct);
    }

    public async Task<LedgerEntry> UpdateAsync(EntryKind kind, long id, LedgerWrite request, Actor actor, CancellationToken ct)
    {
        RequireWrite(actor); Validate(request); var row = await GetAsync(kind, id, ct);
        if (actor.Role == UserRole.EMPLOYEE && row.CreatedBy != actor.UserId) throw AppException.Forbidden();
        row.Date = request.Date; row.Description = request.Description.Trim(); row.CategoryId = request.CategoryId;
        row.Amount = request.Amount; row.TaxPercent = request.TaxPercent; row.AmountAfterTax = request.AmountAfterTax;
        row.UpdatedBy = actor.UserId; row.UpdatedAt = clock.UtcNow; await repository.UpdateAsync(row, ct); return row;
    }

    public async Task DeleteAsync(EntryKind kind, long id, Actor actor, CancellationToken ct)
    {
        if (actor.Role is not (UserRole.ADMIN or UserRole.SHOP_OWNER)) throw AppException.Forbidden();
        var row = await GetAsync(kind, id, ct); row.DeletedAt = clock.UtcNow; row.DeletedBy = actor.UserId; row.UpdatedAt = clock.UtcNow;
        await repository.UpdateAsync(row, ct);
    }

    private static void RequireWrite(Actor actor) { if (actor.Role == UserRole.VIEWER) throw AppException.Forbidden(); }
    private static void ValidatePage(LedgerQuery q) { if (q.Page < 1 || q.PageSize is < 1 or > 100) throw AppException.Validation("page must be >= 1 and pageSize between 1 and 100."); }
    private static void ValidateRange(DateOnly? from, DateOnly? to) { if (from > to) throw AppException.Validation("dateFrom must not be after dateTo."); }
    private static void Validate(LedgerWrite r)
    {
        if (string.IsNullOrWhiteSpace(r.Description) || r.CategoryId < 1 || r.Amount < 0 || r.TaxPercent is < 0 or > 100 || r.CurrencyCode != "USD")
            throw AppException.Validation("Invalid ledger values.");
        var expected = decimal.Round(r.Amount * (1 + r.TaxPercent / 100m), 2, MidpointRounding.AwayFromZero);
        if (expected != r.AmountAfterTax) throw AppException.Validation("amountAfterTax is inconsistent with amount and taxPercent.");
    }
}
