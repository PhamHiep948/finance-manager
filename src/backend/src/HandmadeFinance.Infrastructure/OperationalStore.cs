using HandmadeFinance.Application.Common;

namespace HandmadeFinance.Infrastructure;

public sealed record ImportBatchRecord(
    long Id,
    string ImportType,
    string OriginalFileName,
    string Status,
    int TotalRows,
    int SuccessRows,
    int FailedRows,
    long ImportedBy,
    DateTimeOffset CreatedAt,
    DateTimeOffset? CompletedAt,
    object? ErrorDetails = null
);

public sealed record AttachmentRecord(
    long Id,
    EntryKind Kind,
    long EntryId,
    string OriginalName,
    string? MimeType,
    long FileSizeBytes,
    long UploadedBy,
    DateTimeOffset UploadedAt,
    byte[] Content
);

public sealed record AuditRecord(
    long Id,
    string Action,
    string Module,
    string Detail,
    long ActorUserId,
    DateTimeOffset ChangedAt
);

public sealed class OperationalStore
{
    private long _importId;
    private long _attachmentId;
    private long _auditId;
    public List<ImportBatchRecord> Imports { get; } = [];
    public List<AttachmentRecord> Attachments { get; } = [];
    public List<AuditRecord> Audits { get; } = [];

    public ImportBatchRecord AddImport(
        string type,
        string name,
        int rows,
        long actor,
        DateTimeOffset now
    )
    {
        var item = new ImportBatchRecord(
            ++_importId,
            type,
            name,
            "COMPLETED",
            rows,
            rows,
            0,
            actor,
            now,
            now
        );
        Imports.Add(item);
        Audit("IMPORT", "IMPORT", $"Imported {rows} rows from {name}", actor, now);
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
            ++_attachmentId,
            kind,
            entryId,
            name,
            mime,
            content.LongLength,
            actor,
            now,
            content
        );
        Attachments.Add(item);
        return item;
    }

    public void Audit(
        string action,
        string module,
        string detail,
        long actor,
        DateTimeOffset now
    ) => Audits.Add(new(++_auditId, action, module, detail, actor, now));
}
