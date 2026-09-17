using HandmadeFinance.Application.Abstractions.Persistence; using HandmadeFinance.Application.Common; using HandmadeFinance.Application.Ledger; using Xunit;
namespace HandmadeFinance.Application.Tests.Ledger;
public sealed class LedgerServiceTests
{
    private readonly FakeRepository _repo=new(); private readonly FakeClock _clock=new(); private LedgerService Service=>new(_repo,_clock); private static LedgerWrite Valid=>new(new DateOnly(2026,9,17),"Order",1,100m,10m,110m);
    [Fact]public async Task Viewer_cannot_create(){var ex=await Assert.ThrowsAsync<AppException>(()=>Service.CreateAsync(EntryKind.INCOME,Valid,new(1,UserRole.VIEWER),default));Assert.Equal(403,ex.Status);}
    [Fact]public async Task Employee_can_create_and_owns_record(){var row=await Service.CreateAsync(EntryKind.INCOME,Valid,new(7,UserRole.EMPLOYEE),default);Assert.Equal(7,row.CreatedBy);Assert.Equal("USD",row.CurrencyCode);}
    [Fact]public async Task Employee_cannot_update_another_users_record(){var row=await Service.CreateAsync(EntryKind.INCOME,Valid,new(7,UserRole.EMPLOYEE),default);var ex=await Assert.ThrowsAsync<AppException>(()=>Service.UpdateAsync(EntryKind.INCOME,row.Id,Valid,new(8,UserRole.EMPLOYEE),default));Assert.Equal(403,ex.Status);}
    [Fact]public async Task Employee_can_update_own_record(){var row=await Service.CreateAsync(EntryKind.INCOME,Valid,new(7,UserRole.EMPLOYEE),default);var changed=await Service.UpdateAsync(EntryKind.INCOME,row.Id,Valid with{Description="Changed"},new(7,UserRole.EMPLOYEE),default);Assert.Equal("Changed",changed.Description);}
    [Fact]public async Task Employee_cannot_delete(){var row=await Service.CreateAsync(EntryKind.EXPENSE,Valid,new(7,UserRole.EMPLOYEE),default);await Assert.ThrowsAsync<AppException>(()=>Service.DeleteAsync(EntryKind.EXPENSE,row.Id,new(7,UserRole.EMPLOYEE),default));}
    [Fact]public async Task Soft_deleted_record_is_not_listed_or_returned(){var row=await Service.CreateAsync(EntryKind.INCOME,Valid,new(1,UserRole.ADMIN),default);await Service.DeleteAsync(EntryKind.INCOME,row.Id,new(1,UserRole.ADMIN),default);var page=await Service.ListAsync(EntryKind.INCOME,new(),default);Assert.Empty(page.Items);await Assert.ThrowsAsync<AppException>(()=>Service.GetAsync(EntryKind.INCOME,row.Id,default));}
    [Fact]public async Task Rejects_inconsistent_tax_total(){var bad=Valid with{AmountAfterTax=109};var ex=await Assert.ThrowsAsync<AppException>(()=>Service.CreateAsync(EntryKind.INCOME,bad,new(1,UserRole.ADMIN),default));Assert.Equal(400,ex.Status);}
    [Fact]public async Task Rejects_invalid_date_range(){await Assert.ThrowsAsync<AppException>(()=>Service.ListAsync(EntryKind.INCOME,new(DateFrom:new(2026,2,2),DateTo:new(2026,1,1)),default));}
    [Theory]
    [InlineData(UserRole.ADMIN)]
    [InlineData(UserRole.SHOP_OWNER)]
    [InlineData(UserRole.EMPLOYEE)]
    public async Task Write_roles_can_create(UserRole role){var row=await Service.CreateAsync(EntryKind.EXPENSE,Valid,new(3,role),default);Assert.Equal(EntryKind.EXPENSE,row.Kind);}
    [Theory]
    [InlineData(UserRole.ADMIN)]
    [InlineData(UserRole.SHOP_OWNER)]
    public async Task Privileged_roles_can_update_another_users_record(UserRole role){var row=await Service.CreateAsync(EntryKind.INCOME,Valid,new(7,UserRole.EMPLOYEE),default);var result=await Service.UpdateAsync(EntryKind.INCOME,row.Id,Valid with{Description=" privileged "},new(2,role),default);Assert.Equal("privileged",result.Description);Assert.Equal(2,result.UpdatedBy);}
    [Theory]
    [InlineData(UserRole.ADMIN)]
    [InlineData(UserRole.SHOP_OWNER)]
    public async Task Privileged_roles_can_soft_delete_and_record_actor(UserRole role){var row=await Service.CreateAsync(EntryKind.INCOME,Valid,new(7,UserRole.EMPLOYEE),default);await Service.DeleteAsync(EntryKind.INCOME,row.Id,new(2,role),default);Assert.Equal(2,row.DeletedBy);Assert.Equal(_clock.UtcNow,row.DeletedAt);}
    [Fact]public async Task Get_missing_record_returns_not_found(){var error=await Assert.ThrowsAsync<AppException>(()=>Service.GetAsync(EntryKind.INCOME,99,default));Assert.Equal(404,error.Status);Assert.Equal("NOT_FOUND",error.Code);}
    [Fact]public async Task Entry_kind_isolated_in_queries(){await Service.CreateAsync(EntryKind.INCOME,Valid,new(1,UserRole.ADMIN),default);await Service.CreateAsync(EntryKind.EXPENSE,Valid,new(1,UserRole.ADMIN),default);var incomes=await Service.ListAsync(EntryKind.INCOME,new(),default);Assert.Single(incomes.Items);Assert.All(incomes.Items,x=>Assert.Equal(EntryKind.INCOME,x.Kind));}
    [Fact]public async Task Search_is_trimmed_and_case_insensitive(){await Service.CreateAsync(EntryKind.INCOME,Valid with{Description="Custom ORDER"},new(1,UserRole.ADMIN),default);await Service.CreateAsync(EntryKind.INCOME,Valid with{Description="Other"},new(1,UserRole.ADMIN),default);var page=await Service.ListAsync(EntryKind.INCOME,new(Search:" order "),default);Assert.Single(page.Items);}
    [Fact]public async Task Date_filters_are_inclusive(){await Service.CreateAsync(EntryKind.INCOME,Valid with{Date=new(2026,1,1)},new(1,UserRole.ADMIN),default);await Service.CreateAsync(EntryKind.INCOME,Valid with{Date=new(2026,1,2)},new(1,UserRole.ADMIN),default);await Service.CreateAsync(EntryKind.INCOME,Valid with{Date=new(2026,1,3)},new(1,UserRole.ADMIN),default);var page=await Service.ListAsync(EntryKind.INCOME,new(DateFrom:new(2026,1,2),DateTo:new(2026,1,2)),default);Assert.Single(page.Items);Assert.Equal(new DateOnly(2026,1,2),page.Items[0].Date);}
    [Fact]public async Task Paging_returns_metadata_and_stable_descending_order(){for(var day=1;day<=5;day++)await Service.CreateAsync(EntryKind.INCOME,Valid with{Date=new(2026,1,day)},new(1,UserRole.ADMIN),default);var page=await Service.ListAsync(EntryKind.INCOME,new(Page:2,PageSize:2),default);Assert.Equal(5,page.TotalItems);Assert.Equal(3,page.TotalPages);Assert.Equal([3,2],page.Items.Select(x=>x.Date.Day));}
    [Theory]
    [InlineData(0,20)]
    [InlineData(1,0)]
    [InlineData(1,101)]
    public async Task Rejects_invalid_paging(int page,int pageSize){var error=await Assert.ThrowsAsync<AppException>(()=>Service.ListAsync(EntryKind.INCOME,new(Page:page,PageSize:pageSize),default));Assert.Equal(400,error.Status);}
    [Theory]
    [MemberData(nameof(InvalidWrites))]
    public async Task Rejects_invalid_write_values(LedgerWrite write){var error=await Assert.ThrowsAsync<AppException>(()=>Service.CreateAsync(EntryKind.INCOME,write,new(1,UserRole.ADMIN),default));Assert.Equal(400,error.Status);}
    public static IEnumerable<object[]> InvalidWrites(){yield return [Valid with{Description=" "}];yield return [Valid with{CategoryId=0}];yield return [Valid with{Amount=-1,AmountAfterTax=-1.1m}];yield return [Valid with{TaxPercent=-1}];yield return [Valid with{TaxPercent=101}];yield return [Valid with{CurrencyCode="EUR"}];}
    [Fact]public async Task Create_trims_description_and_sets_audit_timestamps(){var row=await Service.CreateAsync(EntryKind.INCOME,Valid with{Description="  Order  "},new(7,UserRole.EMPLOYEE),default);Assert.Equal("Order",row.Description);Assert.Equal(_clock.UtcNow,row.CreatedAt);Assert.Equal(_clock.UtcNow,row.UpdatedAt);}
    [Fact]public async Task Tax_calculation_uses_two_decimal_away_from_zero_rounding(){var request=Valid with{Amount=10.05m,TaxPercent=5m,AmountAfterTax=10.55m};var row=await Service.CreateAsync(EntryKind.INCOME,request,new(1,UserRole.ADMIN),default);Assert.Equal(10.55m,row.AmountAfterTax);}
    private sealed class FakeClock:IClock{public DateTimeOffset UtcNow=>new(2026,9,17,0,0,0,TimeSpan.Zero);}
    private sealed class FakeRepository:ILedgerRepository{private readonly List<LedgerEntry> rows=[];public Task<LedgerEntry>AddAsync(LedgerEntry e,CancellationToken _){e.Id=rows.Count+1;rows.Add(e);return Task.FromResult(e);}public Task<LedgerEntry?>GetAsync(EntryKind k,long id,CancellationToken _)=>Task.FromResult(rows.SingleOrDefault(x=>x.Kind==k&&x.Id==id));public Task<IReadOnlyList<LedgerEntry>>ListAsync(EntryKind k,CancellationToken _)=>Task.FromResult<IReadOnlyList<LedgerEntry>>(rows.Where(x=>x.Kind==k).ToList());public Task UpdateAsync(LedgerEntry e,CancellationToken _)=>Task.CompletedTask;}
}
