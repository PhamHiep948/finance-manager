using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Operations;

namespace HandmadeFinance.Api.Authorization;

/// <summary>Ghi nhật ký hoạt động cho các thao tác của người dùng đã đăng nhập.</summary>
public sealed class AuditTrail(IOperationalStore store, IClock clock)
{
    public void Record(long userId, string action, string module, string detail) =>
        store.Audit(action, module, detail, userId, clock.UtcNow);
}
