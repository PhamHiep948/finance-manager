using HandmadeFinance.Api.Authorization;
using HandmadeFinance.Api.Contracts;
using HandmadeFinance.Application.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandmadeFinance.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/profile")]
public sealed class ProfileController(UserService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct) =>
        Ok(await service.ProfileAsync(User.Actor(), ct));

    [HttpPut]
    public async Task<IActionResult> Update(UpdateProfileRequest request, CancellationToken ct) =>
        Ok(
            await service.UpdateProfileAsync(
                new(request.FullName, request.Phone, request.Timezone, request.AvatarUrl),
                User.Actor(),
                ct
            )
        );

    [HttpPut("password")]
    public async Task<IActionResult> Password(ChangePasswordRequest request, CancellationToken ct)
    {
        await service.ChangePasswordAsync(
            request.CurrentPassword,
            request.NewPassword,
            User.Actor(),
            ct
        );

        return NoContent();
    }
}
