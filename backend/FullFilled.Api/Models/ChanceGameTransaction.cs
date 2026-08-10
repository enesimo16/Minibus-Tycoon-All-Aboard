namespace FullFilled.Api.Models;

public class ChanceGameTransaction
{
    public string Id { get; set; } = "";
    public string PlayerId { get; set; } = "";
    public string ClientRequestId { get; set; } = "";
    public string GameId { get; set; } = "";
    public string RequestHash { get; set; } = "";
    public string ResponseJson { get; set; } = "";
    public DateTime CreatedAtUtc { get; set; }
}
