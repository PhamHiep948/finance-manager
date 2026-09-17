using HandmadeFinance.Infrastructure;
using Xunit;

namespace HandmadeFinance.Infrastructure.Tests;

public sealed class PasswordServiceTests
{
    private readonly PasswordService _service = new();

    [Fact] public void Hash_does_not_store_plain_text(){var hash=_service.Hash("secret");Assert.NotEqual("secret",hash);Assert.DoesNotContain("secret",hash);}
    [Fact] public void Verify_accepts_correct_password(){var hash=_service.Hash("secret");Assert.True(_service.Verify(hash,"secret"));}
    [Fact] public void Verify_rejects_wrong_password(){var hash=_service.Hash("secret");Assert.False(_service.Verify(hash,"wrong"));}
    [Fact] public void Same_password_uses_random_salts(){Assert.NotEqual(_service.Hash("secret"),_service.Hash("secret"));}
    [Theory]
    [InlineData("")]
    [InlineData("invalid")]
    [InlineData("a.b.c")]
    [InlineData("not-base64.not-base64")]
    public void Verify_rejects_malformed_hash_without_throwing(string hash){Assert.False(_service.Verify(hash,"secret"));}
}
