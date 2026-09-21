using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Categories;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Ledger;
using HandmadeFinance.Application.Users;
using Npgsql;

namespace HandmadeFinance.Infrastructure.Persistence;

public sealed class PostgresConnectionFactory(string connectionString)
{
    public NpgsqlConnection Create() => new(connectionString);
}

public sealed class PostgresLedgerRepository(PostgresConnectionFactory connections)
    : ILedgerRepository
{
    public async Task<IReadOnlyList<LedgerEntry>> ListAsync(EntryKind kind, CancellationToken ct)
    {
        var result = await SearchAsync(kind, new(PageSize: 100), ct);
        return result.Items;
    }

    public async Task<PageResult<LedgerEntry>> SearchAsync(
        EntryKind kind,
        LedgerQuery q,
        CancellationToken ct
    )
    {
        var table = kind == EntryKind.INCOME ? "incomes" : "expenses";
        var date = kind == EntryKind.INCOME ? "income_date" : "expense_date";
        var category = kind == EntryKind.INCOME ? "income_category_id" : "expense_category_id";
        var order = q.SortBy switch
        {
            "amount" => "amount",
            "description" => "description",
            _ => date,
        };
        var direction = q.SortDirection.Equals("asc", StringComparison.OrdinalIgnoreCase)
            ? "ASC"
            : "DESC";
        var where = "deleted_at IS NULL";
        if (!string.IsNullOrWhiteSpace(q.Search)) where += " AND description ILIKE @search";
        if (q.CategoryId.HasValue) where += $" AND {category} = @category";
        if (q.DateFrom.HasValue) where += $" AND {date} >= @from";
        if (q.DateTo.HasValue) where += $" AND {date} <= @to";

        await using var db = connections.Create();
        await db.OpenAsync(ct);
        await using var count = new NpgsqlCommand($"SELECT COUNT(*) FROM shop_finance.{table} WHERE {where}", db);
        Parameters(count, q);
        var total = (long)(await count.ExecuteScalarAsync(ct) ?? 0L);
        await using var command = new NpgsqlCommand(
            $"""
            SELECT id, {date}, description, {category}, amount, tax_percent,
                   amount_after_tax, currency_code, created_by, updated_by,
                   created_at, updated_at, deleted_at, deleted_by
            FROM shop_finance.{table}
            WHERE {where}
            ORDER BY {order} {direction}, id {direction}
            OFFSET @offset LIMIT @limit
            """,
            db
        );
        Parameters(command, q);
        command.Parameters.AddWithValue("offset", (q.Page - 1) * q.PageSize);
        command.Parameters.AddWithValue("limit", q.PageSize);
        var rows = new List<LedgerEntry>();
        await using var reader = await command.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct)) rows.Add(Read(reader, kind));
        return new(rows, q.Page, q.PageSize, total);
    }

    public async Task<LedgerEntry?> GetAsync(EntryKind kind, long id, CancellationToken ct)
    {
        var table = kind == EntryKind.INCOME ? "incomes" : "expenses";
        var date = kind == EntryKind.INCOME ? "income_date" : "expense_date";
        var category = kind == EntryKind.INCOME ? "income_category_id" : "expense_category_id";
        await using var db = connections.Create();
        await db.OpenAsync(ct);
        await using var command = new NpgsqlCommand(
            $"SELECT id, {date}, description, {category}, amount, tax_percent, " +
            $"amount_after_tax, currency_code, created_by, updated_by, created_at, " +
            $"updated_at, deleted_at, deleted_by FROM shop_finance.{table} WHERE id=@id",
            db
        );
        command.Parameters.AddWithValue("id", id);
        await using var reader = await command.ExecuteReaderAsync(ct);
        return await reader.ReadAsync(ct) ? Read(reader, kind) : null;
    }

    public async Task<LedgerEntry> AddAsync(LedgerEntry entry, CancellationToken ct)
    {
        var income = entry.Kind == EntryKind.INCOME;
        var table = income ? "incomes" : "expenses";
        var date = income ? "income_date" : "expense_date";
        var category = income ? "income_category_id" : "expense_category_id";
        await using var db = connections.Create();
        await db.OpenAsync(ct);
        await using var command = new NpgsqlCommand(
            $"INSERT INTO shop_finance.{table} ({date}, description, {category}, amount, " +
            "tax_percent, amount_after_tax, currency_code, created_by, created_at, updated_at) " +
            "VALUES (@date,@description,@category,@amount,@tax,@after,@currency,@createdBy,@createdAt,@updatedAt) RETURNING id",
            db
        );
        WriteParameters(command, entry);
        entry.Id = (long)(await command.ExecuteScalarAsync(ct))!;
        return entry;
    }

    public async Task UpdateAsync(LedgerEntry entry, CancellationToken ct)
    {
        var income = entry.Kind == EntryKind.INCOME;
        var table = income ? "incomes" : "expenses";
        var date = income ? "income_date" : "expense_date";
        var category = income ? "income_category_id" : "expense_category_id";
        await using var db = connections.Create();
        await db.OpenAsync(ct);
        await using var command = new NpgsqlCommand(
            $"UPDATE shop_finance.{table} SET {date}=@date, description=@description, " +
            $"{category}=@category, amount=@amount, tax_percent=@tax, amount_after_tax=@after, " +
            "currency_code=@currency, updated_by=@updatedBy, updated_at=@updatedAt, " +
            "deleted_at=@deletedAt, deleted_by=@deletedBy WHERE id=@id",
            db
        );
        WriteParameters(command, entry);
        command.Parameters.AddWithValue("id", entry.Id);
        await command.ExecuteNonQueryAsync(ct);
    }

    private static void Parameters(NpgsqlCommand command, LedgerQuery q)
    {
        if (!string.IsNullOrWhiteSpace(q.Search)) command.Parameters.AddWithValue("search", $"%{q.Search.Trim()}%");
        if (q.CategoryId.HasValue) command.Parameters.AddWithValue("category", q.CategoryId.Value);
        if (q.DateFrom.HasValue) command.Parameters.AddWithValue("from", q.DateFrom.Value);
        if (q.DateTo.HasValue) command.Parameters.AddWithValue("to", q.DateTo.Value);
    }

    private static void WriteParameters(NpgsqlCommand c, LedgerEntry e)
    {
        c.Parameters.AddWithValue("date", e.Date);
        c.Parameters.AddWithValue("description", e.Description);
        c.Parameters.AddWithValue("category", e.CategoryId);
        c.Parameters.AddWithValue("amount", e.Amount);
        c.Parameters.AddWithValue("tax", e.TaxPercent);
        c.Parameters.AddWithValue("after", e.AmountAfterTax);
        c.Parameters.AddWithValue("currency", e.CurrencyCode);
        c.Parameters.AddWithValue("createdBy", e.CreatedBy);
        c.Parameters.AddWithValue("createdAt", e.CreatedAt);
        c.Parameters.AddWithValue("updatedAt", e.UpdatedAt);
        c.Parameters.AddWithValue("updatedBy", (object?)e.UpdatedBy ?? DBNull.Value);
        c.Parameters.AddWithValue("deletedAt", (object?)e.DeletedAt ?? DBNull.Value);
        c.Parameters.AddWithValue("deletedBy", (object?)e.DeletedBy ?? DBNull.Value);
    }

    private static LedgerEntry Read(NpgsqlDataReader r, EntryKind kind) => new()
    {
        Id = r.GetInt64(0), Kind = kind, Date = r.GetFieldValue<DateOnly>(1),
        Description = r.GetString(2), CategoryId = r.GetInt64(3), Amount = r.GetDecimal(4),
        TaxPercent = r.GetDecimal(5), AmountAfterTax = r.GetDecimal(6), CurrencyCode = r.GetString(7),
        CreatedBy = r.IsDBNull(8) ? 0 : r.GetInt64(8), UpdatedBy = r.IsDBNull(9) ? null : r.GetInt64(9),
        CreatedAt = r.GetFieldValue<DateTimeOffset>(10), UpdatedAt = r.GetFieldValue<DateTimeOffset>(11),
        DeletedAt = r.IsDBNull(12) ? null : r.GetFieldValue<DateTimeOffset>(12),
        DeletedBy = r.IsDBNull(13) ? null : r.GetInt64(13),
    };
}

public sealed class PostgresCategoryRepository(PostgresConnectionFactory connections)
    : ICategoryRepository
{
    public async Task<IReadOnlyList<Category>> ListActiveAsync(EntryKind kind, CancellationToken ct)
    {
        var table = kind == EntryKind.INCOME ? "income_categories" : "expense_categories";
        await using var db = connections.Create(); await db.OpenAsync(ct);
        await using var command = new NpgsqlCommand($"SELECT id,name,is_active,created_at FROM shop_finance.{table} WHERE is_active AND deleted_at IS NULL ORDER BY name", db);
        var rows = new List<Category>(); await using var reader = await command.ExecuteReaderAsync(ct);
        while (await reader.ReadAsync(ct)) rows.Add(new() { Id=reader.GetInt64(0), Kind=kind, Name=reader.GetString(1), IsActive=reader.GetBoolean(2), CreatedAt=reader.GetFieldValue<DateTimeOffset>(3) });
        return rows;
    }
    public async Task<bool> ExistsAsync(long id, EntryKind kind, CancellationToken ct)
    {
        var table = kind == EntryKind.INCOME ? "income_categories" : "expense_categories";
        await using var db = connections.Create(); await db.OpenAsync(ct);
        await using var command = new NpgsqlCommand($"SELECT EXISTS(SELECT 1 FROM shop_finance.{table} WHERE id=@id AND is_active AND deleted_at IS NULL)", db);
        command.Parameters.AddWithValue("id", id); return (bool)(await command.ExecuteScalarAsync(ct))!;
    }
}

public sealed class PostgresUserRepository(PostgresConnectionFactory connections) : IUserRepository
{
    private const string Columns = "id,username,email,password_hash,full_name,phone,avatar_url,timezone,role::text,is_active,last_login_at,created_at,updated_at";

    public Task<UserAccount?> FindByEmailAsync(string email, CancellationToken ct) =>
        One("LOWER(email)=LOWER(@value) AND deleted_at IS NULL", email, ct);

    public async Task<UserAccount?> GetAsync(long id, CancellationToken ct)
    {
        await using var db=connections.Create(); await db.OpenAsync(ct);
        await using var c=new NpgsqlCommand($"SELECT {Columns} FROM shop_finance.app_users WHERE id=@id AND deleted_at IS NULL",db);
        c.Parameters.AddWithValue("id",id); await using var r=await c.ExecuteReaderAsync(ct);
        return await r.ReadAsync(ct) ? ReadUser(r) : null;
    }

    public async Task<IReadOnlyList<UserAccount>> ListAsync(CancellationToken ct)
    {
        await using var db=connections.Create(); await db.OpenAsync(ct);
        await using var c=new NpgsqlCommand($"SELECT {Columns} FROM shop_finance.app_users WHERE deleted_at IS NULL ORDER BY id LIMIT 100",db);
        var rows=new List<UserAccount>(); await using var r=await c.ExecuteReaderAsync(ct);
        while(await r.ReadAsync(ct)) rows.Add(ReadUser(r)); return rows;
    }

    public async Task<UserAccount> AddAsync(UserAccount u, CancellationToken ct)
    {
        await using var db=connections.Create(); await db.OpenAsync(ct);
        await using var c=new NpgsqlCommand("INSERT INTO shop_finance.app_users " +
        "(username,email,password_hash,full_name,phone,avatar_url,timezone,role,is_active,created_at,updated_at) " +
        "VALUES(@username,@email,@hash,@name,@phone,@avatar,@timezone,CAST(@role AS shop_finance.user_role),@active,@created,@updated) RETURNING id",db);
        UserParameters(c,u); u.Id=(long)(await c.ExecuteScalarAsync(ct))!; return u;
    }

    public async Task UpdateAsync(UserAccount u, CancellationToken ct)
    {
        await using var db=connections.Create(); await db.OpenAsync(ct);
        await using var c=new NpgsqlCommand("UPDATE shop_finance.app_users SET username=@username,email=@email, " +
        "password_hash=@hash,full_name=@name,phone=@phone,avatar_url=@avatar,timezone=@timezone, " +
        "role=CAST(@role AS shop_finance.user_role),is_active=@active,last_login_at=@lastLogin,updated_at=@updated WHERE id=@id",db);
        UserParameters(c,u); c.Parameters.AddWithValue("id",u.Id); await c.ExecuteNonQueryAsync(ct);
    }

    public async Task<bool> UsernameOrEmailExistsAsync(string username,string email,long? excludingId,CancellationToken ct)
    {
        await using var db=connections.Create(); await db.OpenAsync(ct);
        await using var c=new NpgsqlCommand("SELECT EXISTS(SELECT 1 FROM shop_finance.app_users " +
        "WHERE deleted_at IS NULL AND (@except IS NULL OR id<>@except) " +
        "AND (LOWER(username)=LOWER(@username) OR LOWER(email)=LOWER(@email)))",db);
        c.Parameters.AddWithValue("except",(object?)excludingId??DBNull.Value); c.Parameters.AddWithValue("username",username); c.Parameters.AddWithValue("email",email);
        return (bool)(await c.ExecuteScalarAsync(ct))!;
    }

    private async Task<UserAccount?> One(string where,string value,CancellationToken ct)
    {
        await using var db=connections.Create(); await db.OpenAsync(ct);
        await using var c=new NpgsqlCommand($"SELECT {Columns} FROM shop_finance.app_users WHERE {where}",db);
        c.Parameters.AddWithValue("value",value); await using var r=await c.ExecuteReaderAsync(ct);
        return await r.ReadAsync(ct)?ReadUser(r):null;
    }

    private static void UserParameters(NpgsqlCommand c,UserAccount u)
    {
        c.Parameters.AddWithValue("username",u.Username); c.Parameters.AddWithValue("email",u.Email);
        c.Parameters.AddWithValue("hash",u.PasswordHash); c.Parameters.AddWithValue("name",u.FullName);
        c.Parameters.AddWithValue("phone",(object?)u.Phone??DBNull.Value); c.Parameters.AddWithValue("avatar",(object?)u.AvatarUrl??DBNull.Value);
        c.Parameters.AddWithValue("timezone",u.Timezone); c.Parameters.AddWithValue("role",u.Role.ToString());
        c.Parameters.AddWithValue("active",u.IsActive); c.Parameters.AddWithValue("lastLogin",(object?)u.LastLoginAt??DBNull.Value);
        c.Parameters.AddWithValue("created",u.CreatedAt); c.Parameters.AddWithValue("updated",u.UpdatedAt);
    }

    private static UserAccount ReadUser(NpgsqlDataReader r)=>new()
    {
        Id=r.GetInt64(0),Username=r.GetString(1),Email=r.IsDBNull(2)?"":r.GetString(2),PasswordHash=r.GetString(3),
        FullName=r.GetString(4),Phone=r.IsDBNull(5)?null:r.GetString(5),AvatarUrl=r.IsDBNull(6)?null:r.GetString(6),
        Timezone=r.GetString(7),Role=Enum.Parse<UserRole>(r.GetString(8)),IsActive=r.GetBoolean(9),
        LastLoginAt=r.IsDBNull(10)?null:r.GetFieldValue<DateTimeOffset>(10),CreatedAt=r.GetFieldValue<DateTimeOffset>(11),UpdatedAt=r.GetFieldValue<DateTimeOffset>(12)
    };
}
