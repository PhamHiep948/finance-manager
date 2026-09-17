using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Users;
using Xunit;

namespace HandmadeFinance.Application.Tests.Users;

public sealed class UserServiceTests
{
    private static readonly Actor Admin = new(99, UserRole.ADMIN);
    private static readonly Actor Employee = new(1, UserRole.EMPLOYEE);
    private static UserWrite ValidWrite => new(" new-user ", "new@example.com", " New User ", "0901", "Asia/Ho_Chi_Minh", UserRole.EMPLOYEE, true);

    [Theory]
    [InlineData(UserRole.SHOP_OWNER)]
    [InlineData(UserRole.EMPLOYEE)]
    [InlineData(UserRole.VIEWER)]
    public async Task Only_admin_can_list_users(UserRole role)
    {
        var f = new Fixture();
        var error = await Assert.ThrowsAsync<AppException>(() => f.Service.ListAsync(new Actor(2, role), default));
        Assert.Equal(403, error.Status);
    }

    [Fact]
    public async Task Admin_can_list_users_without_password_hash()
    {
        var f = new Fixture();
        var result = await f.Service.ListAsync(Admin, default);
        Assert.Single(result);
        Assert.Equal("alice", result[0].Username);
        Assert.DoesNotContain(result[0].GetType().GetProperties(), p => p.Name.Contains("Password", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Get_missing_user_returns_not_found()
    {
        var f = new Fixture();
        var error = await Assert.ThrowsAsync<AppException>(() => f.Service.GetAsync(404, Admin, default));
        Assert.Equal(404, error.Status);
        Assert.Equal("NOT_FOUND", error.Code);
    }

    [Fact]
    public async Task Create_trims_values_hashes_password_and_sets_timestamps()
    {
        var f = new Fixture();
        var result = await f.Service.CreateAsync(ValidWrite, "secret", Admin, default);
        Assert.Equal("new-user", result.Username);
        Assert.Equal("New User", result.FullName);
        Assert.Equal("HASH:secret", f.Repository.Users.Single(x => x.Id == result.Id).PasswordHash);
        Assert.Equal(f.Clock.UtcNow, f.Repository.Users.Single(x => x.Id == result.Id).CreatedAt);
    }

    [Theory]
    [InlineData("", "valid@example.com", "Name")]
    [InlineData("name", "not-an-email", "Name")]
    [InlineData("name", "valid@example.com", "")]
    public async Task Create_rejects_invalid_user_fields(string username, string email, string fullName)
    {
        var f = new Fixture();
        var error = await Assert.ThrowsAsync<AppException>(() => f.Service.CreateAsync(ValidWrite with { Username = username, Email = email, FullName = fullName }, "secret", Admin, default));
        Assert.Equal(400, error.Status);
        Assert.DoesNotContain(f.Repository.Users, x => x.Id != 1);
    }

    [Theory]
    [InlineData("abc")]
    [InlineData("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")]
    public async Task Create_rejects_password_outside_length_limits(string password)
    {
        var f = new Fixture();
        await Assert.ThrowsAsync<AppException>(() => f.Service.CreateAsync(ValidWrite, password, Admin, default));
    }

    [Fact]
    public async Task Create_rejects_duplicate_username_or_email()
    {
        var f = new Fixture();
        var error = await Assert.ThrowsAsync<AppException>(() => f.Service.CreateAsync(ValidWrite with { Username = "alice" }, "secret", Admin, default));
        Assert.Equal(409, error.Status);
    }

    [Fact]
    public async Task Admin_can_update_role_and_status()
    {
        var f = new Fixture();
        var result = await f.Service.UpdateAsync(1, new("alice2", "alice2@example.com", "Alice Updated", null, "UTC", UserRole.VIEWER, false), Admin, default);
        Assert.Equal(UserRole.VIEWER, result.Role);
        Assert.False(result.IsActive);
        Assert.Equal(f.Clock.UtcNow, f.Repository.Users[0].UpdatedAt);
    }

    [Fact]
    public async Task User_can_read_only_own_profile()
    {
        var f = new Fixture();
        var profile = await f.Service.ProfileAsync(Employee, default);
        Assert.Equal(1, profile.Id);
        await Assert.ThrowsAsync<AppException>(() => f.Service.ProfileAsync(new Actor(404, UserRole.EMPLOYEE), default));
    }

    [Fact]
    public async Task Profile_update_changes_only_allowed_fields()
    {
        var f = new Fixture();
        var originalRole = f.Repository.Users[0].Role;
        var result = await f.Service.UpdateProfileAsync(new(" Alice Profile ", "0999", "UTC"), Employee, default);
        Assert.Equal("Alice Profile", result.FullName);
        Assert.Equal("0999", result.Phone);
        Assert.Equal("UTC", result.Timezone);
        Assert.Equal(originalRole, result.Role);
    }

    [Theory]
    [InlineData("", "UTC")]
    [InlineData("Alice", "")]
    public async Task Profile_update_requires_name_and_timezone(string name, string timezone)
    {
        var f = new Fixture();
        var error = await Assert.ThrowsAsync<AppException>(() => f.Service.UpdateProfileAsync(new(name, null, timezone), Employee, default));
        Assert.Equal(400, error.Status);
    }

    [Fact]
    public async Task Change_password_rejects_wrong_current_password()
    {
        var f = new Fixture();
        var error = await Assert.ThrowsAsync<AppException>(() => f.Service.ChangePasswordAsync("wrong", "new-secret", Employee, default));
        Assert.Equal("CURRENT_PASSWORD_INVALID", error.Code);
        Assert.Equal("HASH:old-password", f.Repository.Users[0].PasswordHash);
    }

    [Fact]
    public async Task Change_password_hashes_new_password()
    {
        var f = new Fixture();
        await f.Service.ChangePasswordAsync("old-password", "new-secret", Employee, default);
        Assert.Equal("HASH:new-secret", f.Repository.Users[0].PasswordHash);
        Assert.Equal(1, f.Repository.UpdateCalls);
    }

    private sealed class Fixture
    {
        public FakeClock Clock { get; } = new();
        public FakeRepository Repository { get; } = new();
        public UserService Service { get; }
        public Fixture() => Service = new(Repository, new FakePasswords(), Clock);
    }

    private sealed class FakeClock : IClock { public DateTimeOffset UtcNow => new(2026, 9, 17, 8, 30, 0, TimeSpan.Zero); }
    private sealed class FakePasswords : IPasswordService
    {
        public string Hash(string password) => $"HASH:{password}";
        public bool Verify(string hash, string password) => hash == $"HASH:{password}";
    }

    private sealed class FakeRepository : IUserRepository
    {
        public List<UserAccount> Users { get; } = [new() { Id=1, Username="alice", Email="alice@example.com", PasswordHash="HASH:old-password", FullName="Alice", Timezone="Asia/Ho_Chi_Minh", Role=UserRole.EMPLOYEE, IsActive=true }];
        public int UpdateCalls { get; private set; }
        public Task<UserAccount?> FindByEmailAsync(string email, CancellationToken ct) => Task.FromResult(Users.SingleOrDefault(x => x.Email.Equals(email, StringComparison.OrdinalIgnoreCase)));
        public Task<UserAccount?> GetAsync(long id, CancellationToken ct) => Task.FromResult(Users.SingleOrDefault(x => x.Id == id));
        public Task<IReadOnlyList<UserAccount>> ListAsync(CancellationToken ct) => Task.FromResult<IReadOnlyList<UserAccount>>(Users.ToList());
        public Task<UserAccount> AddAsync(UserAccount user, CancellationToken ct) { user.Id = Users.Max(x => x.Id) + 1; Users.Add(user); return Task.FromResult(user); }
        public Task UpdateAsync(UserAccount user, CancellationToken ct) { UpdateCalls++; return Task.CompletedTask; }
        public Task<bool> UsernameOrEmailExistsAsync(string username, string email, long? excludingId, CancellationToken ct) => Task.FromResult(Users.Any(x => x.Id != excludingId && (x.Username.Equals(username, StringComparison.OrdinalIgnoreCase) || x.Email.Equals(email, StringComparison.OrdinalIgnoreCase))));
    }
}
