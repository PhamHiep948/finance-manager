using Npgsql;
using Xunit;

namespace HandmadeFinance.Infrastructure.Tests.Postgres;

/// <summary>Checks that applying <c>src/database/shop_finance.sql</c> to an empty database yields the schema the API relies on.</summary>
public sealed class PostgresSchemaTests(PostgresDatabase database) : IClassFixture<PostgresDatabase>
{
    private async Task<List<string>> Column(string sql)
    {
        await using var connection = new NpgsqlConnection(database.ConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        await using var reader = await command.ExecuteReaderAsync();
        var values = new List<string>();
        while (await reader.ReadAsync())
            values.Add(reader.GetString(0));
        return values;
    }

    [PostgresTheory]
    [InlineData("app_users")]
    [InlineData("income_categories")]
    [InlineData("expense_categories")]
    [InlineData("incomes")]
    [InlineData("expenses")]
    [InlineData("attachments")]
    [InlineData("import_batches")]
    [InlineData("audit_logs")]
    public async Task Expected_tables_exist(string table)
    {
        var tables = await Column("SELECT table_name FROM information_schema.tables WHERE table_schema = 'shop_finance'");
        Assert.Contains(table, tables);
    }

    [PostgresTheory]
    [InlineData("user_role")]
    [InlineData("sale_region")]
    [InlineData("sales_channel")]
    [InlineData("origin_scope")]
    [InlineData("payment_method")]
    public async Task Expected_enum_types_exist(string type)
    {
        var types = await Column("SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'shop_finance' AND t.typtype = 'e'");
        Assert.Contains(type, types);
    }

    [PostgresTheory]
    [InlineData("incomes", "order_code")]
    [InlineData("incomes", "sale_region")]
    [InlineData("incomes", "sales_channel")]
    [InlineData("incomes", "product_qty")]
    [InlineData("expenses", "payee")]
    [InlineData("expenses", "origin_scope")]
    [InlineData("expenses", "payment_method")]
    public async Task Columns_used_by_the_ledger_repository_exist(string table, string column)
    {
        var columns = await Column($"SELECT column_name FROM information_schema.columns WHERE table_schema = 'shop_finance' AND table_name = '{table}'");
        Assert.Contains(column, columns);
    }

    [PostgresFact]
    public async Task Schema_script_cannot_be_applied_twice_to_the_same_database()
    {
        // The script initializes a new database; re-running it must fail loudly instead of corrupting data.
        var script = await File.ReadAllTextAsync(Path.Combine(FindRoot(), "src", "database", "shop_finance.sql"));
        await using var connection = new NpgsqlConnection(database.ConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(script, connection);
        await Assert.ThrowsAsync<PostgresException>(() => command.ExecuteNonQueryAsync());
    }

    [PostgresFact]
    public async Task An_attachment_must_belong_to_exactly_one_record()
    {
        var ex = await Assert.ThrowsAsync<PostgresException>(() => database.ExecuteAsync(
            "INSERT INTO shop_finance.attachments (original_name, stored_file_path, mime_type, file_size_bytes) VALUES ('a.pdf', 'k', 'application/pdf', 1)"));
        Assert.True(ex.SqlState is "23514" or "23502", $"unexpected SQLSTATE {ex.SqlState}");
    }

    [PostgresFact]
    public async Task Users_cannot_have_an_unknown_role()
    {
        var ex = await Assert.ThrowsAsync<PostgresException>(() => database.ExecuteAsync(
            "INSERT INTO shop_finance.app_users (username, email, password_hash, full_name, role) VALUES ('x', 'x@example.com', 'h', 'X', 'ROOT')"));
        Assert.Equal("22P02", ex.SqlState);
    }

    private static string FindRoot()
    {
        for (var dir = new DirectoryInfo(AppContext.BaseDirectory); dir is not null; dir = dir.Parent)
            if (File.Exists(Path.Combine(dir.FullName, "src", "database", "shop_finance.sql")))
                return dir.FullName;
        throw new FileNotFoundException("Repository root not found.");
    }
}
