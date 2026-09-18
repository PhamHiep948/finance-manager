using System.Security.Claims;
using System.Globalization;
using HandmadeFinance.Application.Common;

namespace HandmadeFinance.Api.Authorization;

public static class ActorExtensions
{
    public static Actor Actor(this ClaimsPrincipal user) =>
        new(
            long.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!, CultureInfo.InvariantCulture),
            Enum.Parse<UserRole>(user.FindFirstValue(ClaimTypes.Role)!)
        );
}
