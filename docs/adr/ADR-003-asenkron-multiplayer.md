# ADR-003: Multiplayer Asenkron Olacak (Gerçek Zamanlı Sunucu Yok)

**Durum:** Kabul edildi (2026-07-25)

## Bağlam
"Link = şehir" ve korsan sefer özellikleri çok oyunculu his istiyor; ama gerçek zamanlı
multiplayer (senkronizasyon, lag, oda yönetimi) acemi ekibin en çok battığı alan.

## Karar
Tüm sosyal etkileşim **asenkron**dur:
- Ziyaretçi, ev sahibinin şehrinin **son snapshot'ını** backend'den çeker ve kendi
  tarayıcısında oynatır (ev sahibi çevrimdışı olabilir).
- Ziyaretçinin eylemleri (bahşiş, korsan sefer, iz) backend'e **olay** olarak yazılır.
- Ev sahibi bir sonraki girişinde olay kutusunu görür; sonuçlar o an uygulanır.
- Aynı anda iki kişi aynı şehirdeyse birbirini GÖRMEZ (v1'de). Çakışan olaylar sunucu
  tarafında sıraya alınır; limitler (günde 3 korsan sefer/şehir) sunucuda uygulanır.

## Gerekçe
- WebSocket/SignalR altyapısı, state senkronu ve ölçekleme derdi sıfırlanır.
- Wordle/Clash-tarzı "sıra bende" psikolojisi, tatlı itişme için yeterli.
- İleride gerçek zamanlı "aynı şehirde görüşme" istenirse ayrı ADR ile eklenir; bu karar
  onu engellemez (olay modeli aynen kalır).

## Sonuçlar
- Korsan sefer sonucu, ev sahibinin GÜNCEL durumuna değil snapshot'a göre hesaplanır;
  fark sunucu limitleriyle sınırlandığından adil kalır.
- Kötüye kullanım limitleri (rate limit, günlük tavanlar) sunucuda zorunludur, client'a güvenilmez.
