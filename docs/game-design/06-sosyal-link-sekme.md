# 06 — Sosyal Katman: Link, Sekme-Arası, Şerit Modu

Üç "vay be" özelliğimiz. Hepsi Aşama 4-5 işi; çekirdek döngü bitmeden başlanmaz.

## 1. Sekme-arası mahalleler (Aşama 4)

- Her hat/mahalle ayrı tarayıcı sekmesinde açılabilir.
- Dolmuş bir sekmenin sağ kenarından çıkıp diğerinin sol kenarından girer.
- Teknik: `BroadcastChannel` API (aynı origin'deki sekmeler arası mesajlaşma, sunucusuz).
  Bir sekme "dolmuş çıkıyor {id, yük, hız}" yayınlar; hedef sekme sahnesine spawn eder.
- Tek sekmede oynayan hiçbir şey kaybetmez: sekme kapalıysa o mahalle aynı pencerede
  bölge geçişiyle oynanır. Sekme özelliği ekstra "şov" katmanıdır, zorunluluk değil.
- İlk kez iki sekme yan yana konduğunda oyun bunu kutlar (öğretici an + paylaşılabilir video anı).

## 2. Şerit (taskbar) modu (Aşama 4)

- Tek tuşla oyun, ekranın altında ~120px yüksekliğinde yatay 3D yol şeridine dönüşür
  (pencere küçültme değil; aynı sekmede daralmış kamera + kompakt UI).
- Şeritte görünen: geçen dolmuşlar, para sayacı, olay rozetleri.
- Nadir tek-tık olaylar düşer ("kaçak yolcu!", "bahşiş yağmuru") → bakma sebebi yaratır ama
  spam yapmaz (15-30 dk'da bir).
- Amaç: oyun "kapatılan" değil "küçültülen" şey olsun; günlük aktif kullanım buradan gelir.

## 3. Link = Şehir, korsan sefer (Aşama 5 — uygulandı 2026-07-25)

- Her oyuncunun şehri kendi URL'inde: `/[kullaniciadi]` (backend'de benzersiz, `PUT /api/username/{playerId}`).
- **Asenkron** multiplayer — iki oyuncunun aynı anda çevrimiçi olması gerekmez, gerçek zamanlı
  sunucu yoktur (bkz. ADR-003). Ziyaretçi, host'un **son bilinen** (son kaydedilen) durumunu görür.
- Görsel olarak bilinçli sadeleştirme: ziyaretçi sayfası 3D değil, sade bir HTML kart
  (`VisitorCity.tsx`) — host'un canlı mahallesini göstermek gerçek zamanlı sunucu gerektirirdi.

### Ziyaretçi ne yapabilir? (uygulandı)
1. **Bahşiş bırak** (`POST /api/cities/{username}/tip`): host'a ₺5-₺25 arası rastgele bahşiş.
   Kendine bahşiş yasak, günde en fazla 3 (bkz. "Ekonomi anti-hile" altında — bedava para
   üretimini önlemek için).
2. **Korsan sefer 😈** (`POST /api/cities/{username}/raid`): host'un o anki parasının %5'i
   kadar (₺300 tavan) çalar. Günde en fazla 3/host, kendine yasak.
   - Host'un şehrinde iz kalır: yönetim panelindeki "Ziyaretçi Günlüğü" olayı gösterir +
     saldıranın kullanıcı adı biliniyorsa **misilleme** butonu (aynı `raid` uç noktasını
     ters yönde çağırır).
3. **İz bırakma** (duvar yazısı/korna): henüz yok, sonraki iterasyon.

### Savunma (uygulandı)
- "Denetim Noktası" (₺1500, `hasCheckpoint`): korsan seferci %50 ihtimalle yakalanır,
  yakalanırsa çaldığının **2 katını** host'a öder (kendi cebinden).

### Ekonomi anti-hile (yeni sorun + çözüm)
Ziyaretçi işlemleri host'un parasını **doğrudan sunucuda** değiştirir — ama host o an
oynuyorsa istemcisi bunu bilmez ve bir sonraki otomatik kayıtta eski (düşük) yerel parayı
yazıp ziyaretçi kazancını ezebilirdi. Çözüm: `AutoSave.tsx` her periyodik kayıttan önce
sunucudaki güncel parayı çekip, yerelden yüksekse farkı önce yerel state'e ekliyor
(`applyExternalGain`), sonra kaydediyor — bir toast ile de gösteriyor ("👋 Ziyaretçilerin
sana ₺X kazandı!").

## Bu üç özelliğin ortak ilkesi

Hepsi **çekirdek döngüye para/etkileşim geri besler**, hiçbiri onsuz oynamayı bozmaz.
Özellik "gösteriş için gösteriş" olursa kesilir.
