using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Categories;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Ledger;
using HandmadeFinance.Application.Users;
using Microsoft.EntityFrameworkCore;

namespace HandmadeFinance.Infrastructure.Persistence.Repositories;

public sealed class EfLedgerRepository(AppDbContext db) : ILedgerRepository
{
    public async Task<PageResult<LedgerEntry>> SearchAsync(EntryKind kind, LedgerQuery q, CancellationToken ct)
    {
        var rows = db.LedgerEntries.AsNoTracking().Where(x => x.Kind == kind && x.DeletedAt == null);
        if (!string.IsNullOrWhiteSpace(q.Search)) rows = rows.Where(x => EF.Functions.ILike(x.Description, $"%{q.Search.Trim()}%"));
        if (q.CategoryId.HasValue) rows = rows.Where(x => x.CategoryId == q.CategoryId);
        if (q.DateFrom.HasValue) rows = rows.Where(x => x.Date >= q.DateFrom);
        if (q.DateTo.HasValue) rows = rows.Where(x => x.Date <= q.DateTo);
        rows = (q.SortBy, q.SortDirection.ToLowerInvariant()) switch
        {
            ("amount", "asc") => rows.OrderBy(x => x.Amount).ThenBy(x => x.Id),
            ("amount", _) => rows.OrderByDescending(x => x.Amount).ThenByDescending(x => x.Id),
            ("description", "asc") => rows.OrderBy(x => x.Description).ThenBy(x => x.Id),
            ("description", _) => rows.OrderByDescending(x => x.Description).ThenByDescending(x => x.Id),
            (_, "asc") => rows.OrderBy(x => x.Date).ThenBy(x => x.Id),
            _ => rows.OrderByDescending(x => x.Date).ThenByDescending(x => x.Id),
        };
        var total = await rows.LongCountAsync(ct);
        var items = await rows.Skip((q.Page - 1) * q.PageSize).Take(q.PageSize).ToListAsync(ct);
        return new(items, q.Page, q.PageSize, total);
    }

    public async Task<IReadOnlyList<LedgerEntry>> ListAsync(EntryKind kind, CancellationToken ct) =>
        await db.LedgerEntries.AsNoTracking().Where(x => x.Kind == kind && x.DeletedAt == null).ToListAsync(ct);
    public Task<LedgerEntry?> GetAsync(EntryKind kind, long id, CancellationToken ct) =>
        db.LedgerEntries.SingleOrDefaultAsync(x => x.Kind == kind && x.Id == id, ct);
    public async Task<LedgerEntry> AddAsync(LedgerEntry entry, CancellationToken ct)
    { db.LedgerEntries.Add(entry); await db.SaveChangesAsync(ct); return entry; }
    public async Task UpdateAsync(LedgerEntry entry, CancellationToken ct)
    { db.LedgerEntries.Update(entry); await db.SaveChangesAsync(ct); }
}

public sealed class EfUserRepository(AppDbContext db) : IUserRepository
{
    public Task<UserAccount?> FindByEmailAsync(string email, CancellationToken ct) =>
        db.Users.SingleOrDefaultAsync(x => EF.Functions.ILike(x.Email, email), ct);
    public Task<UserAccount?> GetAsync(long id, CancellationToken ct) => db.Users.SingleOrDefaultAsync(x => x.Id == id, ct);
    public async Task<IReadOnlyList<UserAccount>> ListAsync(CancellationToken ct) => await db.Users.AsNoTracking().OrderBy(x => x.Id).Take(100).ToListAsync(ct);
    public async Task<UserAccount> AddAsync(UserAccount user, CancellationToken ct) { db.Users.Add(user); await db.SaveChangesAsync(ct); return user; }
    public async Task UpdateAsync(UserAccount user, CancellationToken ct) { db.Users.Update(user); await db.SaveChangesAsync(ct); }
    public Task<bool> UsernameOrEmailExistsAsync(string username, string email, long? excludingId, CancellationToken ct) =>
        db.Users.AnyAsync(
            x => x.Id != excludingId
                && (EF.Functions.ILike(x.Username, username) || EF.Functions.ILike(x.Email, email)),
            ct
        );
}

public sealed class EfCategoryRepository(AppDbContext db) : ICategoryRepository
{
    public async Task<IReadOnlyList<Category>> ListActiveAsync(EntryKind kind, CancellationToken ct) =>
        await db.Categories.AsNoTracking().Where(x => x.Kind == kind && x.IsActive).OrderBy(x => x.Name).ToListAsync(ct);
    public Task<bool> ExistsAsync(long id, EntryKind kind, CancellationToken ct) =>
        db.Categories.AnyAsync(x => x.Id == id && x.Kind == kind && x.IsActive, ct);
}
