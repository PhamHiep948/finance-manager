using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Ledger;
using HandmadeFinance.Infrastructure.Persistence;
using Npgsql;
using Xunit;

namespace HandmadeFinance.Infrastructure.Tests.Postgres;

public sealed class PostgresLedgerRepositoryTests(PostgresDatabase database) : IClassFixture<PostgresDatabase>
{
    private static readonly DateTimeOffset Now = new(2026, 9, 17, 10, 0, 0, TimeSpan.Zero);

    private PostgresLedgerRepository Repo => new(database.Connections);

    private async Task<long> CategoryId(EntryKind kind, string name) =>
        (await new PostgresCategoryRepository(database.Connections).ListActiveAsync(kind, default)).Single(c => c.Name == name).Id;

    private async Task<long> AdminId() =>
        (await new PostgresUserRepository(database.Connections).FindByEmailAsync("admin@demo.local", default))!.Id;

    private async Task<LedgerEntry> NewEntry(
        EntryKind kind,
        string description,
        Action<LedgerEntry>? customize = null,
        decimal amount = 100m,
        DateOnly? date = null,
        long? createdBy = null
    )
    {
        var entry = new LedgerEntry
        {
            Kind = kind,
            Date = date ?? new DateOnly(2026, 9, 15),
            Description = description,
            CategoryId = await CategoryId(kind, kind == EntryKind.INCOME ? "Sales" : "Raw Materials"),
            Amount = amount,
            TaxPercent = 10m,
            AmountAfterTax = decimal.Round(amount * 1.1m, 2),
            CurrencyCode = "USD",
            CreatedBy = createdBy ?? await AdminId(),
            CreatedAt = Now,
            UpdatedAt = Now,
        };
        customize?.Invoke(entry);
        return await Repo.AddAsync(entry, default);
    }

    private static string Unique(string prefix) => $"{prefix}-{Guid.NewGuid():N}";

    [PostgresFact]
    public async Task Income_round_trips_with_all_detail_fields()
    {
        var added = await NewEntry(EntryKind.INCOME, Unique("income"), e =>
        {
            e.OrderCode = "HF-2026-0001";
            e.SaleRegion = "IN_EU";
            e.SalesChannel = "ETSY_STORE";
            e.ProductQty = 3;
        });

        Assert.True(added.Id > 0);
        var read = await Repo.GetAsync(EntryKind.INCOME, added.Id, default);
        Assert.NotNull(read);
        Assert.Equal((EntryKind.INCOME, new DateOnly(2026, 9, 15)), (read.Kind, read.Date));
        Assert.Equal(added.Description, read.Description);
        Assert.Equal((100m, 10m, 110m, "USD"), (read.Amount, read.TaxPercent, read.AmountAfterTax, read.CurrencyCode));
        Assert.Equal("HF-2026-0001", read.OrderCode);
        Assert.Equal("IN_EU", read.SaleRegion);
        Assert.Equal("ETSY_STORE", read.SalesChannel);
        Assert.Equal(3, read.ProductQty);
        Assert.Null(read.Payee);
        Assert.Null(read.OriginScope);
        Assert.Null(read.PaymentMethod);
        Assert.Equal(await AdminId(), read.CreatedBy);
        Assert.Null(read.DeletedAt);
    }

    [PostgresFact]
    public async Task Expense_round_trips_with_all_detail_fields()
    {
        var added = await NewEntry(EntryKind.EXPENSE, Unique("expense"), e =>
        {
            e.Payee = "DHL Express";
            e.OriginScope = "INTERNATIONAL";
            e.PaymentMethod = "PAYPAL";
        });

        var read = await Repo.GetAsync(EntryKind.EXPENSE, added.Id, default);
        Assert.NotNull(read);
        Assert.Equal("DHL Express", read.Payee);
        Assert.Equal("INTERNATIONAL", read.OriginScope);
        Assert.Equal("PAYPAL", read.PaymentMethod);
        Assert.Null(read.OrderCode);
        Assert.Null(read.SaleRegion);
        Assert.Null(read.SalesChannel);
        Assert.Null(read.ProductQty);
    }

    [PostgresFact]
    public async Task Expense_without_origin_scope_defaults_to_domestic_and_optional_fields_stay_null()
    {
        var added = await NewEntry(EntryKind.EXPENSE, Unique("plain-expense"));
        var read = await Repo.GetAsync(EntryKind.EXPENSE, added.Id, default);
        Assert.Equal("DOMESTIC", read!.OriginScope);
        Assert.Null(read.Payee);
        Assert.Null(read.PaymentMethod);
    }

    [PostgresFact]
    public async Task Entries_are_isolated_by_kind()
    {
        var income = await NewEntry(EntryKind.INCOME, Unique("kind-income"));
        Assert.Null(await Repo.GetAsync(EntryKind.EXPENSE, income.Id, default));
    }

    [PostgresFact]
    public async Task Update_changes_values_and_detail_fields()
    {
        var added = await NewEntry(EntryKind.INCOME, Unique("to-update"), e => e.SalesChannel = "ETSY_STORE");
        var adminId = await AdminId();

        added.Description += "-edited";
        added.Amount = 200m;
        added.TaxPercent = 0m;
        added.AmountAfterTax = 200m;
        added.OrderCode = "HF-EDIT";
        added.SaleRegion = "OUTSIDE_EU";
        added.SalesChannel = "WEBSITE_DIRECT";
        added.ProductQty = 5;
        added.UpdatedBy = adminId;
        added.UpdatedAt = Now.AddHours(1);
        await Repo.UpdateAsync(added, default);

        var read = await Repo.GetAsync(EntryKind.INCOME, added.Id, default);
        Assert.Equal(added.Description, read!.Description);
        Assert.Equal((200m, 0m, 200m), (read.Amount, read.TaxPercent, read.AmountAfterTax));
        Assert.Equal("HF-EDIT", read.OrderCode);
        Assert.Equal("OUTSIDE_EU", read.SaleRegion);
        Assert.Equal("WEBSITE_DIRECT", read.SalesChannel);
        Assert.Equal(5, read.ProductQty);
        Assert.Equal(adminId, read.UpdatedBy);
        Assert.Equal(Now.AddHours(1), read.UpdatedAt);
    }

    [PostgresFact]
    public async Task Update_can_clear_optional_detail_fields()
    {
        var added = await NewEntry(EntryKind.EXPENSE, Unique("clear"), e =>
        {
            e.Payee = "Someone";
            e.PaymentMethod = "CASH";
        });
        added.Payee = null;
        added.PaymentMethod = null;
        await Repo.UpdateAsync(added, default);

        var read = await Repo.GetAsync(EntryKind.EXPENSE, added.Id, default);
        Assert.Null(read!.Payee);
        Assert.Null(read.PaymentMethod);
    }

    [PostgresFact]
    public async Task Soft_deleted_rows_are_excluded_from_search_but_remain_stored()
    {
        var marker = Unique("soft");
        var added = await NewEntry(EntryKind.INCOME, marker);
        added.DeletedAt = Now.AddDays(1);
        added.DeletedBy = await AdminId();
        await Repo.UpdateAsync(added, default);

        var page = await Repo.SearchAsync(EntryKind.INCOME, new(Search: marker), default);
        Assert.Empty(page.Items);
        var stored = await Repo.GetAsync(EntryKind.INCOME, added.Id, default);
        Assert.NotNull(stored!.DeletedAt);
        Assert.Equal(added.DeletedBy, stored.DeletedBy);
    }

    [PostgresFact]
    public async Task Search_filters_by_text_date_range_and_category()
    {
        var marker = Unique("filter");
        var salesId = await CategoryId(EntryKind.INCOME, "Sales");
        var otherId = await CategoryId(EntryKind.INCOME, "Other Income");
        await NewEntry(EntryKind.INCOME, marker + "-a", date: new DateOnly(2026, 1, 10));
        await NewEntry(EntryKind.INCOME, marker + "-b", date: new DateOnly(2026, 2, 10));
        await NewEntry(EntryKind.INCOME, marker + "-c", e => e.CategoryId = otherId, date: new DateOnly(2026, 3, 10));

        var all = await Repo.SearchAsync(EntryKind.INCOME, new(Search: marker.ToUpperInvariant()), default);
        Assert.Equal(3, all.TotalItems);

        var february = await Repo.SearchAsync(EntryKind.INCOME, new(Search: marker, DateFrom: new(2026, 2, 1), DateTo: new(2026, 2, 28)), default);
        Assert.Equal([marker + "-b"], february.Items.Select(x => x.Description).ToArray());

        var boundary = await Repo.SearchAsync(EntryKind.INCOME, new(Search: marker, DateFrom: new(2026, 1, 10), DateTo: new(2026, 3, 10)), default);
        Assert.Equal(3, boundary.TotalItems);

        var other = await Repo.SearchAsync(EntryKind.INCOME, new(Search: marker, CategoryId: otherId), default);
        Assert.Equal([marker + "-c"], other.Items.Select(x => x.Description).ToArray());
        var sales = await Repo.SearchAsync(EntryKind.INCOME, new(Search: marker, CategoryId: salesId), default);
        Assert.Equal(2, sales.TotalItems);
    }

    [PostgresFact]
    public async Task Search_pages_and_sorts()
    {
        var marker = Unique("page");
        for (var i = 1; i <= 5; i++)
            await NewEntry(EntryKind.INCOME, $"{marker}-{i}", amount: i * 10m, date: new DateOnly(2026, 4, i));

        var first = await Repo.SearchAsync(EntryKind.INCOME, new(Page: 1, PageSize: 2, Search: marker), default);
        Assert.Equal((5, 3, 2), (first.TotalItems, first.TotalPages, first.Items.Count));
        Assert.Equal([$"{marker}-5", $"{marker}-4"], first.Items.Select(x => x.Description).ToArray()); // newest date first

        var last = await Repo.SearchAsync(EntryKind.INCOME, new(Page: 3, PageSize: 2, Search: marker), default);
        Assert.Equal([$"{marker}-1"], last.Items.Select(x => x.Description).ToArray());

        var byAmount = await Repo.SearchAsync(EntryKind.INCOME, new(Search: marker, SortBy: "amount", SortDirection: "asc"), default);
        Assert.Equal([10m, 20m, 30m, 40m, 50m], byAmount.Items.Select(x => x.Amount).ToArray());

        var byDescription = await Repo.SearchAsync(EntryKind.INCOME, new(Search: marker, SortBy: "description", SortDirection: "desc"), default);
        Assert.Equal($"{marker}-5", byDescription.Items[0].Description);
    }

    [PostgresFact]
    public async Task Search_treats_wildcards_in_the_text_as_literal_input_safely()
    {
        var marker = Unique("wild");
        await NewEntry(EntryKind.INCOME, marker);
        var page = await Repo.SearchAsync(EntryKind.INCOME, new(Search: "'; DROP TABLE shop_finance.incomes; --"), default);
        Assert.Empty(page.Items);
        Assert.True((await Repo.SearchAsync(EntryKind.INCOME, new(Search: marker), default)).TotalItems == 1);
    }

    [PostgresFact]
    public async Task ListAsync_returns_only_the_requested_kind()
    {
        var income = await NewEntry(EntryKind.INCOME, Unique("list-in"));
        var expense = await NewEntry(EntryKind.EXPENSE, Unique("list-ex"));
        var incomes = await Repo.ListAsync(EntryKind.INCOME, default);
        var expenses = await Repo.ListAsync(EntryKind.EXPENSE, default);
        Assert.All(incomes, x => Assert.Equal(EntryKind.INCOME, x.Kind));
        Assert.All(expenses, x => Assert.Equal(EntryKind.EXPENSE, x.Kind));
        Assert.DoesNotContain(expenses, x => x.Id == income.Id && x.Description == income.Description);
        Assert.Contains(expenses, x => x.Id == expense.Id);
    }

    [PostgresFact]
    public async Task Seeded_sample_transactions_are_readable()
    {
        var seeded = await Repo.SearchAsync(EntryKind.INCOME, new(PageSize: 100), default);
        Assert.NotEmpty(seeded.Items);
        Assert.All(seeded.Items, x => Assert.True(x.Amount > 0));
    }

    [PostgresTheory]
    [InlineData("zero-amount", 0)]
    [InlineData("negative-amount", -5)]
    public async Task Database_rejects_non_positive_amounts(string name, int amount)
    {
        var ex = await Assert.ThrowsAsync<PostgresException>(() => NewEntry(EntryKind.INCOME, Unique(name), amount: amount));
        Assert.Equal("23514", ex.SqlState); // check_violation
    }

    [PostgresFact]
    public async Task Database_rejects_a_currency_other_than_usd()
    {
        var ex = await Assert.ThrowsAsync<PostgresException>(() => NewEntry(EntryKind.INCOME, Unique("eur"), e => e.CurrencyCode = "EUR"));
        Assert.Equal("23514", ex.SqlState);
    }

    [PostgresFact]
    public async Task Database_rejects_a_tax_rate_above_100()
    {
        var ex = await Assert.ThrowsAsync<PostgresException>(() => NewEntry(EntryKind.EXPENSE, Unique("tax"), e => e.TaxPercent = 101m));
        Assert.Equal("23514", ex.SqlState);
    }

    [PostgresFact]
    public async Task Database_rejects_unknown_enum_values()
    {
        var ex = await Assert.ThrowsAsync<PostgresException>(() => NewEntry(EntryKind.INCOME, Unique("bad-region"), e => e.SaleRegion = "MARS"));
        Assert.Equal("22P02", ex.SqlState); // invalid_text_representation
    }

    [PostgresFact]
    public async Task Database_rejects_an_unknown_category()
    {
        var ex = await Assert.ThrowsAsync<PostgresException>(() => NewEntry(EntryKind.INCOME, Unique("no-category"), e => e.CategoryId = 999_999));
        Assert.Equal("23503", ex.SqlState); // foreign_key_violation
    }

    [PostgresFact]
    public async Task Database_rejects_a_creator_that_does_not_exist()
    {
        var ex = await Assert.ThrowsAsync<PostgresException>(() => NewEntry(EntryKind.INCOME, Unique("no-user"), createdBy: 999_999));
        Assert.Equal("23503", ex.SqlState);
    }

    [PostgresFact]
    public async Task Concurrent_inserts_all_succeed_with_distinct_ids()
    {
        var marker = Unique("parallel");
        var added = await Task.WhenAll(Enumerable.Range(0, 12).Select(i => NewEntry(EntryKind.INCOME, $"{marker}-{i}")));
        Assert.Equal(12, added.Select(x => x.Id).Distinct().Count());
        Assert.Equal(12, (await Repo.SearchAsync(EntryKind.INCOME, new(Search: marker, PageSize: 100), default)).TotalItems);
    }
}
