using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Categories;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Ledger;
using HandmadeFinance.Application.Operations;
using Xunit;

namespace HandmadeFinance.Application.Tests.Operations;

public sealed class ImportServiceTests
{
    private static readonly string[] IncomeHeader =
        ["Ngày thu", "Nội dung", "Loại thu", "Số tiền", "Tiền tệ", "Mã tham chiếu"];

    private static readonly Actor Admin = new(1, UserRole.ADMIN);

    private readonly FakeLedger _ledger = new();
    private readonly FakeStore _store = new();

    private ImportService Service(params SheetRow[] sheet) =>
        new(new FakeReader(sheet), new FakeCategories(), _ledger, _store, new FakeClock());

    private static SheetRow Row(int n, params string[] cells) => new(n, cells);

    private static Task<ImportPreview> Preview(ImportService s, EntryKind kind = EntryKind.INCOME) =>
        s.PreviewAsync(kind, "f.xlsx", Stream.Null, default);

    [Fact]
    public async Task Valid_rows_are_previewed_and_nothing_is_saved()
    {
        var s = Service(
            Row(1, IncomeHeader),
            Row(2, "2026-09-01", "Order A", "Bán hàng", "85.5", "USD", "ETS-1"),
            Row(3, "02/09/2026", "Order B", "Thu khác", "10", "", "")
        );
        var preview = await Preview(s);
        Assert.Equal(2, preview.TotalRows);
        Assert.Equal(2, preview.ValidRows);
        Assert.Equal(0, preview.InvalidRows);
        Assert.Equal("Sales", preview.Rows[0].Category);
        Assert.Equal("2026-09-02", preview.Rows[1].Date);
        Assert.Empty(_ledger.Created);
        Assert.Empty(_store.Batches);
    }

    [Fact]
    public async Task Vietnamese_and_english_category_names_resolve_regardless_of_case_and_accents()
    {
        var s = Service(
            Row(1, IncomeHeader),
            Row(2, "2026-09-01", "a", "BÁN HÀNG", "1", "", ""),
            Row(3, "2026-09-01", "b", "sales", "1", "", ""),
            Row(4, "2026-09-01", "c", "  Thu   khác ", "1", "", "")
        );
        var preview = await Preview(s);
        Assert.Equal(3, preview.ValidRows);
        Assert.Equal(["Sales", "Sales", "Other Income"], preview.Rows.Select(r => r.Category ?? "").ToArray());
    }

    [Theory]
    [InlineData("not-a-date", "x", "Sales", "10", "USD", "date")]
    [InlineData("2026-09-01", "", "Sales", "10", "USD", "Description")]
    [InlineData("2026-09-01", "x", "Nope", "10", "USD", "category")]
    [InlineData("2026-09-01", "x", "Sales", "0", "USD", "Amount")]
    [InlineData("2026-09-01", "x", "Sales", "-3", "USD", "Amount")]
    [InlineData("2026-09-01", "x", "Sales", "abc", "USD", "Amount")]
    [InlineData("2026-09-01", "x", "Sales", "10", "EUR", "USD")]
    public async Task Invalid_rows_are_reported_with_a_reason(
        string date,
        string desc,
        string cat,
        string amount,
        string ccy,
        string reason
    )
    {
        var s = Service(Row(1, IncomeHeader), Row(2, date, desc, cat, amount, ccy, ""));
        var preview = await Preview(s);
        Assert.Equal(1, preview.InvalidRows);
        Assert.Equal("INVALID", preview.Rows[0].Status);
        Assert.Contains(
            preview.Rows[0].Errors,
            e => e.Contains(reason, StringComparison.OrdinalIgnoreCase)
        );
    }

    [Fact]
    public async Task Blank_rows_are_ignored()
    {
        var s = Service(
            Row(1, IncomeHeader),
            Row(2, "", "", "", "", "", ""),
            Row(3, "2026-09-01", "x", "Sales", "1", "", "")
        );
        Assert.Equal(1, (await Preview(s)).TotalRows);
    }

    [Theory]
    [InlineData("header-only")]
    [InlineData("empty")]
    [InlineData("missing-amount")]
    public async Task Structurally_unusable_workbooks_are_rejected(string shape)
    {
        var s = shape switch
        {
            "empty" => Service(),
            "header-only" => Service(Row(1, IncomeHeader)),
            _ => Service(Row(1, "Ngày thu", "Nội dung", "Loại thu"), Row(2, "2026-09-01", "x", "Sales")),
        };
        var ex = await Assert.ThrowsAsync<AppException>(() => Preview(s));
        Assert.Equal(400, ex.Status);
    }

    [Fact]
    public async Task More_than_the_maximum_number_of_rows_is_rejected()
    {
        var rows = new List<SheetRow> { Row(1, IncomeHeader) };
        rows.AddRange(
            Enumerable
                .Range(2, ImportService.MaxRows + 1)
                .Select(i => Row(i, "2026-09-01", "x", "Sales", "1", "", ""))
        );
        var ex = await Assert.ThrowsAsync<AppException>(() => Preview(Service([.. rows])));
        Assert.Equal(400, ex.Status);
    }

    [Fact]
    public async Task Import_saves_valid_rows_maps_fields_and_records_the_batch()
    {
        var s = Service(
            Row(1, IncomeHeader),
            Row(2, "2026-09-01", "Order A", "Bán hàng", "100", "USD", "ETS-1"),
            Row(3, "bad", "Order B", "Sales", "5", "USD", "")
        );
        var batch = await s.ImportAsync(EntryKind.INCOME, "f.xlsx", Stream.Null, Admin, default);

        var saved = Assert.Single(_ledger.Created);
        Assert.Equal(EntryKind.INCOME, saved.Kind);
        Assert.Equal(new DateOnly(2026, 9, 1), saved.Write.Date);
        Assert.Equal(1, saved.Write.CategoryId);
        Assert.Equal(100m, saved.Write.AmountAfterTax);
        Assert.Equal("ETS-1", saved.Write.OrderCode);
        Assert.Null(saved.Write.Payee);
        Assert.Equal((2, 1, 1), (batch.TotalRows, batch.SuccessRows, batch.FailedRows));
        Assert.Equal("COMPLETED", batch.Status);
        Assert.NotNull(batch.ErrorDetails);
    }

    [Fact]
    public async Task Expense_import_maps_the_recipient_column_to_payee()
    {
        var s = Service(
            Row(1, "Ngày chi", "Nội dung", "Loại chi", "Số tiền", "Tiền tệ", "Người nhận"),
            Row(2, "2026-09-01", "Yarn", "Nguyên vật liệu", "180", "USD", "Yarn Shop")
        );
        await s.ImportAsync(EntryKind.EXPENSE, "f.xlsx", Stream.Null, Admin, default);
        var saved = Assert.Single(_ledger.Created);
        Assert.Equal("Yarn Shop", saved.Write.Payee);
        Assert.Null(saved.Write.OrderCode);
        Assert.Equal(3, saved.Write.CategoryId);
    }

    [Fact]
    public async Task Optional_tax_column_feeds_the_after_tax_amount()
    {
        var s = Service(
            Row(1, "Ngày thu", "Nội dung", "Loại thu", "Số tiền", "Thuế (%)"),
            Row(2, "2026-09-01", "Taxed", "Sales", "100", "10")
        );
        await s.ImportAsync(EntryKind.INCOME, "f.xlsx", Stream.Null, Admin, default);
        Assert.Equal(
            (10m, 110m),
            (_ledger.Created[0].Write.TaxPercent, _ledger.Created[0].Write.AmountAfterTax)
        );
    }

    [Fact]
    public async Task Import_where_nothing_is_valid_is_marked_failed()
    {
        var s = Service(Row(1, IncomeHeader), Row(2, "bad", "x", "Nope", "-1", "USD", ""));
        var batch = await s.ImportAsync(EntryKind.INCOME, "f.xlsx", Stream.Null, Admin, default);
        Assert.Equal("FAILED", batch.Status);
        Assert.Empty(_ledger.Created);
    }

    [Fact]
    public async Task A_row_rejected_by_the_ledger_counts_as_failed_without_stopping_the_import()
    {
        _ledger.RejectDescription = "boom";
        var s = Service(
            Row(1, IncomeHeader),
            Row(2, "2026-09-01", "boom", "Sales", "1", "", ""),
            Row(3, "2026-09-01", "fine", "Sales", "1", "", "")
        );
        var batch = await s.ImportAsync(EntryKind.INCOME, "f.xlsx", Stream.Null, Admin, default);
        Assert.Equal((1, 1), (batch.SuccessRows, batch.FailedRows));
    }

    [Fact]
    public async Task Import_reports_every_row_as_failed_when_the_ledger_rejects_the_actor()
    {
        _ledger.RejectAll = true;
        var s = Service(Row(1, IncomeHeader), Row(2, "2026-09-01", "x", "Sales", "1", "", ""));
        var batch = await s.ImportAsync(EntryKind.INCOME, "f.xlsx", Stream.Null, new(9, UserRole.VIEWER), default);
        Assert.Equal(0, batch.SuccessRows);
        Assert.Equal("FAILED", batch.Status);
    }

    [Theory]
    [InlineData("Nguyên Vật Liệu", "nguyen vat lieu")]
    [InlineData("  Đơn   hàng ", "don hang")]
    [InlineData("", "")]
    [InlineData(null, "")]
    public void Normalize_strips_accents_case_and_extra_spaces(string? input, string expected) =>
        Assert.Equal(expected, ImportService.Normalize(input));

    // ------------------------------------------------------------------ fakes
    private sealed class FakeReader(SheetRow[] rows) : IImportSheetReader
    {
        public IReadOnlyList<SheetRow> Read(Stream stream) => rows;
    }

    private sealed class FakeCategories : ICategoryRepository
    {
        private static readonly Category[] All =
        [
            new() { Id = 1, Kind = EntryKind.INCOME, Name = "Sales" },
            new() { Id = 2, Kind = EntryKind.INCOME, Name = "Other Income" },
            new() { Id = 3, Kind = EntryKind.EXPENSE, Name = "Raw Materials" },
            new() { Id = 4, Kind = EntryKind.EXPENSE, Name = "Shipping" },
        ];

        public Task<IReadOnlyList<Category>> ListActiveAsync(EntryKind kind, CancellationToken ct) =>
            Task.FromResult<IReadOnlyList<Category>>(All.Where(c => c.Kind == kind).ToList());

        public Task<bool> ExistsAsync(long id, EntryKind kind, CancellationToken ct) =>
            Task.FromResult(All.Any(c => c.Id == id && c.Kind == kind));
    }

    private sealed class FakeLedger : ILedgerService
    {
        public List<(EntryKind Kind, LedgerWrite Write)> Created { get; } = [];
        public string? RejectDescription { get; set; }
        public bool RejectAll { get; set; }

        public Task<LedgerEntry> CreateAsync(
            EntryKind kind,
            LedgerWrite request,
            Actor actor,
            CancellationToken ct
        )
        {
            if (RejectAll || request.Description == RejectDescription)
                throw AppException.Forbidden();
            Created.Add((kind, request));
            return Task.FromResult(new LedgerEntry { Id = Created.Count, Kind = kind });
        }

        public Task<PageResult<LedgerEntry>> ListAsync(EntryKind kind, LedgerQuery query, CancellationToken ct) =>
            throw new NotSupportedException();

        public Task<LedgerEntry> GetAsync(EntryKind kind, long id, CancellationToken ct) =>
            throw new NotSupportedException();

        public Task<LedgerEntry> UpdateAsync(
            EntryKind kind,
            long id,
            LedgerWrite request,
            Actor actor,
            CancellationToken ct
        ) => throw new NotSupportedException();

        public Task DeleteAsync(EntryKind kind, long id, Actor actor, CancellationToken ct) =>
            throw new NotSupportedException();
    }

    private sealed class FakeStore : IOperationalStore
    {
        public List<ImportBatchRecord> Batches { get; } = [];
        public IReadOnlyList<ImportBatchRecord> Imports => Batches;
        public IReadOnlyList<AttachmentRecord> Attachments => [];
        public IReadOnlyList<AuditRecord> Audits => [];

        public ImportBatchRecord AddImport(string type, string name, int rows, long actor, DateTimeOffset now) =>
            AddImport(type, name, rows, rows, 0, null, actor, now);

        public ImportBatchRecord AddImport(
            string type,
            string name,
            int total,
            int success,
            int failed,
            object? errors,
            long actor,
            DateTimeOffset now
        )
        {
            var batch = new ImportBatchRecord(
                Batches.Count + 1,
                type,
                name,
                success == 0 && total > 0 ? "FAILED" : "COMPLETED",
                total,
                success,
                failed,
                actor,
                now,
                now,
                errors
            );
            Batches.Add(batch);
            return batch;
        }

        public AttachmentRecord AddAttachment(
            EntryKind kind,
            long entryId,
            string name,
            string? mime,
            byte[] content,
            long actor,
            DateTimeOffset now
        ) => throw new NotSupportedException();

        public ImportBatchRecord? FindImport(long id) => Batches.SingleOrDefault(x => x.Id == id);

        public AttachmentRecord? FindAttachment(long id) => null;

        public bool RemoveAttachment(long id) => false;

        public void Audit(string action, string module, string detail, long actor, DateTimeOffset now) { }
    }

    private sealed class FakeClock : IClock
    {
        public DateTimeOffset UtcNow => new(2026, 9, 17, 0, 0, 0, TimeSpan.Zero);
    }
}
