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
    string CurrencyCode = "USD",
    string? OrderCode = null,
    string? SaleRegion = null,
    string? SalesChannel = null,
    int? ProductQty = null,
    string? Payee = null,
    string? OriginScope = null,
    string? PaymentMethod = null
);

public sealed record CreateUserRequest(
    string Username,
    string Email,
    string Password,
    string FullName,
    string? Phone,
    string Timezone,
    UserRole Role,
    bool IsActive = true,
    string? AvatarUrl = null
);

public sealed record UpdateUserRequest(
    string Username,
    string Email,
    string FullName,
    string? Phone,
    string Timezone,
    UserRole Role,
    bool IsActive,
    string? AvatarUrl = null
);

public sealed record UpdateProfileRequest(
    string FullName,
    string? Phone,
    string Timezone,
    string? AvatarUrl = null
);

public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword);
