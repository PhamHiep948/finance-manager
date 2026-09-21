using HandmadeFinance.Api.Authorization;
using HandmadeFinance.Api.Middleware;
using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Authentication;
using HandmadeFinance.Application.Categories;
using HandmadeFinance.Application.Ledger;
using HandmadeFinance.Application.Operations;
using HandmadeFinance.Application.Reporting;
using HandmadeFinance.Application.Users;
using HandmadeFinance.Infrastructure;
using HandmadeFinance.Infrastructure.Persistence;
using HandmadeFinance.Infrastructure.Persistence.Repositories;
using Microsoft.EntityFrameworkCore;

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
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
        .AllowAnyHeader()
        .AllowAnyMethod()));
builder.Services.AddProblemDetails();
builder.Services.AddSingleton<IClock, SystemClock>();
builder.Services.AddSingleton<IPasswordService, PasswordService>();
builder.Services.AddSingleton<OperationalStore>();
builder.Services.AddSingleton<AuditTrail>();
builder.Services.AddSingleton<IImportSheetReader, ClosedXmlSheetReader>();
builder.Services.AddSingleton<IReportDocumentBuilder, ReportDocumentBuilder>();
builder.Services.AddSingleton<IOperationalStore>(x => x.GetRequiredService<OperationalStore>());
if (builder.Environment.IsEnvironment("Testing"))
{
    builder.Services.AddSingleton<InMemoryStore>();
    builder.Services.AddSingleton<ILedgerRepository>(x => x.GetRequiredService<InMemoryStore>());
    builder.Services.AddSingleton<IUserRepository>(x => x.GetRequiredService<InMemoryStore>());
    builder.Services.AddSingleton<ICategoryRepository, InMemoryCategoryRepository>();
}
else
{
    var connectionString = builder.Configuration.GetConnectionString("PostgreSql");
    if (string.IsNullOrWhiteSpace(connectionString))
        throw new InvalidOperationException(
            "ConnectionStrings:PostgreSql is required. No production database fallback is configured."
        );
    builder.Services.AddSingleton(new PostgresConnectionFactory(connectionString));
    builder.Services.AddScoped<ILedgerRepository, PostgresLedgerRepository>();
    builder.Services.AddScoped<IUserRepository, PostgresUserRepository>();
    builder.Services.AddScoped<ICategoryRepository, PostgresCategoryRepository>();
}
builder.Services.AddSingleton<TokenService>();
builder.Services.AddSingleton<ITokenIssuer>(x => x.GetRequiredService<TokenService>());
builder.Services.AddScoped<ILedgerService, LedgerService>();
builder.Services.AddScoped<IReportingService, ReportingService>();
builder.Services.AddScoped<AuthenticationService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<CategoryService>();
builder.Services.AddScoped<IImportService, ImportService>();
var app = builder.Build();
app.UseMiddleware<AppExceptionMiddleware>();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapGet("/health", () => Results.Ok(new { status = "healthy" }));
app.Run();

public partial class Program { }
