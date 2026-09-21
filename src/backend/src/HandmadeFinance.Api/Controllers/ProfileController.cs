using HandmadeFinance.Api.Authorization;
using HandmadeFinance.Api.Contracts;
using HandmadeFinance.Application.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandmadeFinance.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/profile")]
public sealed class ProfileController(UserService service, AuditTrail audit) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct) =>
        Ok(await service.ProfileAsync(User.Actor(), ct));

    [HttpPut]
    public async Task<IActionResult> Update(UpdateProfileRequest request, CancellationToken ct)
    {
        var actor = User.Actor();
        var profile = await service.UpdateProfileAsync(
            new(request.FullName, request.Phone, request.Timezone, request.AvatarUrl),
            actor,
            ct
        );
        audit.Record(actor.UserId, "UPDATE", "PROFILE", "Updated own profile");
        return Ok(profile);
    }

    [HttpPut("password")]
    public async Task<IActionResult> Password(ChangePasswordRequest request, CancellationToken ct)
    {
        await service.ChangePasswordAsync(
            request.CurrentPassword,
            request.NewPassword,
            User.Actor(),
            ct
        );
        audit.Record(User.Actor().UserId, "UPDATE", "PROFILE", "Changed own password");

        return NoContent();
    }
}
