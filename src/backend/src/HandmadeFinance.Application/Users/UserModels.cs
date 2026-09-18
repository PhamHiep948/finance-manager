using HandmadeFinance.Application.Common;

namespace HandmadeFinance.Application.Users;

public sealed class UserAccount
{
    public long Id { get; set; }
    public string Username { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string FullName { get; set; } = "";
    public string? Phone { get; set; }
    public string Timezone { get; set; } = "Asia/Ho_Chi_Minh";
    public UserRole Role { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

public sealed record SafeUser(
    long Id,
    string Username,
    string Email,
    string FullName,
    string? Phone,
    string Timezone,
    UserRole Role,
    bool IsActive
);

public sealed record LoginResult(
    string AccessToken,
    string TokenType,
    DateTimeOffset ExpiresAt,
    SafeUser User
);

public sealed record UserWrite(
    string Username,
    string Email,
    string FullName,
    string? Phone,
    string Timezone,
    UserRole Role,
    bool IsActive
);

public sealed record ProfileWrite(string FullName, string? Phone, string Timezone);
