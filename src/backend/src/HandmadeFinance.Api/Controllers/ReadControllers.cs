using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandmadeFinance.Api.Controllers;

[Authorize, ApiController, Route("api/v1/categories")]
public sealed class CategoriesController : ControllerBase
{
    private static readonly object[] Income =
    [
        new
        {
            id = 1,
            name = "Sales",
            isActive = true,
        },
        new
        {
            id = 2,
            name = "Services",
            isActive = true,
        },
    ];
    private static readonly object[] Expense =
    [
        new
        {
            id = 3,
            name = "Materials",
            isActive = true,
        },
        new
        {
            id = 4,
            name = "Shipping",
            isActive = true,
        },
    ];

    [HttpGet("income")]
    public IActionResult GetIncome() => Ok(Income);

    [HttpGet("expense")]
    public IActionResult GetExpense() => Ok(Expense);
}

[Authorize, ApiController, Route("api/v1/dashboard")]
public sealed class DashboardController(ILedgerRepository repository) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(DateOnly? dateFrom, DateOnly? dateTo, CancellationToken ct)
    {
        if (dateFrom > dateTo)
            throw AppException.Validation("dateFrom must not be after dateTo.");
        var i = Filter(await repository.ListAsync(EntryKind.INCOME, ct), dateFrom, dateTo);
        var e = Filter(await repository.ListAsync(EntryKind.EXPENSE, ct), dateFrom, dateTo);
        var ti = i.Sum(x => x.AmountAfterTax);
        var te = e.Sum(x => x.AmountAfterTax);
        return Ok(
            new
            {
                currencyCode = "USD",
                totalIncome = ti,
                totalExpense = te,
                netResult = ti - te,
                transactionCount = i.Count + e.Count,
                cashflow = Array.Empty<object>(),
                incomeByCategory = Array.Empty<object>(),
                recentTransactions = i.Concat(e).OrderByDescending(x => x.Date).Take(10),
            }
        );
    }

    private static List<Application.Ledger.LedgerEntry> Filter(
        IReadOnlyList<Application.Ledger.LedgerEntry> x,
        DateOnly? f,
        DateOnly? t
    ) =>
        x.Where(r =>
                r.DeletedAt is null && (!f.HasValue || r.Date >= f) && (!t.HasValue || r.Date <= t)
            )
            .ToList();
}

[Authorize(Roles = "ADMIN,SHOP_OWNER,VIEWER"), ApiController, Route("api/v1/reports")]
public sealed class ReportsController(ILedgerRepository repository) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(DateOnly? dateFrom, DateOnly? dateTo, CancellationToken ct)
    {
        if (dateFrom > dateTo)
            throw AppException.Validation("dateFrom must not be after dateTo.");
        var i = (await repository.ListAsync(EntryKind.INCOME, ct))
            .Where(x => x.DeletedAt is null)
            .Sum(x => x.AmountAfterTax);
        var e = (await repository.ListAsync(EntryKind.EXPENSE, ct))
            .Where(x => x.DeletedAt is null)
            .Sum(x => x.AmountAfterTax);
        return Ok(
            new
            {
                currencyCode = "USD",
                totalIncome = i,
                totalExpense = e,
                netResult = i - e,
                points = Array.Empty<object>(),
            }
        );
    }
}
