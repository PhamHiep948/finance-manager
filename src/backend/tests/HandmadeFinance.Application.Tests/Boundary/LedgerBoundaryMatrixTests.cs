using HandmadeFinance.Application.Abstractions.Persistence;
using HandmadeFinance.Application.Common;
using HandmadeFinance.Application.Ledger;
using Xunit;

namespace HandmadeFinance.Application.Tests.Boundary;

public sealed class LedgerBoundaryMatrixTests
{
    [Theory]
    [InlineData(0.01,0,0.01)] [InlineData(1,0,1)] [InlineData(10,5,10.50)] [InlineData(10.05,5,10.55)]
    [InlineData(99.99,10,109.99)] [InlineData(100,20,120)] [InlineData(123.45,8,133.33)] [InlineData(1000,100,2000)]
    [InlineData(999999.99,0,999999.99)] [InlineData(0.05,10,0.06)] [InlineData(0.10,5,0.11)] [InlineData(250.50,12.5,281.81)]
    public async Task Accepts_valid_monetary_and_tax_boundaries(double amount,double tax,double total)
    {
        var f=new Fixture();var result=await f.Service.CreateAsync(EntryKind.INCOME,Write((decimal)amount,(decimal)tax,(decimal)total),Admin,default);Assert.Equal((decimal)total,result.AmountAfterTax);
    }

    [Theory]
    [InlineData(-1,0,-1,"USD")] [InlineData(-0.01,10,-0.01,"USD")] [InlineData(10,-1,9.9,"USD")]
    [InlineData(10,100.01,20,"USD")] [InlineData(10,101,20.1,"USD")] [InlineData(10,10,10,"USD")]
    [InlineData(10,10,11.01,"USD")] [InlineData(10,0,10,"EUR")] [InlineData(10,0,10,"usd")]
    [InlineData(10,0,10,"")] [InlineData(0.01,100,0.01,"USD")] [InlineData(100,5,104.99,"USD")]
    public async Task Rejects_invalid_monetary_tax_or_currency_combinations(double amount,double tax,double total,string currency)
    {
        var f=new Fixture();var error=await Assert.ThrowsAsync<AppException>(()=>f.Service.CreateAsync(EntryKind.INCOME,Write((decimal)amount,(decimal)tax,(decimal)total,currency),Admin,default));Assert.Equal(400,error.Status);
    }

    [Theory]
    [InlineData(1,1)] [InlineData(1,20)] [InlineData(1,100)] [InlineData(2,1)] [InlineData(10,10)]
    [InlineData(100,100)] [InlineData(999,5)] [InlineData(2,99)] [InlineData(50,2)] [InlineData(3,33)]
    public async Task Accepts_valid_paging_boundaries(int page,int pageSize)
    {
        var f=new Fixture();var result=await f.Service.ListAsync(EntryKind.INCOME,new(Page:page,PageSize:pageSize),default);Assert.Equal(page,result.Page);Assert.Equal(pageSize,result.PageSize);
    }

    [Theory]
    [InlineData(-10,20)] [InlineData(-1,1)] [InlineData(0,1)] [InlineData(1,-1)] [InlineData(1,0)]
    [InlineData(1,101)] [InlineData(2,1000)] [InlineData(int.MaxValue,int.MaxValue)]
    public async Task Rejects_invalid_paging_boundaries(int page,int pageSize)
    {
        var f=new Fixture();await Assert.ThrowsAsync<AppException>(()=>f.Service.ListAsync(EntryKind.INCOME,new(Page:page,PageSize:pageSize),default));
    }

    [Theory]
    [InlineData("order")] [InlineData("ORDER")] [InlineData(" Order ")] [InlineData("custom")]
    [InlineData("tom order")] [InlineData("đơn hàng")] [InlineData("123")] [InlineData("-")]
    public async Task Search_supports_expected_text_variants(string search)
    {
        var f=new Fixture();await f.Add("Custom Order - đơn hàng 123");var result=await f.Service.ListAsync(EntryKind.INCOME,new(Search:search),default);Assert.Single(result.Items);
    }

    [Theory]
    [InlineData("2026-01-01","2026-01-01")] [InlineData("2025-12-31","2026-01-01")] [InlineData("2026-01-01","2026-12-31")]
    [InlineData("2020-01-01","2030-01-01")] [InlineData(null,"2026-01-01")] [InlineData("2026-01-01",null)] [InlineData(null,null)]
    public async Task Date_ranges_are_inclusive_and_optional(string? from,string? to)
    {
        var f=new Fixture();await f.Add("row",new(2026,1,1));var result=await f.Service.ListAsync(EntryKind.INCOME,new(DateFrom:Parse(from),DateTo:Parse(to)),default);Assert.Single(result.Items);
    }

    [Theory]
    [InlineData("2026-01-02","2026-01-01")] [InlineData("2027-01-01","2026-12-31")] [InlineData("9999-12-31","0001-01-01")]
    [InlineData("2026-02-01","2026-01-31")] [InlineData("2026-09-18","2026-09-17")] [InlineData("2025-01-02","2025-01-01")]
    public async Task Rejects_every_inverted_date_range(string from,string to)
    {
        var f=new Fixture();await Assert.ThrowsAsync<AppException>(()=>f.Service.ListAsync(EntryKind.INCOME,new(DateFrom:DateOnly.Parse(from),DateTo:DateOnly.Parse(to)),default));
    }

    [Theory]
    [InlineData(UserRole.ADMIN,true)] [InlineData(UserRole.SHOP_OWNER,true)] [InlineData(UserRole.EMPLOYEE,true)] [InlineData(UserRole.VIEWER,false)]
    public async Task Create_role_matrix_is_enforced(UserRole role,bool allowed)
    {
        var f=new Fixture();var action=()=>f.Service.CreateAsync(EntryKind.EXPENSE,Write(10,0,10),new Actor(5,role),default);if(allowed)Assert.NotNull(await action());else await Assert.ThrowsAsync<AppException>(action);
    }

    private static readonly Actor Admin=new(1,UserRole.ADMIN);
    private static LedgerWrite Write(decimal amount,decimal tax,decimal total,string currency="USD")=>new(new(2026,1,1),"row",1,amount,tax,total,currency);
    private static DateOnly? Parse(string? value)=>value is null?null:DateOnly.Parse(value);
    private sealed class Fixture
    {
        private readonly Repo repo=new();public LedgerService Service{get;}
        public Fixture()=>Service=new(repo,new Clock());
        public Task<LedgerEntry>Add(string description,DateOnly? date=null)=>Service.CreateAsync(EntryKind.INCOME,Write(10,0,10) with{Description=description,Date=date??new(2026,1,1)},Admin,default);
    }
    private sealed class Clock:IClock{public DateTimeOffset UtcNow=>new(2026,1,1,0,0,0,TimeSpan.Zero);}
    private sealed class Repo:ILedgerRepository
    {
        private readonly List<LedgerEntry> rows=[];public Task<LedgerEntry>AddAsync(LedgerEntry e,CancellationToken ct){e.Id=rows.Count+1;rows.Add(e);return Task.FromResult(e);}public Task<LedgerEntry?>GetAsync(EntryKind k,long id,CancellationToken ct)=>Task.FromResult(rows.SingleOrDefault(x=>x.Kind==k&&x.Id==id));public Task<IReadOnlyList<LedgerEntry>>ListAsync(EntryKind k,CancellationToken ct)=>Task.FromResult<IReadOnlyList<LedgerEntry>>(rows.Where(x=>x.Kind==k).ToList());public Task UpdateAsync(LedgerEntry e,CancellationToken ct)=>Task.CompletedTask;
    }
}
