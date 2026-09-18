using HandmadeFinance.Application.Reporting;
using HandmadeFinance.Application.Categories;
using HandmadeFinance.Application.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandmadeFinance.Api.Controllers;

[Authorize, ApiController, Route("api/v1/categories")]
public sealed class CategoriesController(CategoryService categories) : ControllerBase
{
    [HttpGet("income")]
    public async Task<IActionResult> GetIncome(CancellationToken ct) =>
        Ok(await categories.ListAsync(EntryKind.INCOME, ct));

    [HttpGet("expense")]
    public async Task<IActionResult> GetExpense(CancellationToken ct) =>
        Ok(await categories.ListAsync(EntryKind.EXPENSE, ct));
}

[Authorize, ApiController, Route("api/v1/dashboard")]
public sealed class DashboardController(IReportingService reports) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(DateOnly? dateFrom, DateOnly? dateTo, CancellationToken ct)
    {
        var summary = await reports.GetSummaryAsync(dateFrom, dateTo, ct);
        return Ok(
            new
            {
                currencyCode = summary.CurrencyCode,
                totalIncome = summary.TotalIncome,
                totalExpense = summary.TotalExpense,
                netResult = summary.NetResult,
                transactionCount = summary.Incomes.Count + summary.Expenses.Count,
                cashflow = Array.Empty<object>(),
                incomeByCategory = Array.Empty<object>(),
                recentTransactions = summary.Incomes
                    .Concat(summary.Expenses)
                    .OrderByDescending(x => x.Date)
                    .Take(10),
            }
        );
    }
}

[Authorize(Roles = "ADMIN,SHOP_OWNER,VIEWER"), ApiController, Route("api/v1/reports")]
public sealed class ReportsController(IReportingService reports) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(DateOnly? dateFrom, DateOnly? dateTo, CancellationToken ct)
    {
        var summary = await reports.GetSummaryAsync(dateFrom, dateTo, ct);
        return Ok(
            new
            {
                currencyCode = summary.CurrencyCode,
                totalIncome = summary.TotalIncome,
                totalExpense = summary.TotalExpense,
                netResult = summary.NetResult,
                points = Array.Empty<object>(),
            }
        );
    }
}
