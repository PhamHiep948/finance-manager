using HandmadeFinance.Application.Common;

namespace HandmadeFinance.Application.Operations;

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

public interface IOperationalStore
{
    IReadOnlyList<ImportBatchRecord> Imports { get; }
    IReadOnlyList<AttachmentRecord> Attachments { get; }
    IReadOnlyList<AuditRecord> Audits { get; }

    ImportBatchRecord AddImport(string type, string name, int rows, long actor, DateTimeOffset now);
    AttachmentRecord AddAttachment(
        EntryKind kind,
        long entryId,
        string name,
        string? mime,
        byte[] content,
        long actor,
        DateTimeOffset now
    );
    ImportBatchRecord? FindImport(long id);
    AttachmentRecord? FindAttachment(long id);
    bool RemoveAttachment(long id);
    void Audit(string action, string module, string detail, long actor, DateTimeOffset now);
}
