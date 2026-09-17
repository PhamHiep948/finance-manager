using HandmadeFinance.Application.Common;
using Microsoft.AspNetCore.Mvc;

namespace HandmadeFinance.Api.Middleware;
public sealed class AppExceptionMiddleware(RequestDelegate next,ILogger<AppExceptionMiddleware> logger)
{
    public async Task Invoke(HttpContext context){try{await next(context);}catch(AppException ex){await Write(context,ex.Status,ex.Code,ex.Message);}catch(Exception ex){logger.LogError(ex,"Unhandled request failure {TraceId}",context.TraceIdentifier);await Write(context,500,"INTERNAL_ERROR","An unexpected error occurred.");}}
    private static Task Write(HttpContext c,int status,string code,string detail){c.Response.StatusCode=status;c.Response.ContentType="application/problem+json";return c.Response.WriteAsJsonAsync(new ProblemDetails{Status=status,Title=code.Replace('_',' '),Detail=detail,Type=$"https://handmadefinance.local/problems/{code.ToLowerInvariant()}",Extensions={{"errorCode",code},{"traceId",c.TraceIdentifier}}});}
}
