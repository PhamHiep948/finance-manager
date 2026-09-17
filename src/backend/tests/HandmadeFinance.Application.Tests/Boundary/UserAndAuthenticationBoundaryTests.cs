using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Authentication;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Users;
using Xunit;

namespace HandmadeFinance.Application.Tests.Boundary;

public sealed class UserAndAuthenticationBoundaryTests
{
    [Theory]
    [InlineData("", "a@b.com", "Name")] [InlineData(" ", "a@b.com", "Name")] [InlineData("user", "", "Name")]
    [InlineData("user", " ", "Name")] [InlineData("user", "plain", "Name")] [InlineData("user", "domain.com", "Name")]
    [InlineData("user", "a.b.com", "Name")] [InlineData("user", "a@b.com", "")] [InlineData("user", "a@b.com", " ")]
    [InlineData("\t", "a@b.com", "Name")]
    public async Task Create_rejects_required_field_and_email_variants(string username,string email,string name)
    {
        var f=new Fixture();var error=await Assert.ThrowsAsync<AppException>(()=>f.Users.CreateAsync(Write(username,email,name),"secret",Admin,default));Assert.Equal("VALIDATION_ERROR",error.Code);
    }

    [Theory]
    [InlineData("1234")] [InlineData("abcd")] [InlineData("pässword")] [InlineData("a b c d")]
    [InlineData("1234567890123456")] [InlineData("!@#$%^&*()")]
    public async Task Create_accepts_documented_password_lengths(string password)
    {
        var f=new Fixture();var result=await f.Users.CreateAsync(Write("new"+password.GetHashCode(),$"u{Math.Abs(password.GetHashCode())}@x.com","Name"),password,Admin,default);Assert.True(result.Id>1);
    }

    [Theory]
    [InlineData("")] [InlineData("a")] [InlineData("ab")] [InlineData("abc")]
    public async Task Create_rejects_too_short_passwords(string password)
    {
        var f=new Fixture();await Assert.ThrowsAsync<AppException>(()=>f.Users.CreateAsync(Write("new","new@x.com","Name"),password,Admin,default));
    }

    [Theory]
    [InlineData(UserRole.SHOP_OWNER)] [InlineData(UserRole.EMPLOYEE)] [InlineData(UserRole.VIEWER)]
    public async Task Every_non_admin_role_is_forbidden_from_user_detail(UserRole role)
    {
        var f=new Fixture();var error=await Assert.ThrowsAsync<AppException>(()=>f.Users.GetAsync(1,new Actor(1,role),default));Assert.Equal(403,error.Status);
    }

    [Theory]
    [InlineData("", "UTC")] [InlineData(" ", "UTC")] [InlineData("Alice", "")] [InlineData("Alice", " ")]
    [InlineData("\t", "Asia/Ho_Chi_Minh")] [InlineData("Alice", "\t")]
    public async Task Profile_rejects_blank_name_or_timezone(string name,string timezone)
    {
        var f=new Fixture();await Assert.ThrowsAsync<AppException>(()=>f.Users.UpdateProfileAsync(new(name,null,timezone),Employee,default));
    }

    [Theory]
    [InlineData("")] [InlineData("a")] [InlineData("ab")] [InlineData("abc")]
    public async Task Change_password_rejects_short_new_values(string password)
    {
        var f=new Fixture();await Assert.ThrowsAsync<AppException>(()=>f.Users.ChangePasswordAsync("old-password",password,Employee,default));
    }

    [Theory]
    [InlineData("", "password")] [InlineData(" ", "password")] [InlineData("\t", "password")]
    [InlineData("a@b.com", "")] [InlineData("a@b.com", "wrong")] [InlineData("missing@b.com", "password")]
    public async Task Login_rejects_blank_or_invalid_credentials_without_token(string email,string password)
    {
        var f=new Fixture();await Assert.ThrowsAsync<AppException>(()=>f.Auth.LoginAsync(email,password,default));Assert.Equal(0,f.Token.IssueCalls);
    }

    [Theory]
    [InlineData("a@b.com")] [InlineData("A@B.COM")] [InlineData(" a@b.com ")]
    public async Task Login_normalizes_email_lookup(string email)
    {
        var f=new Fixture();var result=await f.Auth.LoginAsync(email,"password",default);Assert.Equal("alice",result.User.Username);Assert.Equal(1,f.Token.IssueCalls);
    }

    private static readonly Actor Admin=new(99,UserRole.ADMIN);private static readonly Actor Employee=new(1,UserRole.EMPLOYEE);
    private static UserWrite Write(string username,string email,string name)=>new(username,email,name,null,"UTC",UserRole.EMPLOYEE,true);
    private sealed class Fixture
    {
        public Repo Repo{get;}=new();public Passwords Passwords{get;}=new();public Token Token{get;}=new();public UserService Users{get;}public AuthenticationService Auth{get;}
        public Fixture(){Users=new(Repo,Passwords,new Clock());Auth=new(Repo,Passwords,Token,new Clock());}
    }
    private sealed class Clock:IClock{public DateTimeOffset UtcNow=>new(2026,1,1,0,0,0,TimeSpan.Zero);}
    private sealed class Passwords:IPasswordService{public string Hash(string p)=>"H:"+p;public bool Verify(string h,string p)=>h=="H:"+p;}
    private sealed class Token:ITokenIssuer{public int IssueCalls{get;private set;}public string Issue(UserAccount u,DateTimeOffset e){IssueCalls++;return "token";}}
    private sealed class Repo:IUserRepository
    {
        public List<UserAccount> Data{get;}=[new(){Id=1,Username="alice",Email="a@b.com",PasswordHash="H:password",FullName="Alice",Timezone="UTC",Role=UserRole.EMPLOYEE,IsActive=true}];
        public Task<UserAccount?>FindByEmailAsync(string e,CancellationToken ct)=>Task.FromResult(Data.SingleOrDefault(x=>x.Email.Equals(e,StringComparison.OrdinalIgnoreCase)));public Task<UserAccount?>GetAsync(long id,CancellationToken ct)=>Task.FromResult(Data.SingleOrDefault(x=>x.Id==id));public Task<IReadOnlyList<UserAccount>>ListAsync(CancellationToken ct)=>Task.FromResult<IReadOnlyList<UserAccount>>(Data);public Task<UserAccount>AddAsync(UserAccount u,CancellationToken ct){u.Id=Data.Count+1;Data.Add(u);return Task.FromResult(u);}public Task UpdateAsync(UserAccount u,CancellationToken ct)=>Task.CompletedTask;public Task<bool>UsernameOrEmailExistsAsync(string u,string e,long? x,CancellationToken ct)=>Task.FromResult(Data.Any(y=>y.Id!=x&&(y.Username.Equals(u,StringComparison.OrdinalIgnoreCase)||y.Email.Equals(e,StringComparison.OrdinalIgnoreCase))));
    }
}
