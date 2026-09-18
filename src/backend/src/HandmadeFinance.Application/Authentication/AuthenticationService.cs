using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Users;

namespace HandmadeFinance.Application.Authentication;

public sealed class AuthenticationService(
    IUserRepository users,
    IPasswordService passwords,
    ITokenIssuer tokens,
    IClock clock
)
{
    public async Task<LoginResult> LoginAsync(string email, string password, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrEmpty(password))
            throw AppException.Validation("Email and password are required.");
        var user = await users.FindByEmailAsync(email.Trim(), ct);
        if (user is null || !user.IsActive || !passwords.Verify(user.PasswordHash, password))
            throw new AppException(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
        var expiry = clock.UtcNow.AddMinutes(30);
        user.LastLoginAt = clock.UtcNow;
        user.UpdatedAt = clock.UtcNow;
        await users.UpdateAsync(user, ct);
        return new(tokens.Issue(user, expiry), "Bearer", expiry, Map(user));
    }

    internal static SafeUser Map(UserAccount u) =>
        new(
            u.Id,
            u.Username,
            u.Email,
            u.FullName,
            u.Phone,
            u.Timezone,
            u.Role,
            u.IsActive,
            u.AvatarUrl,
            u.LastLoginAt,
            u.CreatedAt,
            u.UpdatedAt
        );
}
