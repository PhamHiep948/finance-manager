using System.Security.Cryptography;
using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Categories;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Ledger;
using HandmadeFinance.Application.Users;

namespace HandmadeFinance.Infrastructure;

public sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}

public sealed class InMemoryCategoryRepository : ICategoryRepository
{
    private static readonly Category[] Items =
    [
        new() { Id = 1, Kind = EntryKind.INCOME, Name = "TEST SALES", CreatedAt = DateTimeOffset.UnixEpoch },
        new() { Id = 2, Kind = EntryKind.INCOME, Name = "TEST SERVICES", CreatedAt = DateTimeOffset.UnixEpoch },
        new() { Id = 3, Kind = EntryKind.EXPENSE, Name = "TEST MATERIALS", CreatedAt = DateTimeOffset.UnixEpoch },
        new() { Id = 4, Kind = EntryKind.EXPENSE, Name = "TEST SHIPPING", CreatedAt = DateTimeOffset.UnixEpoch },
    ];

    public Task<IReadOnlyList<Category>> ListActiveAsync(EntryKind kind, CancellationToken ct) =>
        Task.FromResult<IReadOnlyList<Category>>(Items.Where(x => x.Kind == kind && x.IsActive).ToList());

    public Task<bool> ExistsAsync(long id, EntryKind kind, CancellationToken ct) =>
        Task.FromResult(Items.Any(x => x.Id == id && x.Kind == kind && x.IsActive));
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
    private readonly object _gate = new();
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

    public Task<IReadOnlyList<LedgerEntry>> ListAsync(EntryKind kind, CancellationToken ct)
    {
        lock (_gate)
            return Task.FromResult<IReadOnlyList<LedgerEntry>>(
                _entries.Where(x => x.Kind == kind).Select(Clone).ToList()
            );
    }

    public Task<LedgerEntry?> GetAsync(EntryKind kind, long id, CancellationToken ct)
    {
        lock (_gate)
            return Task.FromResult(
                _entries.SingleOrDefault(x => x.Kind == kind && x.Id == id) is { } entry
                    ? Clone(entry)
                    : null
            );
    }

    public Task<LedgerEntry> AddAsync(LedgerEntry e, CancellationToken ct)
    {
        lock (_gate)
        {
            e.Id = ++_entryId;
            var stored = Clone(e);
            _entries.Add(stored);
            return Task.FromResult(Clone(stored));
        }
    }

    public Task UpdateAsync(LedgerEntry e, CancellationToken ct)
    {
        lock (_gate)
        {
            var index = _entries.FindIndex(x => x.Id == e.Id && x.Kind == e.Kind);
            if (index >= 0)
                _entries[index] = Clone(e);
            return Task.CompletedTask;
        }
    }

    public Task<UserAccount?> FindByEmailAsync(string email, CancellationToken ct)
    {
        lock (_gate)
            return Task.FromResult(
                _users.SingleOrDefault(x => x.Email.Equals(email, StringComparison.OrdinalIgnoreCase))
                    is { } user
                    ? Clone(user)
                    : null
            );
    }

    Task<UserAccount?> IUserRepository.GetAsync(long id, CancellationToken ct)
    {
        lock (_gate)
            return Task.FromResult(
                _users.SingleOrDefault(x => x.Id == id) is { } user ? Clone(user) : null
            );
    }

    public Task<IReadOnlyList<UserAccount>> ListAsync(CancellationToken ct)
    {
        lock (_gate)
            return Task.FromResult<IReadOnlyList<UserAccount>>(_users.Select(Clone).ToList());
    }

    public Task<UserAccount> AddAsync(UserAccount u, CancellationToken ct)
    {
        lock (_gate)
        {
            u.Id = ++_userId;
            var stored = Clone(u);
            _users.Add(stored);
            return Task.FromResult(Clone(stored));
        }
    }

    public Task UpdateAsync(UserAccount u, CancellationToken ct)
    {
        lock (_gate)
        {
            var index = _users.FindIndex(x => x.Id == u.Id);
            if (index >= 0)
                _users[index] = Clone(u);
            return Task.CompletedTask;
        }
    }

    public Task<bool> UsernameOrEmailExistsAsync(
        string name,
        string email,
        long? except,
        CancellationToken ct
    )
    {
        lock (_gate)
            return Task.FromResult(
                _users.Any(x =>
                x.Id != except
                && (
                    x.Username.Equals(name, StringComparison.OrdinalIgnoreCase)
                    || x.Email.Equals(email, StringComparison.OrdinalIgnoreCase)
                )
            )
        );
    }

    private static LedgerEntry Clone(LedgerEntry x) =>
        new()
        {
            Id = x.Id,
            Kind = x.Kind,
            Date = x.Date,
            Description = x.Description,
            CategoryId = x.CategoryId,
            Amount = x.Amount,
            TaxPercent = x.TaxPercent,
            AmountAfterTax = x.AmountAfterTax,
            CurrencyCode = x.CurrencyCode,
            CreatedBy = x.CreatedBy,
            UpdatedBy = x.UpdatedBy,
            CreatedAt = x.CreatedAt,
            UpdatedAt = x.UpdatedAt,
            DeletedAt = x.DeletedAt,
            DeletedBy = x.DeletedBy,
        };

    private static UserAccount Clone(UserAccount x) =>
        new()
        {
            Id = x.Id,
            Username = x.Username,
            Email = x.Email,
            PasswordHash = x.PasswordHash,
            FullName = x.FullName,
            Phone = x.Phone,
            AvatarUrl = x.AvatarUrl,
            Timezone = x.Timezone,
            Role = x.Role,
            IsActive = x.IsActive,
            CreatedAt = x.CreatedAt,
            UpdatedAt = x.UpdatedAt,
            LastLoginAt = x.LastLoginAt,
        };
}
