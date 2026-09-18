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
