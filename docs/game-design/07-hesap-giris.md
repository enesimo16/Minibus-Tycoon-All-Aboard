# 07 — Hesap ve Giriş

## Felsefe

Kullanıcıyı **login akışına boğmamak**. Tek ekran, tek form: kullanıcı adı + şifre.
Ayrı bir "Kayıt Ol" / "Giriş Yap" sekmesi yok — backend kullanıcı adını tanımıyorsa
otomatik hesap açar, tanıyorsa şifreyi doğrular. Kullanıcı için tek adım.

## Akış

1. Oyuncu ilk açılışta `LoginGate.tsx` ile karşılaşır: kullanıcı adı + şifre alanı.
2. `POST /api/auth/login { username, password }`:
   - Kullanıcı adı **yoksa**: yeni hesap açılır (yeni `playerId`, şifre hashlenip kaydedilir),
     `isNewAccount: true` döner.
   - Kullanıcı adı **varsa**: şifre doğrulanır; doğruysa mevcut hesaba giriş, yanlışsa hata.
3. Dönen `playerId` tarayıcıda `localStorage`'a yazılır — bir sonraki açılışta login
   tekrar sorulmaz (oturum kalıcı, bkz. `LoginGate.tsx`'teki `getPlayerId() !== null` kontrolü).
4. Kullanıcı adı artık **hesap açılışında** belirlendiği için Aşama 5'teki ayrı "kullanıcı adı
   claim et" akışı kaldırıldı — her hesabın zaten bir linki (`/{kullaniciadi}`) var.

## Güvenlik

- Şifreler **asla düz metin** tutulmaz — PBKDF2 (100.000 iterasyon, SHA256, rastgele salt),
  bkz. backend `PasswordHasher.cs`. Ekstra NuGet paketi gerekmez (.NET yerleşik kütüphane).
  Karşılaştırma sabit zamanlı (`CryptographicOperations.FixedTimeEquals`) — zamanlama saldırısı
  riskini azaltır.
- Kullanıcı adı kuralı: 3-20 karakter, sadece küçük harf/rakam/alt çizgi (aynı normalize
  mantığı `/[username]` linkleriyle paylaşılır).
- Şifre kuralı: en az 4 karakter — bilinçli olarak gevşek (basitlik önceliği), karmaşık kural
  dayatılmıyor.

## Oturum kapatma

- Profil panelindeki **Çıkış yap** düğmesi önce `POST /api/auth/logout/{playerId}` çağrısıyla
  sunucudaki aktif token'ı iptal etmeyi dener.
- Sunucu geçici olarak erişilemiyorsa oyuncu cihazda kilitli kalmaz; yerel `playerId`, auth token ve
  kullanıcı adı önbelleği her durumda temizlenir ve giriş ekranına dönülür.
- Logout, aynı hesaptaki diğer cihazların bağımsız oturumlarını kapatmaz.

## Kapsam dışı (MVP'de yok)

- Şifre sıfırlama / e-posta doğrulama — hesap kaybı riski kabul edilmiş bir borç (kullanıcı
  sayısı arttıkça eklenir).
- Oturum süresi ve refresh-token rotasyonu — mevcut token kullanıcı çıkış yapana veya yeniden giriş
  yaparak yenisini üretene kadar geçerlidir.
- Aynı hesaba birden fazla cihazdan giriş kısıtı yok (istenen davranış zaten bu — aynı hesaba
  farklı cihazdan girip devam edebilmek).

## İlerideki bağlantı: misafir ekonomisi

Kullanıcı girişi artık zorunlu olduğu için "link'ten gelen misafir parasız gelir, borç/kiralık
dolmuş alabilir" mekaniği (bkz. `06-sosyal-link-sekme.md`) artık **gerçek bir hesaba** bağlanabilir
— misafirin kendi kalıcı hesabı üzerinden borç takibi yapılabilir. Bu, sonraki iterasyonun konusu.
