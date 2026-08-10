namespace FullFilled.Api.Models;

// Sosyal: tek yonlu arkadas listesi kaydi. Karsilikli onay yok — liste sahibi (PlayerId)
// istedigi sehri ekler/cikarir, eklenen oyuncunun (FriendPlayerId) onayi gerekmez.
public class Friendship
{
    public int Id { get; set; }
    public string PlayerId { get; set; } = string.Empty;       // owner of the list
    public string FriendPlayerId { get; set; } = string.Empty; // the added player
    public DateTime CreatedAtUtc { get; set; }
}
