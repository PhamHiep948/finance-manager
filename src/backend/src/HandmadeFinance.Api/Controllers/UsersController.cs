using HandmadeFinance.Api.Authorization;
using HandmadeFinance.Api.Contracts;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Users;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandmadeFinance.Api.Controllers;

[Authorize(Roles = "ADMIN"), ApiController, Route("api/v1/users")]
public sealed class UsersController(UserService service) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) =>
        Ok(await service.ListAsync(User.Actor(), ct));

    [HttpGet("{id:long}")]
    public async Task<IActionResult> Get(long id, CancellationToken ct) =>
        Ok(await service.GetAsync(id, User.Actor(), ct));

    [HttpPost]
    public async Task<IActionResult> Create(CreateUserRequest r, CancellationToken ct)
    {
        var user = await service.CreateAsync(
            new(
                r.Username,
                r.Email,
                r.FullName,
                r.Phone,
                r.Timezone,
                r.Role,
                r.IsActive,
                r.AvatarUrl
            ),
            r.Password,
            User.Actor(),
            ct
        );
        return CreatedAtAction(nameof(Get), new { id = user.Id }, user);
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, UpdateUserRequest r, CancellationToken ct) =>
        Ok(
            await service.UpdateAsync(
                id,
                new(
                    r.Username,
                    r.Email,
                    r.FullName,
                    r.Phone,
                    r.Timezone,
                    r.Role,
                    r.IsActive,
                    r.AvatarUrl
                ),
                User.Actor(),
                ct
            )
        );

    [HttpPatch("{id:long}/status")]
    public async Task<IActionResult> Status(
        long id,
        [FromBody] StatusRequest r,
        CancellationToken ct
    )
    {
        var current = await service.GetAsync(id, User.Actor(), ct);
        return Ok(
            await service.UpdateAsync(
                id,
                new(
                    current.Username,
                    current.Email,
                    current.FullName,
                    current.Phone,
                    current.Timezone,
                    current.Role,
                    r.IsActive,
                    current.AvatarUrl
                ),
                User.Actor(),
                ct
            )
        );
    }

    public sealed record StatusRequest(bool IsActive);
}
