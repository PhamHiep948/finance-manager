namespace HandmadeFinance.Application.Common;

public enum UserRole { ADMIN, SHOP_OWNER, EMPLOYEE, VIEWER }
public enum EntryKind { INCOME, EXPENSE }

public sealed record Actor(long UserId, UserRole Role);

public class AppException(int status, string code, string message) : Exception(message)
{
    public int Status { get; } = status;
    public string Code { get; } = code;
    public static AppException Validation(string message) => new(400, "VALIDATION_ERROR", message);
    public static AppException Unauthorized() => new(401, "UNAUTHORIZED", "Authentication is required.");
    public static AppException Forbidden() => new(403, "FORBIDDEN", "You do not have permission to perform this action.");
    public static AppException NotFound(string resource) => new(404, "NOT_FOUND", $"{resource} was not found.");
    public static AppException Conflict(string message) => new(409, "CONFLICT", message);
}

public sealed record PageResult<T>(IReadOnlyList<T> Items, int Page, int PageSize, long TotalItems)
{
    public int TotalPages => TotalItems == 0 ? 0 : (int)Math.Ceiling(TotalItems / (double)PageSize);
}
