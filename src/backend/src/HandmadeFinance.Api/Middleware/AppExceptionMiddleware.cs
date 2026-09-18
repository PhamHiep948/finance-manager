using System.Text.Json;
using HandmadeFinance.Application.Common;
using Microsoft.AspNetCore.Mvc;

namespace HandmadeFinance.Api.Middleware;

public sealed partial class AppExceptionMiddleware(
    RequestDelegate next,
    ILogger<AppExceptionMiddleware> logger
)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task Invoke(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (AppException ex)
        {
            await Write(context, ex.Status, ex.Code, ex.Message);
        }
        catch (Exception ex)
        {
            LogUnhandledFailure(logger, ex, context.TraceIdentifier);
            await Write(context, 500, "INTERNAL_ERROR", "An unexpected error occurred.");
        }
    }

    private static Task Write(HttpContext c, int status, string code, string detail)
    {
        c.Response.StatusCode = status;
        c.Response.ContentType = "application/problem+json";
        var problem = new ProblemDetails
        {
            Status = status,
            Title = code.Replace('_', ' '),
            Detail = detail,
            Type = $"https://handmadefinance.local/problems/{code.ToLowerInvariant()}",
            Extensions = { { "errorCode", code }, { "traceId", c.TraceIdentifier } },
        };
        return c.Response.WriteAsync(
            JsonSerializer.Serialize(problem, JsonOptions)
        );
    }

    [LoggerMessage(EventId = 1, Level = LogLevel.Error, Message = "Unhandled request failure {TraceId}")]
    private static partial void LogUnhandledFailure(
        ILogger logger,
        Exception exception,
        string traceId
    );
}
