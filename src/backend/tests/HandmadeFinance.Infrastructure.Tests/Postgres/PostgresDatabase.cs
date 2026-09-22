using HandmadeFinance.Infrastructure.Persistence;
using Npgsql;
using Xunit;

namespace HandmadeFinance.Infrastructure.Tests.Postgres;

/// <summary>
/// Creates a throw-away PostgreSQL database, applies <c>src/database/shop_finance.sql</c> to it, and drops it afterwards.
/// Set <c>HANDMADE_TEST_PG</c> to an admin connection string that may create databases, for example
/// <c>Host=localhost;Port=5432;Username=postgres;Password=...;Database=postgres</c>.
/// Without the variable the tests are skipped.
/// </summary>
public sealed class PostgresDatabase : IAsyncLifetime
{
    public const string EnvVar = "HANDMADE_TEST_PG";

    private string? _databaseName;

    public static bool Configured => !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable(EnvVar));

    public string ConnectionString { get; private set; } = "";

    public PostgresConnectionFactory Connections { get; private set; } = new("");

    public async Task InitializeAsync()
    {
        if (!Configured)
            return;

        var admin = Environment.GetEnvironmentVariable(EnvVar)!;
        _databaseName = $"hf_it_{Guid.NewGuid():N}";
        await using (var connection = new NpgsqlConnection(admin))
        {
            await connection.OpenAsync();
            await using var create = new NpgsqlCommand($"CREATE DATABASE \"{_databaseName}\"", connection);
            await create.ExecuteNonQueryAsync();
        }

        ConnectionString = new NpgsqlConnectionStringBuilder(admin) { Database = _databaseName }.ConnectionString;
        await using (var connection = new NpgsqlConnection(ConnectionString))
        {
            await connection.OpenAsync();
            await using var schema = new NpgsqlCommand(await File.ReadAllTextAsync(FindSchemaScript()), connection);
            await schema.ExecuteNonQueryAsync();
        }

        Connections = new PostgresConnectionFactory(ConnectionString);
    }

    public async Task DisposeAsync()
    {
        if (_databaseName is null)
            return;
        NpgsqlConnection.ClearAllPools();
        await using var connection = new NpgsqlConnection(Environment.GetEnvironmentVariable(EnvVar)!);
        await connection.OpenAsync();
        await using var drop = new NpgsqlCommand($"DROP DATABASE IF EXISTS \"{_databaseName}\" WITH (FORCE)", connection);
        await drop.ExecuteNonQueryAsync();
    }

    /// <summary>Runs a statement against the test database (used to arrange data outside the repositories).</summary>
    public async Task<object?> ScalarAsync(string sql)
    {
        await using var connection = new NpgsqlConnection(ConnectionString);
        await connection.OpenAsync();
        await using var command = new NpgsqlCommand(sql, connection);
        return await command.ExecuteScalarAsync();
    }

    public async Task ExecuteAsync(string sql) => await ScalarAsync(sql);

    private static string FindSchemaScript()
    {
        for (var dir = new DirectoryInfo(AppContext.BaseDirectory); dir is not null; dir = dir.Parent)
        {
            var candidate = Path.Combine(dir.FullName, "src", "database", "shop_finance.sql");
            if (File.Exists(candidate))
                return candidate;
        }
        throw new FileNotFoundException("src/database/shop_finance.sql was not found above the test output directory.");
    }
}

/// <summary>A fact that is skipped when no test database is configured.</summary>
public sealed class PostgresFactAttribute : FactAttribute
{
    public PostgresFactAttribute()
    {
        if (!PostgresDatabase.Configured)
            Skip = $"Set {PostgresDatabase.EnvVar} to run PostgreSQL integration tests.";
    }
}

/// <summary>A theory that is skipped when no test database is configured.</summary>
public sealed class PostgresTheoryAttribute : TheoryAttribute
{
    public PostgresTheoryAttribute()
    {
        if (!PostgresDatabase.Configured)
            Skip = $"Set {PostgresDatabase.EnvVar} to run PostgreSQL integration tests.";
    }
}
