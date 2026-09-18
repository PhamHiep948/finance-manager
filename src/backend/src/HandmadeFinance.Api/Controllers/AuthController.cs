using HandmadeFinance.Api.Contracts;
using HandmadeFinance.Application.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandmadeFinance.Api.Controllers;

[ApiController, Route("api/v1/auth")]
public sealed class AuthController(AuthenticationService service) : ControllerBase
{
    [AllowAnonymous, HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest r, CancellationToken ct) =>
        Ok(await service.LoginAsync(r.Email, r.Password, ct));

    [Authorize, HttpPost("logout")]
    public IActionResult Logout() => NoContent();
}
