using HandmadeFinance.Application.Common;
using HandmadeFinance.Infrastructure;
using Xunit;

namespace HandmadeFinance.Infrastructure.Tests;

public sealed class OperationalStoreTests
{
    private static readonly DateTimeOffset Now = new(2026, 9, 17, 10, 0, 0, TimeSpan.Zero);

    [Theory]
    [InlineData("INCOME", 0)]
    [InlineData("INCOME", 1)]
    [InlineData("INCOME", 100)]
    [InlineData("EXPENSE", 0)]
    [InlineData("EXPENSE", 25)]
    public void Add_import_preserves_type_and_row_counts(string type, int rows)
    {
        var store = new OperationalStore();
        var batch = store.AddImport(type, "book.xlsx", rows, 7, Now);
        Assert.Equal(type, batch.ImportType);
        Assert.Equal(rows, batch.TotalRows);
        Assert.Equal(rows, batch.SuccessRows);
        Assert.Equal(0, batch.FailedRows);
        Assert.Equal("COMPLETED", batch.Status);
    }

    [Fact]
    public void Add_import_creates_correlated_audit_event()
    {
        var store = new OperationalStore();
        var batch = store.AddImport("INCOME", "book.xlsx", 3, 7, Now);
        var audit = Assert.Single(store.Audits);
        Assert.Equal("IMPORT", audit.Action);
        Assert.Equal(batch.ImportedBy, audit.ActorUserId);
        Assert.Contains("book.xlsx", audit.Detail);
    }

    [Fact]
    public void Import_and_attachment_ids_are_monotonic_per_resource()
    {
        var store = new OperationalStore();
        var first = store.AddImport("INCOME", "a.xlsx", 0, 1, Now);
        var second = store.AddImport("EXPENSE", "b.xlsx", 0, 1, Now);
        var a = store.AddAttachment(EntryKind.INCOME, 1, "a.pdf", "application/pdf", [1], 1, Now);
        var b = store.AddAttachment(EntryKind.INCOME, 1, "b.pdf", "application/pdf", [2], 1, Now);
        Assert.True(second.Id > first.Id);
        Assert.True(b.Id > a.Id);
    }

    [Theory]
    [InlineData(EntryKind.INCOME, "receipt.pdf", "application/pdf")]
    [InlineData(EntryKind.EXPENSE, "invoice.png", "image/png")]
    [InlineData(EntryKind.INCOME, "unicode-đơn-hàng.txt", "text/plain")]
    public void Attachment_metadata_and_content_are_preserved(
        EntryKind kind,
        string name,
        string mime
    )
    {
        var store = new OperationalStore();
        var item = store.AddAttachment(kind, 10, name, mime, [1, 2, 3], 5, Now);
        Assert.Equal(kind, item.Kind);
        Assert.Equal(name, item.OriginalName);
        Assert.Equal(mime, item.MimeType);
        Assert.Equal(3, item.FileSizeBytes);
        Assert.Equal([1, 2, 3], item.Content);
    }

    [Fact]
    public void Explicit_audits_receive_unique_ids_and_timestamp()
    {
        var store = new OperationalStore();
        store.Audit("LOGIN", "AUTH", "ok", 1, Now);
        store.Audit("EXPORT", "REPORT", "pdf", 1, Now.AddMinutes(1));
        Assert.Equal([1L, 2L], store.Audits.Select(x => x.Id));
        Assert.Equal(Now.AddMinutes(1), store.Audits[1].ChangedAt);
    }
}
