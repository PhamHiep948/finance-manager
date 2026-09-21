using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Operations;

namespace HandmadeFinance.Infrastructure;

public sealed class OperationalStore : IOperationalStore
{
    private readonly object _gate = new();
    private long _importId;
    private long _attachmentId;
    private long _auditId;
    private readonly List<ImportBatchRecord> _imports = [];
    private readonly List<AttachmentRecord> _attachments = [];
    private readonly List<AuditRecord> _audits = [];

    public IReadOnlyList<ImportBatchRecord> Imports
    {
        get { lock (_gate) return _imports.ToList(); }
    }

    public IReadOnlyList<AttachmentRecord> Attachments
    {
        get { lock (_gate) return _attachments.ToList(); }
    }

    public IReadOnlyList<AuditRecord> Audits
    {
        get { lock (_gate) return _audits.ToList(); }
    }

    public ImportBatchRecord AddImport(
        string type,
        string name,
        int rows,
        long actor,
        DateTimeOffset now
    ) => AddImport(type, name, rows, rows, 0, null, actor, now);

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
        var item = new ImportBatchRecord(
            Interlocked.Increment(ref _importId),
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
        lock (_gate)
            _imports.Add(item);
        Audit("IMPORT", "IMPORT", $"Imported {success}/{total} rows from {name}", actor, now);
        return item;
    }

    public AttachmentRecord AddAttachment(
        EntryKind kind,
        long entryId,
        string name,
        string? mime,
        byte[] content,
        long actor,
        DateTimeOffset now
    )
    {
        var item = new AttachmentRecord(
            Interlocked.Increment(ref _attachmentId),
            kind,
            entryId,
            name,
            mime,
            content.LongLength,
            actor,
            now,
            content
        );
        lock (_gate)
            _attachments.Add(item);
        return item;
    }

    public ImportBatchRecord? FindImport(long id)
    {
        lock (_gate)
            return _imports.SingleOrDefault(x => x.Id == id);
    }

    public AttachmentRecord? FindAttachment(long id)
    {
        lock (_gate)
            return _attachments.SingleOrDefault(x => x.Id == id);
    }

    public bool RemoveAttachment(long id)
    {
        lock (_gate)
            return _attachments.RemoveAll(x => x.Id == id) > 0;
    }

    public void Audit(
        string action,
        string module,
        string detail,
        long actor,
        DateTimeOffset now
    )
    {
        var item = new AuditRecord(
            Interlocked.Increment(ref _auditId), action, module, detail, actor, now
        );
        lock (_gate)
            _audits.Add(item);
    }
}
