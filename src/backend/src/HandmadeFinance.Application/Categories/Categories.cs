using HandmadeFinance.Application.Common;

namespace HandmadeFinance.Application.Categories;

public sealed class Category
{
    public long Id { get; set; }
    public EntryKind Kind { get; set; }
    public string Name { get; set; } = "";
    public bool IsActive { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }
}

public interface ICategoryRepository
{
    Task<IReadOnlyList<Category>> ListActiveAsync(EntryKind kind, CancellationToken ct);
    Task<bool> ExistsAsync(long id, EntryKind kind, CancellationToken ct);
}

public sealed class CategoryService(ICategoryRepository categories)
{
    public Task<IReadOnlyList<Category>> ListAsync(EntryKind kind, CancellationToken ct) =>
        categories.ListActiveAsync(kind, ct);
}
