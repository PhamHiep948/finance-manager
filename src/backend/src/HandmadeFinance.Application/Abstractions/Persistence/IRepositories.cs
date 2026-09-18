using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Ledger;
using HandmadeFinance.Application.Users;

namespace HandmadeFinance.Application.Abstractions.Persistence;

public interface ILedgerRepository
{
    Task<IReadOnlyList<LedgerEntry>> ListAsync(EntryKind kind, CancellationToken ct);
    Task<LedgerEntry?> GetAsync(EntryKind kind, long id, CancellationToken ct);
    Task<LedgerEntry> AddAsync(LedgerEntry entry, CancellationToken ct);
    Task UpdateAsync(LedgerEntry entry, CancellationToken ct);
    async Task<PageResult<LedgerEntry>> SearchAsync(
        EntryKind kind,
        LedgerQuery query,
        CancellationToken ct
    )
    {
        IEnumerable<LedgerEntry> rows = (await ListAsync(kind, ct)).Where(x => x.DeletedAt is null);
        if (!string.IsNullOrWhiteSpace(query.Search))
            rows = rows.Where(x =>
                x.Description.Contains(query.Search.Trim(), StringComparison.OrdinalIgnoreCase)
            );
        if (query.CategoryId.HasValue)
            rows = rows.Where(x => x.CategoryId == query.CategoryId);
        if (query.DateFrom.HasValue)
            rows = rows.Where(x => x.Date >= query.DateFrom);
        if (query.DateTo.HasValue)
            rows = rows.Where(x => x.Date <= query.DateTo);
        rows = query.SortDirection.Equals("asc", StringComparison.OrdinalIgnoreCase)
            ? rows.OrderBy(x => x.Date).ThenBy(x => x.Id)
            : rows.OrderByDescending(x => x.Date).ThenByDescending(x => x.Id);
        var all = rows.ToList();
        return new(
            all.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToList(),
            query.Page,
            query.PageSize,
            all.Count
        );
    }
}

public interface IUserRepository
{
    Task<UserAccount?> FindByEmailAsync(string email, CancellationToken ct);
    Task<UserAccount?> GetAsync(long id, CancellationToken ct);
    Task<IReadOnlyList<UserAccount>> ListAsync(CancellationToken ct);
    Task<UserAccount> AddAsync(UserAccount user, CancellationToken ct);
    Task UpdateAsync(UserAccount user, CancellationToken ct);
    Task<bool> UsernameOrEmailExistsAsync(
        string username,
        string email,
        long? excludingId,
        CancellationToken ct
    );
}

public interface IPasswordService
{
    string Hash(string password);
    bool Verify(string hash, string password);
}

public interface ITokenIssuer
{
    string Issue(UserAccount user, DateTimeOffset expiresAt);
}

public interface IClock
{
    DateTimeOffset UtcNow { get; }
}
