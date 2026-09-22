using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Users;
using HandmadeFinance.Infrastructure.Persistence;
using Npgsql;
using Xunit;

namespace HandmadeFinance.Infrastructure.Tests.Postgres;

public sealed class PostgresCategoryRepositoryTests(PostgresDatabase database) : IClassFixture<PostgresDatabase>
{
    private PostgresCategoryRepository Repo => new(database.Connections);

    [PostgresFact]
    public async Task Income_categories_are_seeded_and_ordered_by_name()
    {
        var names = (await Repo.ListActiveAsync(EntryKind.INCOME, default)).Select(c => c.Name).ToArray();
        Assert.Equal(["Other Income", "Sales"], names);
    }

    [PostgresFact]
    public async Task Expense_categories_are_seeded_and_ordered_by_name()
    {
        var categories = await Repo.ListActiveAsync(EntryKind.EXPENSE, default);
        var names = categories.Select(c => c.Name).ToArray();
        Assert.Equal(10, names.Length);
        Assert.Contains("Raw Materials", names);
        Assert.All(categories, c => Assert.Equal(EntryKind.EXPENSE, c.Kind));
    }

    [PostgresFact]
    public async Task Exists_is_true_only_for_an_active_category_of_the_same_kind()
    {
        var sales = (await Repo.ListActiveAsync(EntryKind.INCOME, default)).Single(c => c.Name == "Sales");
        Assert.True(await Repo.ExistsAsync(sales.Id, EntryKind.INCOME, default));
        Assert.False(await Repo.ExistsAsync(999_999, EntryKind.INCOME, default));
        // Income has only two categories, so the highest expense category id does not exist as an income category.
        var highestExpense = (await Repo.ListActiveAsync(EntryKind.EXPENSE, default)).Max(c => c.Id);
        Assert.True(await Repo.ExistsAsync(highestExpense, EntryKind.EXPENSE, default));
        Assert.False(await Repo.ExistsAsync(highestExpense, EntryKind.INCOME, default));
    }

    [PostgresFact]
    public async Task Inactive_and_soft_deleted_categories_are_hidden()
    {
        await database.ExecuteAsync("INSERT INTO shop_finance.expense_categories (name, is_active) VALUES ('Hidden inactive', FALSE)");
        await database.ExecuteAsync("INSERT INTO shop_finance.expense_categories (name, deleted_at) VALUES ('Hidden deleted', NOW())");
        var names = (await Repo.ListActiveAsync(EntryKind.EXPENSE, default)).Select(c => c.Name).ToArray();
        Assert.DoesNotContain("Hidden inactive", names);
        Assert.DoesNotContain("Hidden deleted", names);
        var inactiveId = Convert.ToInt64(await database.ScalarAsync("SELECT id FROM shop_finance.expense_categories WHERE name = 'Hidden inactive'"), System.Globalization.CultureInfo.InvariantCulture);
        Assert.False(await Repo.ExistsAsync(inactiveId, EntryKind.EXPENSE, default));
    }
}

public sealed class PostgresUserRepositoryTests(PostgresDatabase database) : IClassFixture<PostgresDatabase>
{
    private static readonly DateTimeOffset Now = new(2026, 9, 17, 8, 0, 0, TimeSpan.Zero);

    private PostgresUserRepository Repo => new(database.Connections);

    private static UserAccount NewUser(string name, UserRole role = UserRole.EMPLOYEE) =>
        new()
        {
            Username = name,
            Email = $"{name}@example.com",
            PasswordHash = "salt.hash",
            FullName = $"User {name}",
            Phone = "090 000 0000",
            AvatarUrl = "https://example.com/a.png",
            Timezone = "Asia/Ho_Chi_Minh",
            Role = role,
            IsActive = true,
            CreatedAt = Now,
            UpdatedAt = Now,
        };

    private static string Unique() => $"u{Guid.NewGuid():N}"[..14];

    [PostgresFact]
    public async Task Demo_accounts_are_seeded_with_the_expected_roles()
    {
        var users = await Repo.ListAsync(default);
        Assert.Equal(UserRole.ADMIN, users.Single(u => u.Email == "admin@demo.local").Role);
        Assert.Equal(UserRole.SHOP_OWNER, users.Single(u => u.Email == "owner@demo.local").Role);
        Assert.Equal(UserRole.EMPLOYEE, users.Single(u => u.Email == "staff@demo.local").Role);
        Assert.Equal(UserRole.VIEWER, users.Single(u => u.Email == "viewer@demo.local").Role);
    }

    [PostgresFact]
    public async Task Find_by_email_ignores_case()
    {
        var user = await Repo.FindByEmailAsync("ADMIN@Demo.Local", default);
        Assert.NotNull(user);
        Assert.Equal("admin", user.Username);
        Assert.Null(await Repo.FindByEmailAsync("nobody@example.com", default));
    }

    [PostgresFact]
    public async Task Seeded_password_hash_verifies_with_the_password_service()
    {
        var user = await Repo.FindByEmailAsync("admin@demo.local", default);
        Assert.True(new PasswordService().Verify(user!.PasswordHash, "ChangeMe123!"));
        Assert.False(new PasswordService().Verify(user.PasswordHash, "wrong"));
    }

    [PostgresFact]
    public async Task Add_then_get_round_trips_every_field()
    {
        var name = Unique();
        var added = await Repo.AddAsync(NewUser(name, UserRole.SHOP_OWNER), default);
        Assert.True(added.Id > 0);

        var read = await Repo.GetAsync(added.Id, default);
        Assert.NotNull(read);
        Assert.Equal((name, $"{name}@example.com", "salt.hash", $"User {name}"), (read.Username, read.Email, read.PasswordHash, read.FullName));
        Assert.Equal(("090 000 0000", "https://example.com/a.png", "Asia/Ho_Chi_Minh"), (read.Phone, read.AvatarUrl, read.Timezone));
        Assert.Equal((UserRole.SHOP_OWNER, true), (read.Role, read.IsActive));
        Assert.Null(read.LastLoginAt);
        Assert.Equal(Now, read.CreatedAt);
    }

    [PostgresFact]
    public async Task Update_changes_profile_role_status_and_last_login()
    {
        var added = await Repo.AddAsync(NewUser(Unique()), default);
        added.FullName = "Renamed";
        added.Phone = null;
        added.Role = UserRole.VIEWER;
        added.IsActive = false;
        added.LastLoginAt = Now.AddHours(2);
        added.UpdatedAt = Now.AddHours(2);
        await Repo.UpdateAsync(added, default);

        var read = await Repo.GetAsync(added.Id, default);
        Assert.Equal(("Renamed", UserRole.VIEWER, false), (read!.FullName, read.Role, read.IsActive));
        Assert.Null(read.Phone);
        Assert.Equal(Now.AddHours(2), read.LastLoginAt);
    }

    [PostgresFact]
    public async Task Username_or_email_existence_check_supports_exclusion()
    {
        var name = Unique();
        var added = await Repo.AddAsync(NewUser(name), default);
        Assert.True(await Repo.UsernameOrEmailExistsAsync(name, "other@example.com", null, default));
        Assert.True(await Repo.UsernameOrEmailExistsAsync("someone-else", $"{name}@EXAMPLE.com", null, default));
        Assert.False(await Repo.UsernameOrEmailExistsAsync(name, $"{name}@example.com", added.Id, default));
        Assert.False(await Repo.UsernameOrEmailExistsAsync(Unique(), "free@example.com", null, default));
    }

    [PostgresFact]
    public async Task Database_enforces_unique_usernames_and_emails()
    {
        var name = Unique();
        await Repo.AddAsync(NewUser(name), default);
        var sameUsername = NewUser(name);
        sameUsername.Email = "different@example.com";
        var ex = await Assert.ThrowsAsync<PostgresException>(() => Repo.AddAsync(sameUsername, default));
        Assert.Equal("23505", ex.SqlState); // unique_violation
    }

    [PostgresFact]
    public async Task Soft_deleted_users_are_not_returned_and_free_their_email()
    {
        var name = Unique();
        var added = await Repo.AddAsync(NewUser(name), default);
        await database.ExecuteAsync($"UPDATE shop_finance.app_users SET deleted_at = NOW() WHERE id = {added.Id}");

        Assert.Null(await Repo.GetAsync(added.Id, default));
        Assert.Null(await Repo.FindByEmailAsync($"{name}@example.com", default));
        Assert.DoesNotContain(await Repo.ListAsync(default), u => u.Id == added.Id);
        Assert.False(await Repo.UsernameOrEmailExistsAsync(name, $"{name}@example.com", null, default));
        await Repo.AddAsync(NewUser(name), default); // the same username/email can be reused
    }
}
