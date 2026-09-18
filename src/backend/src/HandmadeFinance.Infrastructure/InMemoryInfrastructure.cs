using System.Security.Cryptography;
using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Ledger;
using HandmadeFinance.Application.Users;

namespace HandmadeFinance.Infrastructure;

public sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}

public sealed class PasswordService : IPasswordService
{
    public string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(16);
        var hash = Rfc2898DeriveBytes.Pbkdf2(password, salt, 100_000, HashAlgorithmName.SHA256, 32);
        return $"{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
    }

    public bool Verify(string encoded, string password)
    {
        var p = encoded.Split('.');
        if (p.Length != 2)
            return false;
        try
        {
            var salt = Convert.FromBase64String(p[0]);
            var expected = Convert.FromBase64String(p[1]);
            var actual = Rfc2898DeriveBytes.Pbkdf2(
                password,
                salt,
                100_000,
                HashAlgorithmName.SHA256,
                32
            );
            return CryptographicOperations.FixedTimeEquals(actual, expected);
        }
        catch
        {
            return false;
        }
    }
}

public sealed class InMemoryStore : ILedgerRepository, IUserRepository
{
    private readonly List<LedgerEntry> _entries = [];
    private readonly List<UserAccount> _users = [];
    private long _entryId;
    private long _userId;

    public InMemoryStore(IPasswordService passwords, IClock clock)
    {
        var now = clock.UtcNow;
        _users.Add(
            new UserAccount
            {
                Id = ++_userId,
                Username = "admin",
                Email = "admin@handmade.local",
                PasswordHash = passwords.Hash("ChangeMe123!"),
                FullName = "Administrator",
                Role = UserRole.ADMIN,
                IsActive = true,
                CreatedAt = now,
                UpdatedAt = now,
            }
        );
    }

    public Task<IReadOnlyList<LedgerEntry>> ListAsync(EntryKind kind, CancellationToken ct) =>
        Task.FromResult<IReadOnlyList<LedgerEntry>>(_entries.Where(x => x.Kind == kind).ToList());

    public Task<LedgerEntry?> GetAsync(EntryKind kind, long id, CancellationToken ct) =>
        Task.FromResult(_entries.SingleOrDefault(x => x.Kind == kind && x.Id == id));

    public Task<LedgerEntry> AddAsync(LedgerEntry e, CancellationToken ct)
    {
        e.Id = ++_entryId;
        _entries.Add(e);
        return Task.FromResult(e);
    }

    public Task UpdateAsync(LedgerEntry e, CancellationToken ct) => Task.CompletedTask;

    public Task<UserAccount?> FindByEmailAsync(string email, CancellationToken ct) =>
        Task.FromResult(
            _users.SingleOrDefault(x => x.Email.Equals(email, StringComparison.OrdinalIgnoreCase))
        );

    Task<UserAccount?> IUserRepository.GetAsync(long id, CancellationToken ct) =>
        Task.FromResult(_users.SingleOrDefault(x => x.Id == id));

    public Task<IReadOnlyList<UserAccount>> ListAsync(CancellationToken ct) =>
        Task.FromResult<IReadOnlyList<UserAccount>>(_users.ToList());

    public Task<UserAccount> AddAsync(UserAccount u, CancellationToken ct)
    {
        u.Id = ++_userId;
        _users.Add(u);
        return Task.FromResult(u);
    }

    public Task UpdateAsync(UserAccount u, CancellationToken ct) => Task.CompletedTask;

    public Task<bool> UsernameOrEmailExistsAsync(
        string name,
        string email,
        long? except,
        CancellationToken ct
    ) =>
        Task.FromResult(
            _users.Any(x =>
                x.Id != except
                && (
                    x.Username.Equals(name, StringComparison.OrdinalIgnoreCase)
                    || x.Email.Equals(email, StringComparison.OrdinalIgnoreCase)
                )
            )
        );
}
