using HandmadeFinance.Api.Authorization; using HandmadeFinance.Api.Contracts; using HandmadeFinance.Application.Users; using Microsoft.AspNetCore.Authorization; using Microsoft.AspNetCore.Mvc;
namespace HandmadeFinance.Api.Controllers;
[Authorize,ApiController,Route("api/v1/profile")]
public sealed class ProfileController(UserService service):ControllerBase
{
    [HttpGet] public async Task<IActionResult> Get(CancellationToken ct)=>Ok(await service.ProfileAsync(User.Actor(),ct));
    [HttpPut] public async Task<IActionResult> Update(UpdateProfileRequest r,CancellationToken ct)=>Ok(await service.UpdateProfileAsync(new(r.FullName,r.Phone,r.Timezone),User.Actor(),ct));
    [HttpPut("password")] public async Task<IActionResult> Password(ChangePasswordRequest r,CancellationToken ct){await service.ChangePasswordAsync(r.CurrentPassword,r.NewPassword,User.Actor(),ct);return NoContent();}
}
