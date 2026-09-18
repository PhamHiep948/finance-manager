using HandmadeFinance.Api.Authorization;
using HandmadeFinance.Api.Middleware;
using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Authentication;
using HandmadeFinance.Application.Ledger;
using HandmadeFinance.Application.Users;
using HandmadeFinance.Infrastructure;

var builder = WebApplication.CreateBuilder(args);
builder
    .Services.AddControllers()
    .AddJsonOptions(o =>
        o.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter()
        )
    );
builder
    .Services.AddAuthentication(TokenAuthenticationHandler.Scheme)
    .AddScheme<
        Microsoft.AspNetCore.Authentication.AuthenticationSchemeOptions,
        TokenAuthenticationHandler
    >(TokenAuthenticationHandler.Scheme, _ => { });
builder.Services.AddAuthorization();
builder.Services.AddProblemDetails();
builder.Services.AddSingleton<IClock, SystemClock>();
builder.Services.AddSingleton<IPasswordService, PasswordService>();
builder.Services.AddSingleton<InMemoryStore>();
builder.Services.AddSingleton<OperationalStore>();
builder.Services.AddSingleton<ILedgerRepository>(x => x.GetRequiredService<InMemoryStore>());
builder.Services.AddSingleton<IUserRepository>(x => x.GetRequiredService<InMemoryStore>());
builder.Services.AddSingleton<TokenService>();
builder.Services.AddSingleton<ITokenIssuer>(x => x.GetRequiredService<TokenService>());
builder.Services.AddScoped<ILedgerService, LedgerService>();
builder.Services.AddScoped<AuthenticationService>();
builder.Services.AddScoped<UserService>();
var app = builder.Build();
app.UseMiddleware<AppExceptionMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));
app.Run();

public partial class Program { }
