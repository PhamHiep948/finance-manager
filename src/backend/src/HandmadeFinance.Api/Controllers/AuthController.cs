using HandmadeFinance.Api.Authorization;
using HandmadeFinance.Api.Contracts;
using HandmadeFinance.Application.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandmadeFinance.Api.Controllers;

[ApiController, Route("api/v1/auth")]
public sealed class AuthController(AuthenticationService service, AuditTrail audit) : ControllerBase
{
    [AllowAnonymous, HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest r, CancellationToken ct)
    {
        var result = await service.LoginAsync(r.Email, r.Password, ct);
        audit.Record(result.User.Id, "LOGIN", "AUTH", $"User {result.User.Email} signed in");
        return Ok(result);
    }

    [Authorize, HttpPost("logout")]
    public IActionResult Logout()
    {
        audit.Record(User.Actor().UserId, "LOGOUT", "AUTH", "User signed out");
        return NoContent();
    }
}
