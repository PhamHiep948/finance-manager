using HandmadeFinance.Application.Categories;
using HandmadeFinance.Application.Ledger;
using HandmadeFinance.Application.Users;
using Microsoft.EntityFrameworkCore;

namespace HandmadeFinance.Infrastructure.Persistence;

public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<UserAccount> Users => Set<UserAccount>();
    public DbSet<LedgerEntry> LedgerEntries => Set<LedgerEntry>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<ImportBatchEntity> ImportBatches => Set<ImportBatchEntity>();
    public DbSet<AttachmentEntity> Attachments => Set<AttachmentEntity>();
    public DbSet<AuditLogEntity> AuditLogs => Set<AuditLogEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("shop_finance");
        ConfigureUsers(modelBuilder.Entity<UserAccount>());
        ConfigureLedger(modelBuilder.Entity<LedgerEntry>());
        ConfigureCategories(modelBuilder.Entity<Category>());
        ConfigureOperations(modelBuilder);
    }

    private static void ConfigureUsers(Microsoft.EntityFrameworkCore.Metadata.Builders.EntityTypeBuilder<UserAccount> b)
    {
        b.ToTable("app_users");
        b.HasKey(x => x.Id);
        b.Property(x => x.Username).HasMaxLength(100).IsRequired();
        b.Property(x => x.Email).HasMaxLength(255).IsRequired();
        b.Property(x => x.PasswordHash).IsRequired();
        b.Property(x => x.FullName).HasMaxLength(255).IsRequired();
        b.Property(x => x.Phone).HasMaxLength(30);
        b.Property(x => x.AvatarUrl).HasColumnName("avatar_url");
        b.Property(x => x.Timezone).HasMaxLength(64).IsRequired();
        b.Property(x => x.LastLoginAt).HasColumnName("last_login_at");
        b.Property(x => x.Role).HasConversion<string>().HasMaxLength(32);
        b.HasIndex(x => x.Username).IsUnique();
        b.HasIndex(x => x.Email).IsUnique();
    }

    private static void ConfigureLedger(Microsoft.EntityFrameworkCore.Metadata.Builders.EntityTypeBuilder<LedgerEntry> b)
    {
        b.ToTable("ledger_entries", t =>
        {
            t.HasCheckConstraint("ck_ledger_amount", "amount > 0");
            t.HasCheckConstraint("ck_ledger_tax", "tax_percent >= 0 AND tax_percent <= 100");
            t.HasCheckConstraint("ck_ledger_currency", "currency_code = 'USD'");
        });
        b.HasKey(x => x.Id);
        b.Property(x => x.Kind).HasConversion<string>().HasMaxLength(16);
        b.Property(x => x.Description).HasMaxLength(500).IsRequired();
        b.Property(x => x.Amount).HasPrecision(18, 2);
        b.Property(x => x.TaxPercent).HasPrecision(6, 2);
        b.Property(x => x.AmountAfterTax).HasPrecision(18, 2);
        b.Property(x => x.CurrencyCode).HasMaxLength(3);
        b.HasIndex(x => new { x.Kind, x.Date, x.Id });
        b.HasIndex(x => new { x.CategoryId, x.Date });
        b.Property<uint>("Version").IsRowVersion();
    }

    private static void ConfigureCategories(Microsoft.EntityFrameworkCore.Metadata.Builders.EntityTypeBuilder<Category> b)
    {
        b.ToTable("categories");
        b.HasKey(x => x.Id);
        b.Property(x => x.Kind).HasConversion<string>().HasMaxLength(16);
        b.Property(x => x.Name).HasMaxLength(150).IsRequired();
        b.HasIndex(x => new { x.Kind, x.Name }).IsUnique();
    }

    private static void ConfigureOperations(ModelBuilder modelBuilder)
    {
        var imports = modelBuilder.Entity<ImportBatchEntity>();
        imports.ToTable("import_batches"); imports.HasKey(x => x.Id);
        imports.Property(x => x.ImportType).HasMaxLength(16); imports.Property(x => x.Status).HasMaxLength(32);
        var attachments = modelBuilder.Entity<AttachmentEntity>();
        attachments.ToTable("attachments"); attachments.HasKey(x => x.Id);
        attachments.Property(x => x.StorageKey).HasMaxLength(200).IsRequired();
        attachments.HasIndex(x => new { x.Kind, x.EntryId });
        var audits = modelBuilder.Entity<AuditLogEntity>();
        audits.ToTable("audit_logs"); audits.HasKey(x => x.Id);
        audits.HasIndex(x => new { x.EntityType, x.EntityId, x.ChangedAt });
        audits.HasIndex(x => new { x.ActorUserId, x.ChangedAt });
    }
}

public sealed class ImportBatchEntity
{
    public long Id { get; set; }
    public string ImportType { get; set; } = "";
    public string OriginalFileName { get; set; } = "";
    public string Status { get; set; } = "PENDING";
    public int TotalRows { get; set; }
    public int SuccessRows { get; set; }
    public int FailedRows { get; set; }
    public long? ImportedBy { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public string? ErrorDetails { get; set; }
}

public sealed class AttachmentEntity
{
    public long Id { get; set; }
    public Application.Common.EntryKind Kind { get; set; }
    public long EntryId { get; set; }
    public string OriginalName { get; set; } = "";
    public string StorageKey { get; set; } = "";
    public string? MimeType { get; set; }
    public long FileSizeBytes { get; set; }
    public long? UploadedBy { get; set; }
    public DateTimeOffset UploadedAt { get; set; }
}

public sealed class AuditLogEntity
{
    public long Id { get; set; }
    public long? ActorUserId { get; set; }
    public string Action { get; set; } = "";
    public string EntityType { get; set; } = "";
    public long? EntityId { get; set; }
    public DateTimeOffset ChangedAt { get; set; }
    public string? Metadata { get; set; }
}
