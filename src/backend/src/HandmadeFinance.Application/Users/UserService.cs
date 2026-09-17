using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Authentication;

namespace HandmadeFinance.Application.Users;

public sealed class UserService(IUserRepository users, IPasswordService passwords, IClock clock)
{
    public async Task<IReadOnlyList<SafeUser>> ListAsync(Actor actor, CancellationToken ct) { Admin(actor); return (await users.ListAsync(ct)).Select(AuthenticationService.Map).ToList(); }
    public async Task<SafeUser> GetAsync(long id, Actor actor, CancellationToken ct) { Admin(actor); return AuthenticationService.Map(await User(id, ct)); }
    public async Task<SafeUser> CreateAsync(UserWrite write, string password, Actor actor, CancellationToken ct)
    {
        Admin(actor); Validate(write); if (password.Length is < 4 or > 128) throw AppException.Validation("Password must contain 4 to 128 characters.");
        if (await users.UsernameOrEmailExistsAsync(write.Username, write.Email, null, ct)) throw AppException.Conflict("Username or email already exists.");
        var now = clock.UtcNow; var user = new UserAccount { Username=write.Username.Trim(), Email=write.Email.Trim(), PasswordHash=passwords.Hash(password), FullName=write.FullName.Trim(), Phone=write.Phone, Timezone=write.Timezone, Role=write.Role, IsActive=write.IsActive, CreatedAt=now, UpdatedAt=now };
        return AuthenticationService.Map(await users.AddAsync(user, ct));
    }
    public async Task<SafeUser> UpdateAsync(long id, UserWrite write, Actor actor, CancellationToken ct)
    {
        Admin(actor); Validate(write); var user = await User(id, ct);
        if (await users.UsernameOrEmailExistsAsync(write.Username, write.Email, id, ct)) throw AppException.Conflict("Username or email already exists.");
        user.Username=write.Username.Trim(); user.Email=write.Email.Trim(); user.FullName=write.FullName.Trim(); user.Phone=write.Phone; user.Timezone=write.Timezone; user.Role=write.Role; user.IsActive=write.IsActive; user.UpdatedAt=clock.UtcNow;
        await users.UpdateAsync(user, ct); return AuthenticationService.Map(user);
    }
    public async Task<SafeUser> ProfileAsync(Actor actor, CancellationToken ct) => AuthenticationService.Map(await User(actor.UserId, ct));
    public async Task<SafeUser> UpdateProfileAsync(ProfileWrite write, Actor actor, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(write.FullName) || string.IsNullOrWhiteSpace(write.Timezone)) throw AppException.Validation("fullName and timezone are required.");
        var user=await User(actor.UserId,ct); user.FullName=write.FullName.Trim(); user.Phone=write.Phone; user.Timezone=write.Timezone; user.UpdatedAt=clock.UtcNow; await users.UpdateAsync(user,ct); return AuthenticationService.Map(user);
    }
    public async Task ChangePasswordAsync(string currentPassword, string newPassword, Actor actor, CancellationToken ct)
    {
        var user=await User(actor.UserId,ct); if(!passwords.Verify(user.PasswordHash,currentPassword)) throw new AppException(400,"CURRENT_PASSWORD_INVALID","Current password is incorrect.");
        if(newPassword.Length is < 4 or > 128) throw AppException.Validation("New password must contain 4 to 128 characters."); user.PasswordHash=passwords.Hash(newPassword); user.UpdatedAt=clock.UtcNow; await users.UpdateAsync(user,ct);
    }
    private async Task<UserAccount> User(long id,CancellationToken ct)=>await users.GetAsync(id,ct)??throw AppException.NotFound("user");
    private static void Admin(Actor a){if(a.Role!=UserRole.ADMIN)throw AppException.Forbidden();}
    private static void Validate(UserWrite w){if(string.IsNullOrWhiteSpace(w.Username)||string.IsNullOrWhiteSpace(w.Email)||!w.Email.Contains('@')||string.IsNullOrWhiteSpace(w.FullName))throw AppException.Validation("Invalid user values.");}
}
