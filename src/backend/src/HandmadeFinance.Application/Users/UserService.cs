using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Authentication;
using HandmadeFinance.Application.Common;
using System.Net.Mail;

namespace HandmadeFinance.Application.Users;

public sealed class UserService(IUserRepository users, IPasswordService passwords, IClock clock)
{
    public async Task<IReadOnlyList<SafeUser>> ListAsync(Actor actor, CancellationToken ct)
    {
        Admin(actor);
        return (await users.ListAsync(ct)).Select(AuthenticationService.Map).ToList();
    }

    public async Task<SafeUser> GetAsync(long id, Actor actor, CancellationToken ct)
    {
        Admin(actor);
        return AuthenticationService.Map(await User(id, ct));
    }

    public async Task<SafeUser> CreateAsync(
        UserWrite write,
        string password,
        Actor actor,
        CancellationToken ct
    )
    {
        Admin(actor);
        var normalized = Normalize(write);
        Validate(normalized);
        ValidatePassword(password, "Password");
        if (await users.UsernameOrEmailExistsAsync(normalized.Username, normalized.Email, null, ct))
            throw AppException.Conflict("Username or email already exists.");
        var now = clock.UtcNow;
        var user = new UserAccount
        {
            Username = normalized.Username,
            Email = normalized.Email,
            PasswordHash = passwords.Hash(password),
            FullName = normalized.FullName,
            Phone = normalized.Phone,
            AvatarUrl = normalized.AvatarUrl,
            Timezone = normalized.Timezone,
            Role = normalized.Role,
            IsActive = normalized.IsActive,
            CreatedAt = now,
            UpdatedAt = now,
        };
        return AuthenticationService.Map(await users.AddAsync(user, ct));
    }

    public async Task<SafeUser> UpdateAsync(
        long id,
        UserWrite write,
        Actor actor,
        CancellationToken ct
    )
    {
        Admin(actor);
        var normalized = Normalize(write);
        Validate(normalized);
        var user = await User(id, ct);
        if (await users.UsernameOrEmailExistsAsync(normalized.Username, normalized.Email, id, ct))
            throw AppException.Conflict("Username or email already exists.");
        user.Username = normalized.Username;
        user.Email = normalized.Email;
        user.FullName = normalized.FullName;
        user.Phone = normalized.Phone;
        user.AvatarUrl = normalized.AvatarUrl;
        user.Timezone = normalized.Timezone;
        user.Role = normalized.Role;
        user.IsActive = normalized.IsActive;
        user.UpdatedAt = clock.UtcNow;
        await users.UpdateAsync(user, ct);
        return AuthenticationService.Map(user);
    }

    public async Task<SafeUser> ProfileAsync(Actor actor, CancellationToken ct) =>
        AuthenticationService.Map(await User(actor.UserId, ct));

    public async Task<SafeUser> UpdateProfileAsync(
        ProfileWrite write,
        Actor actor,
        CancellationToken ct
    )
    {
        var fullName = Required(write.FullName, "fullName", 255);
        var timezone = Required(write.Timezone, "timezone", 64);
        var phone = Optional(write.Phone, "phone", 30);
        var avatarUrl = ValidateAvatar(write.AvatarUrl);
        var user = await User(actor.UserId, ct);
        user.FullName = fullName;
        user.Phone = phone;
        user.AvatarUrl = avatarUrl;
        user.Timezone = timezone;
        user.UpdatedAt = clock.UtcNow;
        await users.UpdateAsync(user, ct);
        return AuthenticationService.Map(user);
    }

    public async Task ChangePasswordAsync(
        string currentPassword,
        string newPassword,
        Actor actor,
        CancellationToken ct
    )
    {
        var user = await User(actor.UserId, ct);
        if (string.IsNullOrEmpty(currentPassword))
            throw AppException.Validation("Current password is required.");
        if (!passwords.Verify(user.PasswordHash, currentPassword))
            throw new AppException(
                400,
                "CURRENT_PASSWORD_INVALID",
                "Current password is incorrect."
            );
        ValidatePassword(newPassword, "New password");
        if (passwords.Verify(user.PasswordHash, newPassword))
            throw AppException.Validation("New password must be different from the current password.");
        user.PasswordHash = passwords.Hash(newPassword);
        user.UpdatedAt = clock.UtcNow;
        await users.UpdateAsync(user, ct);
    }

    private async Task<UserAccount> User(long id, CancellationToken ct) =>
        await users.GetAsync(id, ct) ?? throw AppException.NotFound("user");

    private static void Admin(Actor a)
    {
        if (a.Role != UserRole.ADMIN)
            throw AppException.Forbidden();
    }

    private static UserWrite Normalize(UserWrite w) =>
        w with
        {
            Username = Required(w.Username, "username", 100),
            Email = Required(w.Email, "email", 255).ToLowerInvariant(),
            FullName = Required(w.FullName, "fullName", 255),
            Phone = Optional(w.Phone, "phone", 30),
            Timezone = Required(w.Timezone, "timezone", 64),
            AvatarUrl = ValidateAvatar(w.AvatarUrl),
        };

    private static void Validate(UserWrite w)
    {
        try
        {
            var address = new MailAddress(w.Email);
            if (!address.Address.Equals(w.Email, StringComparison.OrdinalIgnoreCase))
                throw AppException.Validation("email must be a valid email address.");
        }
        catch (FormatException)
        {
            throw AppException.Validation("email must be a valid email address.");
        }
    }

    private static string Required(string? value, string field, int maxLength)
    {
        var normalized = value?.Trim();
        if (string.IsNullOrEmpty(normalized) || normalized.Length > maxLength)
            throw AppException.Validation($"{field} is required and must not exceed {maxLength} characters.");
        return normalized;
    }

    private static string? Optional(string? value, string field, int maxLength)
    {
        var normalized = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
        if (normalized?.Length > maxLength)
            throw AppException.Validation($"{field} must not exceed {maxLength} characters.");
        return normalized;
    }

    private static string? ValidateAvatar(string? value)
    {
        var normalized = Optional(value, "avatarUrl", 2048);
        if (normalized is null)
            return null;
        if (!Uri.TryCreate(normalized, UriKind.Absolute, out var uri)
            || uri.Scheme is not ("http" or "https"))
            throw AppException.Validation("avatarUrl must be an absolute HTTP or HTTPS URL.");
        return normalized;
    }

    private static void ValidatePassword(string? password, string label)
    {
        if (password is null || password.Length is < 4 or > 128)
            throw AppException.Validation($"{label} must contain 4 to 128 characters.");
    }
}
