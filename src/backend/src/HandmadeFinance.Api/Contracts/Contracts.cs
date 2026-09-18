using HandmadeFinance.Application.Common;

namespace HandmadeFinance.Api.Contracts;

public sealed record LoginRequest(string Email, string Password);

public sealed record LedgerRequest(
    DateOnly Date,
    string Description,
    long CategoryId,
    decimal Amount,
    decimal TaxPercent,
    decimal AmountAfterTax,
    string CurrencyCode = "USD"
);

public sealed record CreateUserRequest(
    string Username,
    string Email,
    string Password,
    string FullName,
    string? Phone,
    string Timezone,
    UserRole Role,
    bool IsActive = true
);

public sealed record UpdateUserRequest(
    string Username,
    string Email,
    string FullName,
    string? Phone,
    string Timezone,
    UserRole Role,
    bool IsActive
);

public sealed record UpdateProfileRequest(string FullName, string? Phone, string Timezone);

public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
