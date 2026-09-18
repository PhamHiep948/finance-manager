using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Authentication;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Users;
using Xunit;

namespace HandmadeFinance.Application.Tests.Authentication;

public sealed class AuthenticationServiceTests
{
    [Fact]
    public async Task Valid_login_returns_safe_user_and_token()
    {
        var f = new Fixture();
        var result = await f.Service.LoginAsync("a@b.com", "correct", default);
        Assert.Equal("token", result.AccessToken);
        Assert.Equal("Bearer", result.TokenType);
        Assert.Equal("alice", result.User.Username);
        Assert.Equal(new DateTimeOffset(2026, 9, 17, 0, 0, 0, TimeSpan.Zero), result.User.LastLoginAt);
    }

    [Fact]
    public async Task Unknown_email_has_same_safe_error_as_wrong_password()
    {
        var f = new Fixture();
        var a = await Assert.ThrowsAsync<AppException>(() =>
            f.Service.LoginAsync("missing@b.com", "x", default)
        );
        var b = await Assert.ThrowsAsync<AppException>(() =>
            f.Service.LoginAsync("a@b.com", "wrong", default)
        );
        Assert.Equal("INVALID_CREDENTIALS", a.Code);
        Assert.Equal(a.Message, b.Message);
    }

    [Fact]
    public async Task Inactive_user_cannot_login()
    {
        var f = new Fixture();
        f.User.IsActive = false;
        var ex = await Assert.ThrowsAsync<AppException>(() =>
            f.Service.LoginAsync("a@b.com", "correct", default)
        );
        Assert.Equal(401, ex.Status);
    }

    [Fact]
    public async Task Missing_credentials_are_validation_error()
    {
        var f = new Fixture();
        var ex = await Assert.ThrowsAsync<AppException>(() =>
            f.Service.LoginAsync("", "", default)
        );
        Assert.Equal(400, ex.Status);
    }

    private sealed class Fixture
    {
        public UserAccount User = new()
        {
            Id = 1,
            Username = "alice",
            Email = "a@b.com",
            PasswordHash = "hash",
            FullName = "Alice",
            Role = UserRole.ADMIN,
            IsActive = true,
        };
        public AuthenticationService Service;
        public int UpdateCalls;

        public Fixture()
        {
            Service = new(new Repo(this), new Passwords(), new Tokens(), new Clock());
        }
    }

    private sealed class Passwords : IPasswordService
    {
        public string Hash(string p) => p;

        public bool Verify(string h, string p) => p == "correct";
    }

    private sealed class Tokens : ITokenIssuer
    {
        public string Issue(UserAccount u, DateTimeOffset e) => "token";
    }

    private sealed class Clock : IClock
    {
        public DateTimeOffset UtcNow => new(2026, 9, 17, 0, 0, 0, TimeSpan.Zero);
    }

    private sealed class Repo(Fixture f) : IUserRepository
    {
        public Task<UserAccount?> FindByEmailAsync(string e, CancellationToken _) =>
            Task.FromResult(e == f.User.Email ? f.User : null);

        public Task<UserAccount?> GetAsync(long i, CancellationToken _) =>
            Task.FromResult<UserAccount?>(f.User);

        public Task<IReadOnlyList<UserAccount>> ListAsync(CancellationToken _) =>
            Task.FromResult<IReadOnlyList<UserAccount>>([f.User]);

        public Task<UserAccount> AddAsync(UserAccount u, CancellationToken _) => Task.FromResult(u);

        public Task UpdateAsync(UserAccount u, CancellationToken _)
        {
            f.UpdateCalls++;
            return Task.CompletedTask;
        }

        public Task<bool> UsernameOrEmailExistsAsync(
            string u,
            string e,
            long? x,
            CancellationToken _
        ) => Task.FromResult(false);
    }
}
