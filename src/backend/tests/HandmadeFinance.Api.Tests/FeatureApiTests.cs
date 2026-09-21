using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using ClosedXML.Excel;
using Xunit;

namespace HandmadeFinance.Api.Tests;

/// <summary>Chi tiết khoản thu/chi, nhật ký hoạt động, import Excel, xuất báo cáo và phân quyền.</summary>
public sealed class FeatureApiTests(TestApiFactory factory) : IClassFixture<TestApiFactory>
{
    private const string Password = "ChangeMe123!";

    // ------------------------------------------------------------------ helpers
    private async Task<HttpClient> Login(string email, string password = Password)
    {
        var client = factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new { email, password });
        response.EnsureSuccessStatusCode();
        var json = await response.Content.ReadFromJsonAsync<JsonElement>();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(
            "Bearer",
            json.GetProperty("accessToken").GetString()
        );
        return client;
    }

    private Task<HttpClient> Admin() => Login("admin@handmade.local");

    private async Task<HttpClient> UserWithRole(string role)
    {
        var admin = await Admin();
        var email = $"{role.ToLowerInvariant()}-{Guid.NewGuid():N}@example.com";
        var created = await admin.PostAsJsonAsync(
            "/api/v1/users",
            new
            {
                username = email.Split('@')[0],
                email,
                password = Password,
                fullName = $"Test {role}",
                timezone = "Asia/Ho_Chi_Minh",
                role,
                isActive = true,
            }
        );
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        return await Login(email);
    }

    private static Dictionary<string, object?> Ledger(object? extra = null, string description = "Order") =>
        new Dictionary<string, object?>
        {
            ["date"] = "2026-09-17",
            ["description"] = description,
            ["categoryId"] = 1,
            ["amount"] = 100m,
            ["taxPercent"] = 10m,
            ["amountAfterTax"] = 110m,
            ["currencyCode"] = "USD",
        }.Merge(extra);

    private static MultipartFormDataContent Form(string type, string fileName, byte[] bytes)
    {
        var form = new MultipartFormDataContent { { new StringContent(type), "importType" } };
        form.Add(new ByteArrayContent(bytes), "file", fileName);
        return form;
    }

    private static async Task<JsonElement> Json(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>();

    private static async Task<JsonElement> AuditItems(HttpClient client, string query = "")
    {
        var response = await client.GetAsync($"/api/v1/audit-logs?pageSize=100{query}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return (await Json(response)).GetProperty("items");
    }

    private static bool HasAudit(JsonElement items, string action, string module, string contains) =>
        items.EnumerateArray().Any(x =>
            x.GetProperty("action").GetString() == action
            && x.GetProperty("module").GetString() == module
            && x.GetProperty("detail").GetString()!.Contains(contains, StringComparison.Ordinal)
        );

    // ------------------------------------------------------------ ledger details
    [Fact]
    public async Task Income_detail_fields_round_trip_through_create_get_and_update()
    {
        using var client = await Admin();
        var created = await client.PostAsJsonAsync(
            "/api/v1/incomes",
            Ledger(new { orderCode = "HF-2026-0001", saleRegion = "IN_EU", salesChannel = "ETSY_STORE", productQty = 3 })
        );
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var id = (await Json(created)).GetProperty("id").GetInt64();

        var fetched = await Json(await client.GetAsync($"/api/v1/incomes/{id}"));
        Assert.Equal("HF-2026-0001", fetched.GetProperty("orderCode").GetString());
        Assert.Equal("IN_EU", fetched.GetProperty("saleRegion").GetString());
        Assert.Equal("ETSY_STORE", fetched.GetProperty("salesChannel").GetString());
        Assert.Equal(3, fetched.GetProperty("productQty").GetInt32());

        var updated = await client.PutAsJsonAsync(
            $"/api/v1/incomes/{id}",
            Ledger(new { orderCode = "HF-2026-0002", saleRegion = "OUTSIDE_EU", salesChannel = "WEBSITE_DIRECT", productQty = 5 })
        );
        Assert.Equal(HttpStatusCode.OK, updated.StatusCode);
        var again = await Json(await client.GetAsync($"/api/v1/incomes/{id}"));
        Assert.Equal("HF-2026-0002", again.GetProperty("orderCode").GetString());
        Assert.Equal("OUTSIDE_EU", again.GetProperty("saleRegion").GetString());
        Assert.Equal(5, again.GetProperty("productQty").GetInt32());
    }

    [Fact]
    public async Task Expense_detail_fields_round_trip()
    {
        using var client = await Admin();
        var created = await client.PostAsJsonAsync(
            "/api/v1/expenses",
            Ledger(new { payee = "DHL Express", originScope = "INTERNATIONAL", paymentMethod = "PAYPAL", categoryId = 4 })
        );
        Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var row = await Json(created);
        Assert.Equal("DHL Express", row.GetProperty("payee").GetString());
        Assert.Equal("INTERNATIONAL", row.GetProperty("originScope").GetString());
        Assert.Equal("PAYPAL", row.GetProperty("paymentMethod").GetString());
    }

    [Theory]
    [InlineData("saleRegion", "MARS")]
    [InlineData("salesChannel", "TIKTOK")]
    [InlineData("originScope", "GALAXY")]
    [InlineData("paymentMethod", "BITCOIN")]
    public async Task Unknown_detail_enum_value_returns_400(string field, string value)
    {
        using var client = await Admin();
        var response = await client.PostAsJsonAsync(
            "/api/v1/incomes",
            Ledger(new Dictionary<string, object?> { [field] = value })
        );
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Non_positive_product_quantity_returns_400()
    {
        using var client = await Admin();
        var response = await client.PostAsJsonAsync("/api/v1/incomes", Ledger(new { productQty = 0 }));
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // -------------------------------------------------------------------- audit
    [Fact]
    public async Task Ledger_create_update_and_delete_are_audited()
    {
        using var client = await Admin();
        var marker = $"audit-{Guid.NewGuid():N}";
        var created = await client.PostAsJsonAsync("/api/v1/incomes", Ledger(description: marker));
        var id = (await Json(created)).GetProperty("id").GetInt64();
        await client.PutAsJsonAsync($"/api/v1/incomes/{id}", Ledger(description: marker + "-edited"));
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/v1/incomes/{id}")).StatusCode);

        var items = await AuditItems(client);
        Assert.True(HasAudit(items, "INSERT", "INCOME", marker));
        Assert.True(HasAudit(items, "UPDATE", "INCOME", marker + "-edited"));
        Assert.True(HasAudit(items, "DELETE", "INCOME", $"#{id}"));
    }

    [Fact]
    public async Task Expense_changes_are_audited_under_the_expense_module()
    {
        using var client = await Admin();
        var marker = $"exp-{Guid.NewGuid():N}";
        await client.PostAsJsonAsync("/api/v1/expenses", Ledger(description: marker));
        Assert.True(HasAudit(await AuditItems(client, "&module=EXPENSE"), "INSERT", "EXPENSE", marker));
    }

    [Fact]
    public async Task Login_and_logout_are_audited_with_the_actor_name()
    {
        using var client = await Admin();
        await client.PostAsync("/api/v1/auth/logout", null);
        var items = await AuditItems(client, "&module=AUTH");
        Assert.True(HasAudit(items, "LOGIN", "AUTH", "admin@handmade.local"));
        Assert.True(HasAudit(items, "LOGOUT", "AUTH", "signed out"));
        Assert.All(items.EnumerateArray(), x => Assert.False(string.IsNullOrEmpty(x.GetProperty("actorName").GetString())));
    }

    [Fact]
    public async Task User_management_and_profile_changes_are_audited()
    {
        using var admin = await Admin();
        var email = $"audited-{Guid.NewGuid():N}@example.com";
        var created = await admin.PostAsJsonAsync(
            "/api/v1/users",
            new { username = email.Split('@')[0], email, password = Password, fullName = "Audited", timezone = "UTC", role = "EMPLOYEE", isActive = true }
        );
        var id = (await Json(created)).GetProperty("id").GetInt64();
        await admin.PatchAsJsonAsync($"/api/v1/users/{id}/status", new { isActive = false });
        await admin.PutAsJsonAsync("/api/v1/profile", new { fullName = "Admin", phone = (string?)null, timezone = "UTC", avatarUrl = (string?)null });

        var items = await AuditItems(admin);
        Assert.True(HasAudit(items, "INSERT", "USER", email));
        Assert.True(HasAudit(items, "UPDATE", "USER", "Deactivated"));
        Assert.True(HasAudit(items, "UPDATE", "PROFILE", "profile"));
    }

    [Fact]
    public async Task Audit_can_be_filtered_by_action()
    {
        using var client = await Admin();
        await client.PostAsJsonAsync("/api/v1/incomes", Ledger());
        var items = await AuditItems(client, "&action=INSERT");
        Assert.NotEmpty(items.EnumerateArray());
        Assert.All(items.EnumerateArray(), x => Assert.Equal("INSERT", x.GetProperty("action").GetString()));
    }

    // ------------------------------------------------------------------- import
    [Fact]
    public async Task Import_preview_reports_valid_and_invalid_rows_without_saving()
    {
        using var client = await Admin();
        var bytes = TestWorkbooks.Income(
            ["2026-09-01", "Etsy order", "Bán hàng", "85.50", "USD", "ETS-1"],
            ["01/09/2026", "Second order", "Sales", "20", "", ""],
            ["not-a-date", "Broken", "Sales", "10", "USD", ""],
            ["2026-09-03", "Bad category", "Nope", "10", "USD", ""],
            ["2026-09-04", "Negative", "Sales", "-5", "USD", ""]
        );
        var before = await Json(await client.GetAsync("/api/v1/incomes?pageSize=1"));
        var preview = await Json(await client.PostAsync("/api/v1/imports/preview", Form("INCOME", "in.xlsx", bytes)));

        Assert.Equal(5, preview.GetProperty("totalRows").GetInt32());
        Assert.Equal(2, preview.GetProperty("validRows").GetInt32());
        Assert.Equal(3, preview.GetProperty("invalidRows").GetInt32());
        var rows = preview.GetProperty("rows").EnumerateArray().ToList();
        Assert.Equal("VALID", rows[0].GetProperty("status").GetString());
        Assert.Equal("Sales", rows[0].GetProperty("category").GetString());
        Assert.Equal("INVALID", rows[2].GetProperty("status").GetString());
        Assert.NotEmpty(rows[2].GetProperty("errors").EnumerateArray());

        var after = await Json(await client.GetAsync("/api/v1/incomes?pageSize=1"));
        Assert.Equal(before.GetProperty("totalItems").GetInt64(), after.GetProperty("totalItems").GetInt64());
    }

    [Fact]
    public async Task Import_creates_ledger_rows_and_records_success_and_failure_counts()
    {
        using var client = await Admin();
        var marker = Guid.NewGuid().ToString("N")[..8];
        var bytes = TestWorkbooks.Income(
            ["2026-09-01", $"Imported {marker} A", "Bán hàng", "85.50", "USD", "REF-A"],
            ["2026-09-02", $"Imported {marker} B", "Thu khác", "12", "USD", "REF-B"],
            ["2026-09-03", "Rejected row", "Unknown", "10", "USD", ""]
        );
        var response = await client.PostAsync("/api/v1/imports", Form("INCOME", "in.xlsx", bytes));
        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        var batch = await Json(response);
        Assert.Equal("COMPLETED", batch.GetProperty("status").GetString());
        Assert.Equal(3, batch.GetProperty("totalRows").GetInt32());
        Assert.Equal(2, batch.GetProperty("successRows").GetInt32());
        Assert.Equal(1, batch.GetProperty("failedRows").GetInt32());

        var list = await Json(await client.GetAsync($"/api/v1/incomes?search={marker}"));
        var items = list.GetProperty("items").EnumerateArray().ToList();
        Assert.Equal(2, items.Count);
        Assert.Contains(items, x => x.GetProperty("orderCode").GetString() == "REF-A" && x.GetProperty("amount").GetDecimal() == 85.50m);
        Assert.Contains(items, x => x.GetProperty("categoryId").GetInt64() == 2);
    }

    [Fact]
    public async Task Expense_import_maps_recipient_and_vietnamese_categories()
    {
        using var client = await Admin();
        var marker = Guid.NewGuid().ToString("N")[..8];
        var bytes = TestWorkbooks.Expense(["2026-09-05", $"Yarn {marker}", "Nguyên vật liệu", "180", "USD", "Yarn Shop"]);
        var batch = await Json(await client.PostAsync("/api/v1/imports", Form("EXPENSE", "out.xlsx", bytes)));
        Assert.Equal(1, batch.GetProperty("successRows").GetInt32());

        var item = (await Json(await client.GetAsync($"/api/v1/expenses?search={marker}"))).GetProperty("items")[0];
        Assert.Equal("Yarn Shop", item.GetProperty("payee").GetString());
        Assert.Equal(3, item.GetProperty("categoryId").GetInt64());
    }

    [Fact]
    public async Task Import_with_only_invalid_rows_is_marked_failed_and_creates_nothing()
    {
        using var client = await Admin();
        var bytes = TestWorkbooks.Income(["bad", "", "Nope", "x", "EUR", ""]);
        var batch = await Json(await client.PostAsync("/api/v1/imports", Form("INCOME", "bad.xlsx", bytes)));
        Assert.Equal("FAILED", batch.GetProperty("status").GetString());
        Assert.Equal(0, batch.GetProperty("successRows").GetInt32());
        Assert.Equal(1, batch.GetProperty("failedRows").GetInt32());
    }

    [Fact]
    public async Task Import_writes_an_audit_record()
    {
        using var client = await Admin();
        var bytes = TestWorkbooks.Income(["2026-09-01", "Audit import", "Sales", "10", "USD", ""]);
        await client.PostAsync("/api/v1/imports", Form("INCOME", "audit.xlsx", bytes));
        Assert.True(HasAudit(await AuditItems(client, "&action=IMPORT"), "IMPORT", "IMPORT", "1/1 rows from audit.xlsx"));
    }

    [Theory]
    [InlineData("corrupt")]
    [InlineData("notxlsx")]
    public async Task Import_rejects_files_that_are_not_real_workbooks(string kind)
    {
        using var client = await Admin();
        var bytes = kind == "corrupt" ? [1, 2, 3, 4] : System.Text.Encoding.UTF8.GetBytes("a,b,c\n1,2,3");
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync("/api/v1/imports/preview", Form("INCOME", "x.xlsx", bytes))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync("/api/v1/imports", Form("INCOME", "x.xlsx", bytes))).StatusCode);
    }

    [Fact]
    public async Task Import_rejects_workbooks_missing_required_columns_or_data()
    {
        using var client = await Admin();
        var noAmount = TestWorkbooks.Build(["Ngày thu", "Nội dung", "Loại thu"], ["2026-09-01", "x", "Sales"]);
        var headerOnly = TestWorkbooks.Build(TestWorkbooks.IncomeHeader);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync("/api/v1/imports/preview", Form("INCOME", "a.xlsx", noAmount))).StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync("/api/v1/imports/preview", Form("INCOME", "b.xlsx", headerOnly))).StatusCode);
    }

    [Fact]
    public async Task Legacy_xls_extension_is_rejected()
    {
        using var client = await Admin();
        var bytes = TestWorkbooks.Income(["2026-09-01", "x", "Sales", "10", "USD", ""]);
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsync("/api/v1/imports/preview", Form("INCOME", "old.xls", bytes))).StatusCode);
    }

    // ------------------------------------------------------------------- export
    [Fact]
    public async Task Xlsx_export_is_a_real_workbook_with_matching_totals()
    {
        using var client = await Admin();
        var marker = Guid.NewGuid().ToString("N")[..8];
        await client.PostAsJsonAsync("/api/v1/incomes", Ledger(description: $"Export {marker}", extra: new { date = "2030-01-15" }));
        await client.PostAsJsonAsync("/api/v1/expenses", Ledger(description: $"Cost {marker}", extra: new { date = "2030-01-16", categoryId = 3, taxPercent = 0m, amountAfterTax = 100m }));

        var response = await client.GetAsync("/api/v1/reports/export?format=XLSX&dateFrom=2030-01-01&dateTo=2030-01-31");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var workbook = new XLWorkbook(new MemoryStream(await response.Content.ReadAsByteArrayAsync()));
        Assert.Equal(["Tổng quan", "Khoản thu", "Khoản chi"], workbook.Worksheets.Select(w => w.Name).ToArray());
        var overview = workbook.Worksheet("Tổng quan");
        Assert.Equal(110m, overview.Cell(5, 2).GetValue<decimal>());
        Assert.Equal(100m, overview.Cell(6, 2).GetValue<decimal>());
        Assert.Equal(10m, overview.Cell(7, 2).GetValue<decimal>());
        Assert.Equal($"Export {marker}", workbook.Worksheet("Khoản thu").Cell(2, 2).GetString());
        Assert.Equal("Sales", workbook.Worksheet("Khoản thu").Cell(2, 3).GetString());
        Assert.Equal("Raw Materials", workbook.Worksheet("Khoản chi").Cell(2, 3).GetString());
    }

    [Fact]
    public async Task Pdf_export_is_a_structurally_valid_pdf()
    {
        if (!PdfFontAvailable())
            return; // Máy không có font TrueType hệ thống (đặt REPORT_FONT_PATH để chạy bài này).
        using var client = await Admin();
        var response = await client.GetAsync("/api/v1/reports/export?format=PDF");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("application/pdf", response.Content.Headers.ContentType!.MediaType);
        var bytes = await response.Content.ReadAsByteArrayAsync();
        Assert.True(bytes.Length > 1000);
        Assert.Equal("%PDF-", System.Text.Encoding.ASCII.GetString(bytes, 0, 5));
        Assert.Contains("%%EOF", System.Text.Encoding.ASCII.GetString(bytes, bytes.Length - 16, 16));
    }

    private static bool PdfFontAvailable() =>
        new[]
        {
            Environment.GetEnvironmentVariable("REPORT_FONT_PATH"),
            @"C:\Windows\Fonts\arial.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
            "/Library/Fonts/Arial.ttf",
            "/System/Library/Fonts/Supplemental/Arial.ttf",
        }.Any(p => !string.IsNullOrWhiteSpace(p) && File.Exists(p));

    // ------------------------------------------------------------- permissions
    [Fact]
    public async Task Viewer_can_read_and_export_but_cannot_write_or_import()
    {
        using var viewer = await UserWithRole("VIEWER");
        Assert.Equal(HttpStatusCode.OK, (await viewer.GetAsync("/api/v1/incomes")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await viewer.GetAsync("/api/v1/reports")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await viewer.GetAsync("/api/v1/reports/export?format=XLSX")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await viewer.PostAsJsonAsync("/api/v1/incomes", Ledger())).StatusCode);
        var bytes = TestWorkbooks.Income(["2026-09-01", "x", "Sales", "10", "USD", ""]);
        Assert.Equal(HttpStatusCode.Forbidden, (await viewer.PostAsync("/api/v1/imports", Form("INCOME", "a.xlsx", bytes))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await viewer.GetAsync("/api/v1/audit-logs")).StatusCode);
    }

    [Fact]
    public async Task Employee_can_write_and_import_but_cannot_view_reports_audit_or_users()
    {
        using var employee = await UserWithRole("EMPLOYEE");
        Assert.Equal(HttpStatusCode.Created, (await employee.PostAsJsonAsync("/api/v1/incomes", Ledger())).StatusCode);
        var bytes = TestWorkbooks.Income(["2026-09-01", "x", "Sales", "10", "USD", ""]);
        Assert.Equal(HttpStatusCode.Accepted, (await employee.PostAsync("/api/v1/imports", Form("INCOME", "a.xlsx", bytes))).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await employee.GetAsync("/api/v1/reports")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await employee.GetAsync("/api/v1/reports/export?format=PDF")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await employee.GetAsync("/api/v1/audit-logs")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await employee.GetAsync("/api/v1/users")).StatusCode);
    }

    [Fact]
    public async Task Shop_owner_can_view_audit_and_reports_but_not_manage_users()
    {
        using var owner = await UserWithRole("SHOP_OWNER");
        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync("/api/v1/audit-logs")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync("/api/v1/reports")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await owner.GetAsync("/api/v1/imports")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await owner.GetAsync("/api/v1/users")).StatusCode);
    }

    [Fact]
    public async Task Only_owner_and_admin_can_delete_ledger_rows()
    {
        using var admin = await Admin();
        using var employee = await UserWithRole("EMPLOYEE");
        var created = await employee.PostAsJsonAsync("/api/v1/incomes", Ledger());
        var id = (await Json(created)).GetProperty("id").GetInt64();
        Assert.Equal(HttpStatusCode.Forbidden, (await employee.DeleteAsync($"/api/v1/incomes/{id}")).StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, (await admin.DeleteAsync($"/api/v1/incomes/{id}")).StatusCode);
    }
}

internal static class DictionaryExtensions
{
    /// <summary>Gộp các thuộc tính của một object ẩn danh (hoặc dictionary) vào dictionary gốc.</summary>
    public static Dictionary<string, object?> Merge(this Dictionary<string, object?> target, object? extra)
    {
        if (extra is null)
            return target;
        if (extra is IDictionary<string, object?> dictionary)
        {
            foreach (var (k, v) in dictionary)
                target[k] = v;
            return target;
        }
        foreach (var property in extra.GetType().GetProperties())
            target[char.ToLowerInvariant(property.Name[0]) + property.Name[1..]] = property.GetValue(extra);
        return target;
    }
}
