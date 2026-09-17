using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using System.Text.Json;
using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Users;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace HandmadeFinance.Api.Authorization;

public sealed class TokenService(IConfiguration config) : ITokenIssuer
{
    private byte[] Key=>Encoding.UTF8.GetBytes(config["Authentication:SigningKey"]??"development-only-key-change-before-production-123456");
    public string Issue(UserAccount user,DateTimeOffset expiresAt){var payload=Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(new TokenData(user.Id,user.Role.ToString(),expiresAt.ToUnixTimeSeconds()))));using var h=new HMACSHA256(Key);return payload+"."+Convert.ToBase64String(h.ComputeHash(Encoding.UTF8.GetBytes(payload)));}
    public TokenData? Validate(string token){var p=token.Split('.');if(p.Length!=2)return null;try{using var h=new HMACSHA256(Key);if(!CryptographicOperations.FixedTimeEquals(h.ComputeHash(Encoding.UTF8.GetBytes(p[0])),Convert.FromBase64String(p[1])))return null;var d=JsonSerializer.Deserialize<TokenData>(Encoding.UTF8.GetString(Convert.FromBase64String(p[0])));return d?.ExpiresAt>DateTimeOffset.UtcNow.ToUnixTimeSeconds()?d:null;}catch{return null;}}
    public sealed record TokenData(long UserId,string Role,long ExpiresAt);
}

public sealed class TokenAuthenticationHandler(IOptionsMonitor<AuthenticationSchemeOptions> options,ILoggerFactory logger,UrlEncoder encoder,TokenService tokens):AuthenticationHandler<AuthenticationSchemeOptions>(options,logger,encoder)
{
    public new const string Scheme="Bearer";
    protected override Task<AuthenticateResult> HandleAuthenticateAsync(){var header=Request.Headers.Authorization.ToString();if(!header.StartsWith("Bearer ",StringComparison.OrdinalIgnoreCase))return Task.FromResult(AuthenticateResult.NoResult());var d=tokens.Validate(header[7..]);if(d is null)return Task.FromResult(AuthenticateResult.Fail("Invalid token"));var claims=new[]{new Claim(ClaimTypes.NameIdentifier,d.UserId.ToString()),new Claim(ClaimTypes.Role,d.Role)};return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(new ClaimsIdentity(claims,Scheme)),Scheme)));}
}
