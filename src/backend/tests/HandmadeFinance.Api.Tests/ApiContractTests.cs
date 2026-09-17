using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace HandmadeFinance.Api.Tests;

public sealed class ApiContractTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    public ApiContractTests(WebApplicationFactory<Program> factory) => _factory = factory;

    [Fact]
    public async Task Health_is_public_and_healthy()
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("healthy", (await response.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("status").GetString());
    }

    [Theory]
    [InlineData("/api/v1/dashboard")]
    [InlineData("/api/v1/categories/income")]
    [InlineData("/api/v1/incomes")]
    [InlineData("/api/v1/expenses")]
    [InlineData("/api/v1/reports")]
    [InlineData("/api/v1/users")]
    [InlineData("/api/v1/profile")]
    [InlineData("/api/v1/imports")]
    [InlineData("/api/v1/audit-logs")]
    [InlineData("/api/v1/reports/export?format=PDF")]
    public async Task Protected_get_endpoints_reject_anonymous_requests(string path)
    {
        using var client = _factory.CreateClient();
        var response = await client.GetAsync(path);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Login_returns_bearer_token_and_never_returns_password()
    {
        using var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new { email="admin@handmade.local", password="ChangeMe123!" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body).RootElement;
        Assert.Equal("Bearer", json.GetProperty("tokenType").GetString());
        Assert.False(string.IsNullOrWhiteSpace(json.GetProperty("accessToken").GetString()));
        Assert.DoesNotContain("password", body, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Invalid_login_returns_safe_problem_details()
    {
        using var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new { email="missing@example.com", password="wrong" });
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        var body = await response.Content.ReadAsStringAsync();
        var json = JsonDocument.Parse(body).RootElement;
        Assert.Equal("INVALID_CREDENTIALS", json.GetProperty("errorCode").GetString());
        Assert.True(json.TryGetProperty("traceId", out _));
        Assert.DoesNotContain("missing@example.com", body);
    }

    [Fact]
    public async Task Authenticated_user_can_logout_with_no_body()
    {
        using var client = await AuthenticatedClient();
        var response = await client.PostAsync("/api/v1/auth/logout", null);
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.Empty(await response.Content.ReadAsByteArrayAsync());
    }

    [Fact]
    public async Task Create_income_returns_201_and_location()
    {
        using var client = await AuthenticatedClient();
        var response = await client.PostAsJsonAsync("/api/v1/incomes", ValidLedger());
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(response.Headers.Location);
        Assert.StartsWith("/api/v1/incomes/", response.Headers.Location!.AbsolutePath);
    }

    [Fact]
    public async Task Invalid_income_returns_validation_problem()
    {
        using var client = await AuthenticatedClient();
        var response = await client.PostAsJsonAsync("/api/v1/incomes", ValidLedger() with { AmountAfterTax=999m });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Soft_deleted_income_is_not_found_after_delete()
    {
        using var client = await AuthenticatedClient();
        var created = await client.PostAsJsonAsync("/api/v1/incomes", ValidLedger());
        var location = created.Headers.Location!;
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync(location)).StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, (await client.GetAsync(location)).StatusCode);
    }

    [Fact]
    public async Task Invalid_query_binding_returns_400()
    {
        using var client = await AuthenticatedClient();
        var response = await client.GetAsync("/api/v1/incomes?page=not-a-number");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Dashboard_rejects_inverted_date_range_as_problem_details()
    {
        using var client = await AuthenticatedClient();
        var response = await client.GetAsync("/api/v1/dashboard?dateFrom=2026-09-18&dateTo=2026-09-17");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
    }

    [Theory]
    [InlineData("PDF","application/pdf","%PDF")]
    [InlineData("XLSX","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","PK")]
    public async Task Report_export_returns_documented_binary_format(string format,string mediaType,string signature)
    {
        using var client=await AuthenticatedClient();
        var response=await client.GetAsync($"/api/v1/reports/export?format={format}");
        Assert.Equal(HttpStatusCode.OK,response.StatusCode);
        Assert.Equal(mediaType,response.Content.Headers.ContentType?.MediaType);
        Assert.StartsWith(signature,System.Text.Encoding.ASCII.GetString((await response.Content.ReadAsByteArrayAsync())[..4]));
        Assert.NotNull(response.Content.Headers.ContentDisposition?.FileName);
    }

    [Fact]
    public async Task Report_export_rejects_unknown_format()
    {
        using var client=await AuthenticatedClient();
        Assert.Equal(HttpStatusCode.BadRequest,(await client.GetAsync("/api/v1/reports/export?format=CSV")).StatusCode);
    }

    [Fact]
    public async Task Import_preview_validates_extension_and_does_not_create_history()
    {
        using var client=await AuthenticatedClient();
        using var invalid=Upload("data.csv",[1,2,3]);
        Assert.Equal(HttpStatusCode.BadRequest,(await client.PostAsync("/api/v1/imports/preview",invalid)).StatusCode);
        using var valid=Upload("data.xlsx",[1,2,3]);
        Assert.Equal(HttpStatusCode.OK,(await client.PostAsync("/api/v1/imports/preview",valid)).StatusCode);
    }

    [Fact]
    public async Task Import_create_returns_202_and_can_be_read_from_history()
    {
        using var client=await AuthenticatedClient();using var form=Upload("data.xlsx",[1,2,3]);
        var response=await client.PostAsync("/api/v1/imports",form);Assert.Equal(HttpStatusCode.Accepted,response.StatusCode);
        var batch=await response.Content.ReadFromJsonAsync<JsonElement>();var id=batch.GetProperty("id").GetInt64();
        Assert.Equal(HttpStatusCode.OK,(await client.GetAsync($"/api/v1/imports/{id}")).StatusCode);
        var history=await client.GetFromJsonAsync<JsonElement>("/api/v1/imports");Assert.True(history.GetProperty("meta").GetProperty("totalItems").GetInt32()>=1);
    }

    [Fact]
    public async Task Attachment_upload_and_delete_flow_succeeds()
    {
        using var client=await AuthenticatedClient();var created=await client.PostAsJsonAsync("/api/v1/incomes",ValidLedger());var entry=await created.Content.ReadFromJsonAsync<JsonElement>();var id=entry.GetProperty("id").GetInt64();
        using var form=new MultipartFormDataContent();form.Add(new ByteArrayContent([1,2,3]),"file","receipt.pdf");
        var uploaded=await client.PostAsync($"/api/v1/incomes/{id}/attachments",form);Assert.Equal(HttpStatusCode.Created,uploaded.StatusCode);
        var attachment=await uploaded.Content.ReadFromJsonAsync<JsonElement>();Assert.Equal(HttpStatusCode.NoContent,(await client.DeleteAsync($"/api/v1/attachments/{attachment.GetProperty("id").GetInt64()}")).StatusCode);
    }

    [Fact]
    public async Task Attachment_rejects_missing_parent_and_empty_file()
    {
        using var client=await AuthenticatedClient();using var form=new MultipartFormDataContent();form.Add(new ByteArrayContent([1]),"file","receipt.pdf");
        Assert.Equal(HttpStatusCode.NotFound,(await client.PostAsync("/api/v1/incomes/999999/attachments",form)).StatusCode);
    }

    [Fact]
    public async Task Export_creates_filterable_audit_record()
    {
        using var client=await AuthenticatedClient();await client.GetAsync("/api/v1/reports/export?format=PDF");
        var response=await client.GetFromJsonAsync<JsonElement>("/api/v1/audit-logs?action=EXPORT&module=REPORT");
        Assert.True(response.GetProperty("meta").GetProperty("totalItems").GetInt32()>=1);
    }

    [Theory]
    [InlineData("CSV")] [InlineData("TXT")] [InlineData("JSON")] [InlineData("")] [InlineData("pdfx")]
    public async Task Report_export_rejects_every_unsupported_format(string format)
    {
        using var client=await AuthenticatedClient();var response=await client.GetAsync($"/api/v1/reports/export?format={Uri.EscapeDataString(format)}");Assert.Equal(HttpStatusCode.BadRequest,response.StatusCode);
    }

    [Theory]
    [InlineData("2026-01-02","2026-01-01")] [InlineData("2027-01-01","2026-12-31")] [InlineData("9999-12-31","0001-01-01")]
    public async Task Report_export_rejects_inverted_ranges(string from,string to)
    {
        using var client=await AuthenticatedClient();var response=await client.GetAsync($"/api/v1/reports/export?format=PDF&dateFrom={from}&dateTo={to}");Assert.Equal(HttpStatusCode.BadRequest,response.StatusCode);
    }

    [Theory]
    [InlineData("data.csv")] [InlineData("data.txt")] [InlineData("data.pdf")] [InlineData("data.json")] [InlineData("data")]
    public async Task Import_preview_rejects_non_excel_extensions(string fileName)
    {
        using var client=await AuthenticatedClient();using var form=Upload(fileName,[1]);Assert.Equal(HttpStatusCode.BadRequest,(await client.PostAsync("/api/v1/imports/preview",form)).StatusCode);
    }

    [Theory]
    [InlineData("OTHER")] [InlineData("REPORT")] [InlineData("USER")] [InlineData("")]
    public async Task Import_preview_rejects_unknown_import_types(string importType)
    {
        using var client=await AuthenticatedClient();using var form=Upload("data.xlsx",[1],importType);Assert.Equal(HttpStatusCode.BadRequest,(await client.PostAsync("/api/v1/imports/preview",form)).StatusCode);
    }

    [Theory]
    [InlineData(0,20)] [InlineData(-1,20)] [InlineData(1,0)] [InlineData(1,-1)] [InlineData(1,101)]
    public async Task Import_history_rejects_invalid_paging(int page,int pageSize)
    {
        using var client=await AuthenticatedClient();Assert.Equal(HttpStatusCode.BadRequest,(await client.GetAsync($"/api/v1/imports?page={page}&pageSize={pageSize}")).StatusCode);
    }

    [Fact]
    public async Task Import_detail_returns_404_for_missing_batch()
    {
        using var client=await AuthenticatedClient();Assert.Equal(HttpStatusCode.NotFound,(await client.GetAsync("/api/v1/imports/9223372036854775807")).StatusCode);
    }

    [Fact]
    public async Task Import_preview_rejects_empty_excel_file()
    {
        using var client=await AuthenticatedClient();using var form=Upload("empty.xlsx",[]);Assert.Equal(HttpStatusCode.BadRequest,(await client.PostAsync("/api/v1/imports/preview",form)).StatusCode);
    }

    [Theory]
    [InlineData(0,20)] [InlineData(-1,20)] [InlineData(1,0)] [InlineData(1,101)]
    public async Task Audit_rejects_invalid_paging(int page,int pageSize)
    {
        using var client=await AuthenticatedClient();Assert.Equal(HttpStatusCode.BadRequest,(await client.GetAsync($"/api/v1/audit-logs?page={page}&pageSize={pageSize}")).StatusCode);
    }

    [Theory]
    [InlineData("2026-01-02","2026-01-01")] [InlineData("2026-09-18","2026-09-17")]
    public async Task Audit_rejects_inverted_date_range(string from,string to)
    {
        using var client=await AuthenticatedClient();Assert.Equal(HttpStatusCode.BadRequest,(await client.GetAsync($"/api/v1/audit-logs?dateFrom={from}&dateTo={to}")).StatusCode);
    }

    [Fact]
    public async Task Attachment_delete_returns_404_for_missing_id()
    {
        using var client=await AuthenticatedClient();Assert.Equal(HttpStatusCode.NotFound,(await client.DeleteAsync("/api/v1/attachments/9223372036854775807")).StatusCode);
    }

    [Fact]
    public async Task Tampered_token_is_rejected()
    {
        using var client=await AuthenticatedClient();var token=client.DefaultRequestHeaders.Authorization!.Parameter!;client.DefaultRequestHeaders.Authorization=new AuthenticationHeaderValue("Bearer",token[..^1]+(token[^1]=='A'?'B':'A'));Assert.Equal(HttpStatusCode.Unauthorized,(await client.GetAsync("/api/v1/profile")).StatusCode);
    }

    [Theory]
    [InlineData("")] [InlineData("abc")] [InlineData("a.b")] [InlineData("not-a-token")]
    public async Task Malformed_bearer_tokens_are_rejected(string token)
    {
        using var client=_factory.CreateClient();client.DefaultRequestHeaders.TryAddWithoutValidation("Authorization",$"Bearer {token}");Assert.Equal(HttpStatusCode.Unauthorized,(await client.GetAsync("/api/v1/profile")).StatusCode);
    }

    private async Task<HttpClient> AuthenticatedClient()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new { email="admin@handmade.local", password="ChangeMe123!" });
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", json.GetProperty("accessToken").GetString());
        return client;
    }

    private static LedgerBody ValidLedger() => new("2026-09-17", "Order", 1, 100m, 10m, 110m, "USD");
    private static MultipartFormDataContent Upload(string name,byte[] content,string importType="INCOME"){var form=new MultipartFormDataContent();form.Add(new StringContent(importType),"importType");form.Add(new ByteArrayContent(content),"file",name);return form;}
    private sealed record LedgerBody(string Date,string Description,long CategoryId,decimal Amount,decimal TaxPercent,decimal AmountAfterTax,string CurrencyCode);
}
