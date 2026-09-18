using HandmadeFinance.Api.Authorization;
using HandmadeFinance.Api.Contracts;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Ledger;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandmadeFinance.Api.Controllers;

[Authorize, ApiController]
public abstract class LedgerControllerBase(ILedgerService service, EntryKind kind) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] DateOnly? dateFrom = null,
        [FromQuery] DateOnly? dateTo = null,
        CancellationToken ct = default
    ) => Ok(await service.ListAsync(kind, new(page, pageSize, search, dateFrom, dateTo), ct));

    [HttpGet("{id:long}")]
    public async Task<IActionResult> Get(long id, CancellationToken ct) =>
        Ok(await service.GetAsync(kind, id, ct));

    [HttpPost]
    public async Task<IActionResult> Create(LedgerRequest r, CancellationToken ct)
    {
        var row = await service.CreateAsync(kind, Map(r), User.Actor(), ct);
        return CreatedAtAction(nameof(Get), new { id = row.Id }, row);
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, LedgerRequest r, CancellationToken ct) =>
        Ok(await service.UpdateAsync(kind, id, Map(r), User.Actor(), ct));

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        await service.DeleteAsync(kind, id, User.Actor(), ct);
        return NoContent();
    }

    private static LedgerWrite Map(LedgerRequest r) =>
        new(
            r.Date,
            r.Description,
            r.CategoryId,
            r.Amount,
            r.TaxPercent,
            r.AmountAfterTax,
            r.CurrencyCode
        );
}

[Route("api/v1/incomes")]
public sealed class IncomesController(ILedgerService s) : LedgerControllerBase(s, EntryKind.INCOME);

[Route("api/v1/expenses")]
public sealed class ExpensesController(ILedgerService s)
    : LedgerControllerBase(s, EntryKind.EXPENSE);
