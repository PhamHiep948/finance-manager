using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Ledger;
using HandmadeFinance.Infrastructure;
using Xunit;

namespace HandmadeFinance.Infrastructure.Tests;

public sealed class InMemoryStoreTests
{
    [Fact] public async Task Seeded_admin_can_be_found_case_insensitively(){var store=Create();var user=await store.FindByEmailAsync("ADMIN@HANDMADE.LOCAL",default);Assert.NotNull(user);Assert.Equal(UserRole.ADMIN,user.Role);}
    [Fact] public async Task Ledger_ids_are_generated_and_kinds_are_isolated(){var store=Create();var now=DateTimeOffset.UtcNow;var income=await store.AddAsync(new LedgerEntry{Kind=EntryKind.INCOME,CreatedAt=now},default);var expense=await store.AddAsync(new LedgerEntry{Kind=EntryKind.EXPENSE,CreatedAt=now},default);Assert.NotEqual(income.Id,expense.Id);Assert.Single(await store.ListAsync(EntryKind.INCOME,default));}
    [Fact] public async Task Duplicate_lookup_is_case_insensitive_and_honors_excluded_id(){var store=Create();Assert.True(await store.UsernameOrEmailExistsAsync("ADMIN","unused@example.com",null,default));Assert.False(await store.UsernameOrEmailExistsAsync("ADMIN","admin@handmade.local",1,default));}
    private static InMemoryStore Create(){var passwords=new PasswordService();return new(passwords,new FixedClock());}
    private sealed class FixedClock:IClock{public DateTimeOffset UtcNow=>new(2026,9,17,0,0,0,TimeSpan.Zero);}
}
