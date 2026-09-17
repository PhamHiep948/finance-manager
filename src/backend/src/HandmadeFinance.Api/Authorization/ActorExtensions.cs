using System.Security.Claims;
using HandmadeFinance.Application.Common;

namespace HandmadeFinance.Api.Authorization;
public static class ActorExtensions
{
    public static Actor Actor(this ClaimsPrincipal user)=>new(long.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!),Enum.Parse<UserRole>(user.FindFirstValue(ClaimTypes.Role)!));
}
