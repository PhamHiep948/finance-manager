using HandmadeFinance.Api.Authorization;
using HandmadeFinance.Api.Contracts;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Ledger;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HandmadeFinance.Api.Controllers;

[Authorize, ApiController]
public abstract class LedgerControllerBase(ILedgerService service, EntryKind kind, AuditTrail audit)
    : ControllerBase
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
        var actor = User.Actor();
        var row = await service.CreateAsync(kind, Map(r), actor, ct);
        audit.Record(actor.UserId, "INSERT", kind.ToString(), $"Created {Label} #{row.Id}: {row.Description}");
        return CreatedAtAction(nameof(Get), new { id = row.Id }, row);
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> Update(long id, LedgerRequest r, CancellationToken ct)
    {
        var actor = User.Actor();
        var row = await service.UpdateAsync(kind, id, Map(r), actor, ct);
        audit.Record(actor.UserId, "UPDATE", kind.ToString(), $"Updated {Label} #{id}: {row.Description}");
        return Ok(row);
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(long id, CancellationToken ct)
    {
        var actor = User.Actor();
        await service.DeleteAsync(kind, id, actor, ct);
        audit.Record(actor.UserId, "DELETE", kind.ToString(), $"Deleted {Label} #{id} (soft delete)");
        return NoContent();
    }

    private string Label => kind.ToString().ToLowerInvariant();

    private static LedgerWrite Map(LedgerRequest r) =>
        new(
            r.Date,
            r.Description,
            r.CategoryId,
            r.Amount,
            r.TaxPercent,
            r.AmountAfterTax,
            r.CurrencyCode,
            r.OrderCode,
            r.SaleRegion,
            r.SalesChannel,
            r.ProductQty,
            r.Payee,
            r.OriginScope,
            r.PaymentMethod
        );
}

[Route("api/v1/incomes")]
public sealed class IncomesController(ILedgerService s, AuditTrail a)
    : LedgerControllerBase(s, EntryKind.INCOME, a);

[Route("api/v1/expenses")]
public sealed class ExpensesController(ILedgerService s, AuditTrail a)
    : LedgerControllerBase(s, EntryKind.EXPENSE, a);
