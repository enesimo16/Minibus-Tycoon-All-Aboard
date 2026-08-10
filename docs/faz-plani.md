# Minibus Tycoon — Core Rebuild Faz Planı

> Kanonik proje bağlamı `codex.md` dosyasındadır. Bu dosya ürün geliştirme sırasının tek kaynağıdır;
> ikinci bir plan dosyası açılmaz.
>
> Son güncelleme: 2026-08-06 · Durum: **Faz 0-1 tamam; Faz 2 fiyat/amortisman + backend sağlamlaştırma
> yapıldı (denge simülatörü + dashboard ekonomi ekranı bekliyor); Faz 3 (gün/not sistemi), Faz 4
> (kontrat motoru), Faz 5 (şoför 2.0), Faz 6 (hat 2.0 dikey dilim), Faz 7 (canlı şehir event
> yönetmeni), Faz 8 (parçalı/bağlamsal tutorial) ve Faz 9 (şans oyunları 2.0) yapıldı;
> deploy sertleştirmesi (CORS config, rate limit, /health, WAL) yapıldı — bkz. README
> "Production dağıtımı"**

## Tamamlanmış teknik temel

- TR/EN altyapısı, ortak toast sistemi ve telemetri taşıma hattı
- WASD/mobil sürüş, hız limitörü, kapı ve durak servisi
- Yolcu kararları, risk/polis ve gün/gece döngüsü
- Çoklu hat, beş araçlık garaj ve araç bazlı yükseltmeler
- 16 şoför portresi, vardiya atamaları ve pasif gelir
- Terminal tesisleri, şans oyunları ve temel şehir ziyareti
- Backend kayıt, token tabanlı auth, ekonomi doğrulama ve autosave
- Ehliyet puanı/risk/araç kilidi sunucuda kalıcıdır (DB migration 9); yenilemeyle sıfırlanmaz
- Admin analitik paneli canlı oyun durumu ve 30 günlük kritik olay özetini gösterir
- 21 adımlık TR/EN tutorial havuzu

Bu altyapı korunur; aşağıdaki fazlar oyunun core döngüsünü yeniden kurar.

## Ürün hedefi

> Tek minibüsle başlayan oyuncu şirketini kurar; vardiyalar yönetir, şoför ve hatlarında ustalaşır,
> şehir olaylarına cevap verir ve kararlarının şirketi ile mahalleyi değiştirdiğini görür.

```text
Şirket planı → kontrat/hat/araç seçimi → vardiya → canlı şehir olayları ve yolcu kararları
→ gün sonu notu + XP + para + itibar → level/yetenek → araç/şoför/hat yatırımı
→ daha zor kontrat ve hikâye → tekrar
```

## Bağlayıcı tasarım kuralları

1. Level tek başına anahtar değildir. Kilitler `level + başarı + ekonomik koşul` birleşimiyle açılır.
2. Her 5–10 dakikada anlamlı karar veya görünür ilerleme bulunur.
3. Her satın almanın tahmini geri ödeme süresi oyuncuya gösterilir.
4. Oyuncu XP'si yalnız sunucunun doğruladığı gün notu, kontrat ve ilk başarıdan gelir.
5. Para, oyuncu XP'si, şirket itibarı, hat ustalığı ve şoför XP'si ayrı ilerleme eksenleridir.
6. Rastgele olay oyuncuyu nedensiz cezalandırmaz; ön sinyal ve en az bir karşı hamle sunar.
7. Şans oyunları ana ilerleme kapısı değildir ve level/ustalık koşulunu atlatamaz.
8. Ekonomi değerleri yalnız `shared/economy.json` içinden gelir ve backend doğrular.
9. Yeni metinler TR/EN birlikte çıkar.
10. Her faz telemetri ve dashboard görünümü olmadan bitmiş sayılmaz.

## Faz özeti

| Faz | Sistem | Ana çıktı |
|---:|---|---|
| 0 | Veri modeli, logout, telemetri, denge laboratuvarı | Ölçülebilir ve güvenli temel |
| 1 | Şirket kurma + oyuncu level sistemi | Kalıcı oyuncu kimliği ve unlock omurgası |
| 2 | Ekonomi 2.0 | Mantıklı fiyatlar ve kesintisiz ilerleme |
| 3 | Gerçek vardiya/gün + not sistemi | Tekrar oynanabilir ana oturum |
| 4 | Kontrat motoru | Günlük görevlerin yerine içerik sistemi |
| 5 | Şoför 2.0 | Karakter tabanlı filo yönetimi |
| 6 | Hat 2.0 | Global kimlik, özellik, hikâye ve mastery |
| 7 | Canlı şehir event yönetmeni | Her oturumda değişen koşullar |
| 8 | Parçalı tutorial/FTUE | Bağlama göre öğreten onboarding |
| 9 | Şans oyunları 2.0 | Ana oyuna bağlı yan sistem |
| 10 | Mahalle karakterleri | 3B maliyeti kontrollü, hafızalı yolcular |
| 11 | Başarılar, rozetler, uzun vade | Koleksiyon ve ustalık |
| 12 | Sosyal sistem | Core oturduktan sonra arkadaş meta oyunu |

---

## Faz 0 — Veri modeli, logout, telemetri ve denge laboratuvarı

### İşler

- [x] Profil logout düğmesi ve backend token iptali.
- [x] Backend erişilemese bile yerel oturumu temizleyen logout fallback'i.
- [x] `GameSave` şema sürümü ve geriye uyumlu migrasyon sistemi.
- [x] Yeni tablolar: `Companies`, `PlayerProgression`, `PlayerAchievements`, `GameSessions`,
      `GameplayEvents`, `ContractRuns`, `ShiftResults`.
- [x] Her oturuma benzersiz `sessionId`, istemci build'i, cihaz sınıfı, dil, level ve şirket kimliği.
- [x] Funnel olayları: `account_created`, `company_created`, `tutorial_step`, `first_drive`,
      `first_stop_completed`, `first_upgrade`, `first_contract_started/completed`,
      `first_driver_hired`, `first_bus_bought`, `first_route_unlocked`, `session_started/ended`.
- [x] Ekonomi olayları: `currency_earned/spent`, kaynak, miktar, bakiye, item ve level.
- [x] Dashboard v1: DAU/WAU/MAU, D1/D7/D30, oturum süreleri, tutorial ve ilk vardiya funnel'ı,
      level dağılımı, para kaynak/gider grafiği, hata ve FPS dağılımı.
- [x] Hassas veri kuralı: şifre/token analitiğe girmez; ham IP tutulmaz; oyuncu detay ekranı admin korumalıdır.

### Uygulama notu

- Veritabanı sürümü `SchemaMigrations` tablosunda tutulur; Faz 0 sonunda sürüm `3`'tür.
- Eski `TelemetryEvents` kayıtları idempotent anahtarla `GameplayEvents` tablosuna geriye uyumlu taşınır.
- Olay kimliği oyuncu bazında benzersizdir. Aynı batch tekrar gelirse ikinci kayıt yazılmaz.
- `ContractRuns` ve `ShiftResults` oyuncu + idempotency anahtarıyla korunur; Faz 3/4 ödülleri bu kayıtlar
  üzerinden tek transaction içinde uygulanacaktır.
- Admin dashboard yolu `/admin/analytics`; veri API'si `X-FullFilled-Admin` anahtarı olmadan yanıt vermez.
- Telemetri JSON'u sunucuda ayrıştırılır; parola, token, authorization, cookie, secret ve IP alanları
  kayıttan önce bütün iç içe seviyelerde çıkarılır.
- Geriye uyumluluk testi gerçek eski save'in kopyasında, idempotency testi temiz veritabanında geçti.

### Bitiş kriteri

- İlk girişten çıkışa kritik funnel dashboard'da izlenir.
- Aynı sonuç tekrar gönderilirse para/XP iki kez yazılmaz; idempotency anahtarı vardır.
- Logout güncel ve önceki backend sürümünde oyuncuyu giriş ekranına döndürür.

---

## Faz 1 — Şirket kurma ve oyuncu level sistemi

### Yeni hesap akışı

1. Hesap oluşur.
2. Şirket adı seçilir; backend uzunluk, karakter ve uygunsuz içerik doğrulaması yapar.
3. Hazır amblem ile iki şirket rengi seçilir; ilk sürümde özel görsel yükleme yoktur.
4. Kalıcı sınıf olmayan başlangıç yaklaşımı seçilir:
   - **Hizmet:** memnuniyet ve sadık yolcu.
   - **Operasyon:** zamanlama, bakım ve güvenlik.
   - **Büyüme:** kontrat ve filo ekonomisi.
5. Üç ücretsiz başlangıç minibüsünden biri seçilir.
6. İlk sürüş tutorialı başlar.

### Level ve XP

- İlk sürüm maksimum level: 30.
- XP kaynakları: gün/vardiya notu, kontratlar, ilk kilometre taşları, hikâye ve tek seferlik başarılar.
- XP vermeyenler: şans oyunu kazancı, yalnız offline para, AFK süre, tekrarlı UI tıklaması.
- Eğri ilk 5 level hızlı, 6–15 düzenli, 16+ ustalık odaklıdır.
- Formül/tablo `shared/economy.json > progression` altında tutulur; XP backend tarafından hesaplanır.

### İlk unlock hipotezi

| Level | Açılan | Ek koşul |
|---:|---|---|
| 1 | Şirket, başlangıç aracı ve hat | Şirket kurulumu |
| 2 | Motor/koltuk ilk seviyeleri | İlk vardiyayı bitir |
| 3 | İlk şoför + temel kontratlar | En az B notu |
| 4 | Akşam vardiyası | İki kontrat |
| 5 | Kiralama/ikinci el pazarı | Başlangıç aracında toplam üç upgrade |
| 6 | Şoför eğitimi | Bir vardiya ataması |
| 7 | İlk terminal tesisleri | Şirket itibarı eşiği |
| 8 | İkinci araç ruhsatı | Üç A veya üzeri gün |
| 10 | İkinci hat lisansı | Araç + şoför + rota kontratı |
| 12 | Hava/event kontratları | İki hatta mastery 2 |
| 15 | Premium araç sınıfı | Filo değeri + güvenlik itibarı |
| 20 | Uzman/gece kontratları | Bir yetenek dalını tamamla |

“Yeni araç için bütün upgrade'ler level 2” yerine toplam gelişim ve başarı koşulu kullanılır.
Her upgrade'i zorunlu tutmak tek doğru build yaratır ve oyuncu özgürlüğünü azaltır.

### Şirket yetenekleri

- **Hizmet ağacı:** sadık yolcu, bahşiş, şikâyet toleransı, durak servisi.
- **Operasyon ağacı:** bakım, yakıt, vardiya yorgunluğu, rota hazırlığı.
- **Büyüme ağacı:** kontrat seçeneği, filo kapasitesi, tesis amortismanı, işe alım.
- Belirli level'larda yetenek puanı gelir; yanlış seçim hesabı bozmasın diye yeniden dağıtım mümkündür.

### Bitiş kriteri

- [x] Yeni hesap şirket kurmadan oyuna geçmez.
- [x] Level/XP sunucuda hesaplanır ve eski hesaplar güvenle migrate edilir.
- [x] Level atlama ekranı açılan içerikleri ve sonraki hedefi açıkça gösterir.

### Uygulama kaydı — 2026-08-02

- Dört adımlı, mobil uyumlu ve TR/EN şirket kurma akışı; ad, hazır amblem, renk, yaklaşım ve üç ücretsiz başlangıç aracı seçimi tamamlandı.
- Şirket adı normalleştirme, benzersizlik, karakter, uzunluk, renk ve seçim doğrulamaları backend otoritesine alındı.
- `shared/economy.json > progression` altında 30 seviyelik XP eğrisi, kilometre taşı ödülleri, yetenek puanı seviyeleri ve içerik kilitleri tek kaynağa bağlandı.
- İlk sürüş, ilk durak, ilk yükseltme, ilk şoför, ilk araç ve ilk hat ödülleri achievement kaydıyla idempotent hale getirildi; tekrar olay XP vermez.
- Upgrade, şoför, terminal, hat ve araç kilitleri hem istemci aksiyon kapısında açıklamalı bildirimle hem save endpoint'inde zorunlu doğrulanır.
- Profilde şirket kimliği, XP ilerlemesi, itibar, altı şirket yeteneği ve ücretsiz yeniden dağıtım; üst HUD'da sabit seviye göstergesi eklendi.
- Yeni seviyede açılan içerikleri gösteren, sunucuda onaylanan level-up paneli eklendi.
- Veritabanı sürümü 4'e çıktı; temiz veritabanı ve Faz 0 veritabanı kopyası üzerinde migrasyon doğrulandı.
- Şirket yetenekleri bu fazda güvenli state/UX omurgasıdır; sayısal ekonomi etkileri Faz 2 denge simülasyonundan sonra açılacaktır.

---

## Faz 2 — Ekonomi 2.0

### Denge yöntemi

```text
Fiyat = hedef net gelir/dakika × hedef biriktirme süresi × risk/konfor katsayısı
Amortisman vardiyası = fiyat / yatırımın vardiya başına net ek geliri
```

### İlk tempo hedefleri

| Kilometre taşı | Hedef aktif süre |
|---|---:|
| İlk anlamlı upgrade | 5–7 dk |
| İkinci upgrade/ekipman seçimi | 12–15 dk |
| İlk şoför | 25–35 dk |
| İlk kiralık/ikinci el araç | 45–60 dk |
| İkinci araç ruhsatı | 2–3 saat toplam |
| İkinci hat | Level 10 + yaklaşık 4–6 saat toplam |
| Premium araç | Birkaç günlük düzenli oyun; piyango zorunlu değil |

### Fiyat katmanları

- Başlangıç upgrade'leri ve ekipman
- Bakım/sarf giderleri
- Şoför işe alım ve vardiya ücreti
- Araç kiralama
- İkinci el araç
- Yeni araç
- Hat lisansı ve hat upgrade'i
- Terminal tesisi
- Şirket yetenek reset'i

### Korumalar ve simülatör

- Oyuncu hiçbir harcamayla devam edemeyen hesap durumuna düşmez.
- Acil kontrat veya düşük maliyetli kiralık araç bulunur.
- Şans kazancı fiyat dengesinin temeli değildir.
- Fiyat yanında `yaklaşık X vardiyada kendini öder` bilgisi gösterilir.
- Headless simülatör temkinli/ortalama/optimize profilleri 30 dk, 2 saat, 1 gün ve 7 gün çalıştırır.
- Ekonomi JSON değişikliği CI'da para, XP, unlock ve darboğaz farkı üretir.
- `MaxPlausibleMoneyPerSecond` ekonomiyle birlikte otomatik test edilir.

### Bitiş kriteri

- İlk 60 dakikada 10 dakikadan uzun salt para bekleme boşluğu yoktur.
- Hiçbir tek gelir kaynağı toplam gelirin %45'inden fazlasını sürekli üretmez.
- Kritik yatırımın amortismanı ve unlock gerekçesi oyuncuya açıklanır.

### Uygulama kaydı — 2026-08-03 (kısmi)

- Amortisman motoru eklendi: `frontend/src/game/paybackEconomy.ts` — saf, test edilebilir fonksiyonlar
  (roster ortalaması ile vardiya başına net gelir → "kaç vardiyada kendini öder").
- Yönetim panelinde ek dolmuş ve ikinci hat satın alımlarında "💡 ~X vardiyada kendini öder"
  göstergesi (TR/EN). Bitiş kriteri "kritik yatırımın amortismanı açıklanır" karşılandı.
- Backend sağlamlaştırma: `EconomyConstants.Validate()` açılışta ekonomi bütünlüğünü doğrular
  (pozitif/kademeli fiyatlar, şoför aralıkları, artan level eşikleri); bozuk `economy.json` ile
  sunucu başlamaz. Aynı değişmezler `check-economy-sync.mjs` ile CI'da erken yakalanır.
- **Fiyat revizyonu (Enes onayı):** Amortisman görünürlüğü büyük yatırımların tempo hedefinin
  ~10× dışında olduğunu ortaya çıkardı (eski: ek dolmuş ~460, ikinci hat ~231 vardiya). Plan
  formülüyle (`fiyat = net gelir/vardiya × hedef vardiya`) hedef ~60 vardiyaya çekildi:
  - Ek dolmuş: 1.250.000/1.850.000/2.750.000 → **160.000/240.000/350.000** (ilki 59 vardiya,
    sonrakiler filo genişleme hedefi olarak kademeli).
  - İkinci hat açılışı: 1.500.000 → **300.000** (açılış+şoför toplam 420.000 = 60 vardiya).
- **Kalan Faz 2 işleri:** headless denge simülatörü (temkinli/ortalama/optimize profilleri),
  upgrade/terminal/araç katmanının simülatörle doğrulanması, `MaxPlausibleMoneyPerSecond`
  regresyon testi, dashboard ekonomi ekranı.

---

## Faz 3 — Gerçek vardiya, oyun günü ve not sistemi

### Oturum

- Bir oyun günü yaklaşık 12–18 dakikalık aktif oturumdur.
- Gün başında araç, hat, manuel/şoför, ana hedef ve opsiyonel risk bonusu seçilir.
- Gün içinde kısa seferler bulunabilir; hepsi tek gün raporunda birleşir.
- Erken kapatma ile bağlantı kopması ayrılır.

### Puan ağırlıkları

| Boyut | Ağırlık |
|---|---:|
| Güvenlik ve ihlal | %25 |
| Zamanlama/sefer | %20 |
| Yolcu memnuniyeti | %20 |
| Durak yanaşma/servis | %15 |
| Net işletme sonucu | %10 |
| Kontrat hedefleri | %10 |

### Not skalası

| Puan | Not | Puan | Not |
|---:|---|---:|---|
| 97–100 | S+ | 75–81 | B+ |
| 93–96 | S | 68–74 | B |
| 88–92 | A+ | 55–67 | C |
| 82–87 | A | 40–54 | D |
| 0–39 | F | | |

- S/S+ için güvenlik ve hizmette minimum baraj vardır; yalnız yüksek kâr yetmez.
- Not XP ve itibarı etkiler; para çarpanı sınırlı kalır.
- Rapor, her puanın neden kazanıldığını/kaybedildiğini gösterir.

### Gün sonu ekranı

- Not ve önceki güne göre değişim
- Brüt, maaş, bakım, ceza ve net para
- Baz/kontrat/not/ilk başarı XP'si
- Hat mastery ve şoför XP'si
- Günün üç önemli olayı
- Yarın için hava/event tahmini
- Yeni gün/kontrat seçimi

### Bitiş kriteri

- Günün başı ve sonu net hissedilir.
- Yenilemeyle aynı rapordan iki kez ödül alınamaz.
- Tüm not sınırları otomatik test edilir.

### Uygulama kaydı — 2026-08-03 (dikey dilim)

- **Gün döngüsü:** Mevcut oyun saatine dokunmadan "Gün Başlat → sür → Gün Bitir" sarmalı eklendi
  (`store.ts > dayRun/dayReport`, `startDay/endDay/dismissDayReport`). TopNav'da tek düğme başlat/bitir.
- **Gün Başlat modalı** (`DayStartModal.tsx`): açık hatlardan seçim, manuel/şoför, üç ana hedef (TR/EN).
- **Saf not motoru** (`dayGrading.ts`): 5 aktif boyut (güvenlik, zamanlama, memnuniyet, durak servisi,
  işletme sonucu) ağırlıklı → S+/S/A+/A/B+/B/C/D/F; S/S+ için güvenlik+memnuniyet barajı. Ağırlık, eşik,
  XP çarpanları `economy.json > dayGrading` içinde. Tüm not sınırları `npm run check:grading` ile test edilir.
- **Gün sayaçları:** `finishBoarding` (biniş/servis/net), GEÇ-kaçan-durak (missed), polis cezası ve kırılan
  söz (violation) sitelerine idempotent artışlar; sekme senkronuna (`BroadcastPayload`) dahil.
- **Gün sonu raporu** (`DayEndReport.tsx`): not, boyut kırılımı, net kazanç, XP. Ertelenen boyutlar "yakında".
- **Sunucu doğrulaması:** `POST /api/shifts/{playerId}` — XP grade'den sunucuda hesaplanır (istemciye
  güvenilmez), Faz 0'daki `ShiftResults` tablosuna idempotency anahtarıyla yazılır; yenileme/çift sekmede
  çift ödül yok (ön kontrol + benzersiz indeks + yarış yakalama). `EconomyConstants` açılışta dayGrading'i doğrular.
- Kontroller: `tsc` · `check:i18n` (442 anahtar) · `check:driving` · `check:economy` · yeni `check:grading` ·
  backend build + boot testi (Validate geçti, endpoint kayıtlı) — hepsi yeşil.
- **Bu dilimde ertelendi (sonraki fazlara):** risk bonusu, yarın hava tahmini (Faz 7), kontrat hedefi boyutu
  (Faz 4), hat mastery / şoför XP kırılımı (Faz 5/6), günün üç öne çıkan olayı. Raporda yer tutucu olarak görünür.

---

## Faz 4 — Günlük görevleri kaldır, kontrat motoruna geç

Mevcut rastgele üç günlük görev tamamen kaldırılır.

### Kontrat aileleri

- Normal yolcu servisi
- Okul/üniversite
- Sanayi vardiya çıkışı
- Hastane öncelikli sefer
- Festival/maç taşıması
- Yağmur/sıcak hava görevi
- Ekspres/zaman denemesi
- Güvenli sürüş
- Yüksek memnuniyet
- Şoför geliştirme
- Hat hikâyesi
- Çok günlük şirket sözleşmesi

Yüzlerce kontrat elle yazılmaz:

1. Şablonlar; hedef, hat, hava, yolcu profili, bonus ve ceza parametrelerini birleştirir.
2. Elle yazılan hikâye kontratları özel karakter, diyalog ve kalıcı sonuç taşır.

Her kontratta level aralığı, önerilen araç/şoför, ana hedef, en fazla iki bonus, açık başarısızlık
koşulu, para/XP/itibar/mastery ödülü ve cooldown bulunur.

### Bitiş kriteri

- [x] Aynı kombinasyon arka arkaya gelmez.
- [x] Her level bandında en az sekiz uygun kombinasyon vardır.
- [x] Görüntüleme, kabul, tamamlama, bırakma ve başarısızlık nedeni ölçülür.

### Uygulama kaydı — 2026-08-04

- **Rastgele üç günlük görev kaldırıldı:** `store.ts`'teki `dailyGoals/generateDailyGoals/
  advanceGoal/syncEarnGoal` tamamen silindi; TopNav'daki "Görevler" düğmesi/dropdown'ı
  kontrat paneline dönüştü.
- **Saf kontrat motoru** (`contracts.ts`): 12 aile (`shared/economy.json > contracts.families`),
  6 seviye bandı (targetMultiplier/rewardMultiplier), 5 bonus (en fazla 2/kontrat). Teklif
  üretimi aile × bonus alt kümesi kombinasyonuyla bant başına 8+ teklif sağlar; son sunulan
  aileler (`recentContractFamilyIds`) bir sonraki günde tekrar gelmez.
- **Store entegrasyonu:** `activeContracts`/`contractOffers` state'i; `acceptContract` (en
  fazla 2 aktif, "contracts" unlock kapısı — level 3), `abandonContract`, `refreshContractOffers`.
  İlerleme, eski günlük görev sisteminin izlediği aynı olaylarda (yolcu alma, DUR kararı,
  hat dışı sefer, kazanç senkronu) `advanceContractProgress`/`syncContractEarnProgress` ile
  güncellenir; hedefe ulaşan kontrat parayı anında öder.
- **Gün sonu:** Oyun günü değiştiğinde tamamlanmamış kontratlar başarısız sayılır, teklif
  havuzu yenilenir. `dayGrading.ts > contractGoals` boyutu artık aktif (tamamlanan/başarısız
  oranı); Faz 3'teki "yakında" yer tutucusu kaldırıldı.
- **Backend doğrulama:** `EconomyConstants.Contracts` + `Validate()` açılışta aile/bonus/bant
  bütünlüğünü kontrol eder. Yeni `POST /api/contracts/{playerId}/resolve` — Faz 0'ın
  `ContractRuns` tablosunu (idempotency anahtarıyla) kullanır, XP/itibarı familyId + bonusIds +
  oyuncunun mevcut seviyesinden sunucuda hesaplar (istemci tutarına güvenilmez); para ödülü
  vardiya ödülleriyle aynı bilinçli borç kalıbıyla istemcide verilir (ADR-002).
- **Telemetri:** `contract_viewed/accepted/completed/failed/abandoned` olayları.
- **Ertelendi:** Elle yazılan hikâye kontratları (özel karakter/diyalog/kalıcı sonuç) ve
  "güvenli sürüş/yüksek memnuniyet" ailelerinin gerçek violation/satisfaction eşiği —
  bu dilimde mevcut dört ilerleme tipiyle (earn/board/dur/offroute) temsil edilir; gerçek
  eşik Faz 5/7 şoför ve event sistemiyle gelecek. Çok günlük şirket sözleşmesi de bu dilimde
  tek günlük olarak çalışır.
- Kontroller: `tsc` · `check:i18n` (469 anahtar) · `check:driving` · `check:economy` ·
  `check:grading` · frontend production build · backend build + boot testi — hepsi yeşil.

---

## Faz 5 — Şoför 2.0

### Altı temel özellik

| Özellik | Etki |
|---|---|
| Sürüş | Hız kontrolü, kaza/ihlal riski |
| Dakiklik | Vardiya ve kontrat zamanı |
| Hizmet | Memnuniyet ve şikâyet |
| Ekonomi | Yakıt/bakım ve net gelir |
| Güvenilirlik | Geç kalma, vardiya ve arıza yönetimi |
| Soğukkanlılık | Yoğunluk, yağmur, maç ve polis performansı |

Ek state: şoför level/XP, moral, yorgunluk, sadakat, maaş beklentisi, hat bilgisi, bir kişilik
özelliği, üç açılabilir yetenek, sözleşme ve vardiya uygunluğu.

“En pahalı en iyi” olmayacak. Hızlı şoför ekspres hatta; hizmeti güçlü şoför hastane/mahalle
hattında; soğukkanlı şoför yağmur ve maç gününde değerli olacak.

### Bitiş kriteri

- [x] Her şoförün iki güçlü ve bir zayıf senaryosu vardır.
- [x] Atama ekranı tahmini not, risk ve net geliri açıklar.
- [x] Yorgunluk/moral gizli ceza değildir; önceden bildirilir.

### Uygulama kaydı — 2026-08-04

- **Altı özellik:** Sürüş (`speedMultiplier`) ve Ekonomi (`efficiency`/`salaryShare`'den türetilen
  bağıl skor — `driverProfile.ts > economyScore`) mevcut alanlardan geliyor; Dakiklik/Hizmet/
  Güvenilirlik/Soğukkanlılık `shared/economy.json > drivers` içine 16 şoförün her biri için elle
  yazıldı (0-1). Her şoförde ayrıca bir `personality` etiketi ve tam olarak iki `strongTags` +
  bir `weakTags` (havuz: express/night/rain/event/hospital/school/industrial) var — bitiş
  kriterindeki "iki güçlü bir zayıf senaryo" doğrudan veri.
- **Saf tahmin motoru** (`driverProfile.ts > estimateAssignment`): dört yeni özellik + senaryo
  eşleşmesi (Faz 4 kontrat ailesinin örtük etiketi + gece vardiyası) + yorgunluk/moral
  cezasından 0-100 puan üretir; not `dayGrading.ts > gradeForScore` ile aynı eşiklerden okunur
  (tutarlı görünüm), risk düşük/orta/yüksek olarak sınıflanır.
- **Atama ekranı** (`ManagementHud.tsx > ShiftAssignmentBoard`): her vardiya seçeneğinde artık
  net gelir tahmininin yanında tahmini not, risk rozeti ve güçlü/zayıf eşleşme rozeti gösteriliyor
  (vardiya bitişindeki toplam yorgunluk dakikası önceden hesaplanıp gösterilir). Roster listesi
  kişilik, güçlü/zayıf senaryo etiketleri ve moral yüzdesini gösterir — hepsi görünür, gizli ceza yok.
- **Moral** (`store.ts > driverMorale`): gün otomatik şoförle geçtiyse not S+/S/A+/A → +6,
  D/F → -10 (`shared/economy.json > driverMorale`). Backend'e `DriverMoraleJson` sütunuyla
  (migration v5) kalıcı; `driverShiftMinutes` ile aynı save/load yolunu izler.
- **Yorgunluk uyarısı** zaten Faz 3/4'ten vardı (`warningShiftGameMinutes` — sarı rozet, kırmızıya
  geçmeden önce); bu fazda dokunulmadı, sadece tahmin motoruna girdi olarak kullanıldı.
- **Ertelendi:** şoför level/XP, sadakat, maaş beklentisi, üç açılabilir yetenek, sözleşme/vardiya
  uygunluğu sistemi — bitiş kriteri bunları gerektirmiyor; uzun vadeli filo yönetimi derinliği
  olarak sonraki bir dilime bırakıldı. Backend, yeni özellik alanlarını (personality/tags/
  punctuality vb.) doğrulamaz — bunlar parasal otorite taşımayan görüntüleme verisi.
- Kontroller: `tsc` · `check:i18n` (499 anahtar) · `check:driving` · `check:economy` ·
  `check:grading` · frontend production build · backend build + boot testi (migration v5
  mevcut veritabanına temiz uygulandı) — hepsi yeşil.

---

## Faz 6 — Hat 2.0

Mevcut rota geometrileri korunur. Hatlara global, kurmaca isim ve oynanış kimliği verilir:

- Mahalle Hattı / Neighborhood Line
- Üniversite Hattı / Campus Line
- Sanayi Hattı / Industrial Line
- Ekspres Hat / Express Line
- Sahil Hattı / Coast Line
- Hastane Hattı / Hospital Line
- Gece Hattı / Night Line
- Büyük Ring / Grand Ring

### Altı hat özelliği

- Talep yoğunluğu
- Ücret/gelir potansiyeli
- Trafik yoğunluğu
- Denetim riski
- Baskın yolcu profili
- Event uyumu/değişkenliği

Ek olarak durak sayısı, sefer süresi, güvenlik zorluğu ve yoğun saat gösterilir.

### Hat mastery ve hikâye

- Her hat mastery level 1–10 gelişir.
- XP; vardiya, yüksek not, kontrat ve özel hikâyeden gelir.
- Upgrade: durak düzeni, çizelge, ekspres servis, bilgilendirme, bakım noktası, eğitim merkezi.
- Upgrade yalnız gelir değil; yeni oynanış, event karşılığı ve kontrat açar.
- Her hatta 3–5 bölümlük yolcu/rakip/belediye/mahalle hikâyesi bulunur.

### Bitiş kriteri

- [x] İki hattın gelir çarpanı dışında ölçülebilir oynanış farkı vardır.
- [x] Seçim ekranı uygun araç ve şoför gerekçesini anlatır.
- [x] Mastery sunucuda kalıcıdır.

### Uygulama kaydı — 2026-08-04

- **Hat kimliği:** `route.ts`'teki 8 hattın adı plandaki kurmaca isimlerle değiştirildi
  (starter-center→Mahalle, main-city→Üniversite, west-worker→Sanayi, premium-outer→Hastane,
  north-loop→Gece, east-express→Ekspres, south-coast→Sahil, grand-ring→Büyük Ring). Geometri/id
  değişmedi — yalnız isim ve `shared/economy.json > routes` altında profil/talep/risk/önerilen
  özellik eklendi.
- **Gelir çarpanı dışında ölçülebilir fark (bitiş kriteri 1):** her hattın `demandMultiplier`'ı
  `growStopQueues`'ta talep/kuyruk hızını, `riskMultiplier`'ı `tickSpeedRisk`'te toplanan polis
  riskini çarpıyor (`store.ts`). Mevcut `wealthMultiplier` (gelir) zaten ayrı bir eksendi; bu
  ikisi ona ek, ölçülebilir ve birbirinden bağımsız iki fark daha ekliyor.
- **Seçim ekranı gerekçesi (bitiş kriteri 2):** `routeProfile.ts > recommendDriverForRoute`
  hattın `recommendedTrait`ine (hız/dakiklik/hizmet/ekonomi/güvenilirlik/soğukkanlılık) göre
  rosterdeki en uygun şoförü seçer; `recommendedVehicleTier` risk/talebe göre araç önerisi
  metni üretir. `DayStartModal.tsx`'te hat seçilince profil, önerilen şoför+gerekçe, araç
  önerisi ve mastery seviyesi gösterilir.
- **Mastery kalıcılığı (bitiş kriteri 3):** `store.ts > routeMastery` (hat başına level/xp),
  gün sonunda not puanıyla orantılı XP kazanır (`routeProfile.ts > advanceRouteMastery`,
  `shared/economy.json > routeMastery` 10 seviyelik eşik). Backend'e `RouteMasteryJson`
  sütunuyla (migration v6) kalıcı — `driverMorale` ile aynı save/load yolu.
- **Ertelendi:** trafik yoğunluğu/event uyumu sayısal alanları JSON'da var ama henüz hiçbir
  sistemde okunmuyor (Faz 7 canlı şehir event yönetmeniyle etkinleşecek); hat upgrade'leri
  (durak düzeni/çizelge/ekspres servis/bilgilendirme/bakım noktası/eğitim merkezi) ve
  3–5 bölümlük yolcu/rakip/belediye hikâyeleri bu dilimde yok — bunlar bitiş kriterinin
  gerektirmediği, kendi başına büyük bir içerik/tasarım paketi; ayrı bir dilime bırakıldı.
- Kontroller: `tsc` · `check:i18n` (518 anahtar) · `check:driving` · `check:economy` ·
  `check:grading` · frontend production build · backend build + boot testi (migration v6
  mevcut veritabanına temiz uygulandı) — hepsi yeşil.

---

## Faz 7 — Canlı şehir event yönetmeni

| Event | Etki | Karşı hamle |
|---|---|---|
| Yol çalışması | Rota süresi/şerit kısıtı | Alternatif plan veya zaman bonusundan vazgeçme |
| Sıcak hava | Talep ve konfor | Uygun araç/ekipman, mola, fiyat kararı |
| Araç arızası | Performans düşüşü | Bakım, yedek araç, kontratı devretme |
| Yağmur | Talep artışı, fren/traﬁk zorluğu | Güvenli şoför, hız planı, ek servis |
| Festival | Hat yoğunluğu/bahşiş | Ek sefer ve kapasite planı |
| Maç günü | Saatli yolcu dalgası | Hat/şoför vardiya değişimi |
| Polis denetimi | Riskli aksiyon baskısı | Güvenli rota veya riskli ödül |
| Okul çıkışı | Öğrenci yoğunluğu | Fiyat/hizmet ve kapasite kararı |

- Günlük seed ve event planını sunucu üretir.
- Event deck aynı olayın sürekli gelmesini engeller.
- Her event ön uyarı, süre, etkilenen hat, şiddet, modifier, karşı önlem ve sonuç taşır.
- Düşük level'da tek olay; ileride olay kombinasyonları açılır.
- Gün sonu raporu kararın etkisini gösterir.

### Bitiş kriteri

- [x] Event'li aynı hat farklı karar gerektirir.
- [x] Oyuncu başlamadan hazırlık sinyali görür.
- [x] Başarısızlık hesabı kilitlemez; ekonomi/hikâye sonucu üretir.

### Uygulama kaydı — 2026-08-04

- **Sunucu üretimi (bitiş kriteri 2 ön koşulu):** yeni `GET /api/events/{playerId}/today?gameDay=X`
  — olay `(playerId, gameDay)` çiftinden deterministik üretilir (`EconomyConstants.
  GenerateDailyEvent`); istemci tahmin edip taklit edemez, aynı gün tekrar sorulursa aynı
  sonucu verir. Önceki günle aynı şablon gelmez (event deck kuralı). Level ≥ 12
  (`progression.unlocks.eventContracts` ile aynı eşik) → ikinci, eşzamanlı olay.
- **Sekiz şablon** (`shared/economy.json > cityEvents`): yol çalışması, sıcak hava, araç
  arızası, yağmur, festival, maç günü, polis denetimi, okul çıkışı — her biri talep/risk/
  ücret/memnuniyet ekseninde küçük bir modifier taşır ve rastgele bir hatta (`affectedRouteId`)
  atanır.
- **Aynı hat farklı karar (bitiş kriteri 1):** olayın etkisi yalnız `affectedRouteId` o günün
  sürülen hattıyla eşleşince uygulanır (`store.ts > activeEventEffects`) — `growStopQueues`
  (talep+memnuniyet), `tickSpeedRisk` (risk), `currentPassengerFare` (ücret). Aynı olay
  varken farklı hat seçmek etkisiz kalır; etkilenen hattı seçmek gerçek bir ödün gerektirir.
- **Önceden hazırlık sinyali (bitiş kriteri 2):** `DayStartModal.tsx`, Gün Başlat'tan önce
  olayı, şiddetini, etkilenen hattı ve (varsa) ikinci olayı banner olarak gösterir; "Hazırlan"
  butonu (`prepareForEvent`) ücretini öder ve riski/memnuniyet kaybını yarıya indirir
  (`counterEffectRatio`) — talep/ücret artışı gibi olumlu eksenlere dokunmaz, sadece riski
  yönetirsin. Gün sonu raporu kararın etkisini ("hazırlıklıydın"/"hazırlıksızdın") gösterir.
- **Hesap kilitlenmez (bitiş kriteri 3):** tüm modifier'lar sayısal (talep/risk/ücret/
  memnuniyet çarpanı); hiçbiri ilerlemeyi durdurmaz, sadece o günün ekonomi/not sonucunu
  değiştirir.
- **Ertelendi:** olay kombinasyonu havuzu şu an sabit 8 şablon+opsiyonel ikinci olay (daha
  zengin kombinasyon mantığı sonraki dilime); event'e özel benzersiz karşı hamle metni yerine
  tek genel "hazırlık" mekaniği kullanıldı — sekiz farklı bahane/hikâye anlatımı yerine tutarlı
  tek kural tercih edildi.
- Kontroller: `tsc` · `check:i18n` (535 anahtar) · `check:driving` · `check:economy` ·
  `check:grading` · frontend production build · backend build + boot testi — hepsi yeşil.

---

## Faz 8 — Parçalı ve bağlamsal tutorial

### İlk girişte zorunlu beş adım

1. Şirket ve başlangıç aracı
2. Hareket/yön
3. Durağa güvenli yanaşma
4. Kapı ve yolcu alma
5. İlk mini gün raporu

### Bağlama göre açılan paketler

- Upgrade alınabilir olduğunda upgrade
- Level 3'te şoför işe alma/atama
- İlk kontratta kontrat
- Level 8'de ikinci araç
- Level 10'da yeni hat
- İlk şehir event'inde event
- İlk şans oyunu ziyaretinde bütçe

Mevcut 21 adımlık havuz silinmez; küçük paketlere ayrılır. Tamamlanma/skip durumu backend'de
oyuncu bazında saklanır. İlk zorunlu tur 3–5 dakikayı geçmez ve gerçek aksiyonla ilerler.

### Uygulama kaydı — 2026-08-04

- [x] Mevcut 21 adımlık havuz silinmedi: `TutorialOverlay.tsx > TUTORIAL_PACKAGES` içinde 9 pakete
  ayrıldı (`core` 5, `extras` 9, `upgrade`/`driver`/`secondBus` 2'şer, `contract`/`newRoute`/
  `cityEvent`/`chance` 1'er) — toplam 24 adım (21 eski + 3 yeni: `boarding`, `dayReportIntro`,
  `cityEventIntro`).
- [x] **Zorunlu ilk tur gerçek aksiyonla ilerler:** `core` paketindeki üç adım (Hareket/yön,
  Durağa güvenli yanaşma, Kapı ve yolcu alma + gün sonu raporu) tıklamayla değil gerçek oyun
  durumuyla ilerliyor (`autoAdvanceOn`: `busProgress` hareketi, `dayRun.stopsServed`,
  `dayRun.boardings`, `dayReport` doluluğu). Beş adım da kısa — hedef 3-5 dakika.
- [x] **Bağlamsal paketler** (`TutorialTriggers.tsx`, GameHome'da monte): upgrade alınabilir
  olduğunda (para ≥ ilk motor yükseltmesi), level 3'te şoför, ilk kontrat kabulünde kontrat,
  ikinci araç satın alınca (`ownedBusIds.length>1`) ikinci araç paketi, level 10'da yeni hat,
  `cityEvent` ilk dolduğunda şehir event paketi, şans oyunu paneli ilk açılışında şans paketi.
  Her paket tam bir kez tetiklenir (`tutorialStore.activatePackage` zaten tamamlanmış/aktif
  pakette no-op).
- [x] **Backend kalıcılığı:** `tutorialStore.ts > packageStatus` artık `store.ts`'in normal
  save/load döngüsüyle (`GameSnapshot.tutorialStatus`) senkron; backend'de `TutorialStatusJson`
  sütunuyla (migration v7) kalıcı — `driverMorale`/`routeMastery` ile aynı yol. Yeni hesapta
  zorunlu ilk tur açma sinyali (`markTutorialRequired`) bilinçli olarak yerel kaldı — bu, hesap
  ekonomisi/otoritesi taşımayan bir "ilk kez mi" bayrağı.
- Kontroller: `tsc` · `check:i18n` (542 anahtar) · `check:driving` · `check:economy` ·
  `check:grading` · frontend production build · backend build + boot testi (migration v7
  mevcut veritabanına temiz uygulandı) — hepsi yeşil.

---

## Faz 9 — Şans oyunları 2.0

### Korunacak

- Ayrı merkez, sunucu sonucu, bütçe limiti, çark/plaka/piyango.

### Değişecek

- Durak kuponu gerçek kontrat/gün performansına bağlanır.
- Tombala gerçek event'lerle kutu doldurur.
- Ödüllere bakım kuponu, kozmetik, event hazırlığı ve kontrat reroll eklenir.
- Level kilidi ve güvenli bütçe vardır.
- Ödül, mastery veya zorunlu level'ı atlamaz.
- Büyük kazançlar ayrı audit ve ekonomi dashboard'unda izlenir.

### Uygulama kaydı — 2026-08-04

- [x] **Korunacak korundu:** ayrı merkez, sunucu sonucu, bütçe limiti, çark/plaka/piyango
  hiç değişmedi — sadece kupon, tombala ve genel oynama kuralları güncellendi.
- [x] **Kupon gerçek performansa bağlandı:** `ChanceGameService.ComputePerformanceFactorAsync`
  son `ShiftResults` notunu ve son 5 `ContractRuns` tamamlanma oranını okuyup 0-1 skor üretir;
  `ApplyPerformanceBoost` bu skoru kuponun "miss" ağırlığını düşürüp olumlu sonuçları
  yükseltmek için kullanır (`shared/economy.json > chanceGames.performanceBoostMaxRatio`).
  Geçmiş yoksa nötr (0.5) — ceza da bonus da yok.
- [x] **Tombala gerçek olayla kutu doldurur:** tombala oynanırken Faz 7'nin aynı deterministik
  üretecinden (`EconomyConstants.GenerateDailyEvent`) bugünün gerçek şehir olayı okunur;
  "eventBox" çıkışının ağırlığı olayın şiddetine göre ölçeklenir ve etiketi o günün olayına
  göre değişir (`"{event} kutusu"`).
- [x] **Para dışı ödüller:** kupon/tombala outcome tablosuna `rewardType` alanı eklendi —
  bakım kuponu (bir sonraki şehir olayı hazırlığını ücretsiz yapar), kaporta rengi (kozmetik,
  `ownedCosmetics`), hazırlık kutusu (`eventPrep` — o günün hazırlığını anında ücretsiz
  tamamlar) ve kontrat yenileme (`contractReroll` — teklif havuzunu hemen yeniler).
- [x] **Level kilidi + güvenli bütçe:** yeni `progression.unlocks.chanceGames` (level 4) —
  TopNav düğmesi kilitliyken kilit toastı gösterir, backend `ValidatePlayAsync` seviyeyi
  ayrıca doğrular (istemci atlatamaz). `chanceGames.minimumReserve` her oynanışta kasanın
  güvenli rezervin altına düşmesini engeller.
- [x] **Ödül mastery/level atlamaz:** hiçbir `rewardType` XP, level veya route mastery
  vermez — sadece para ve yukarıdaki dört kolaylık türü.
- [x] **Büyük kazanç audit:** `LogLargeWinIfNeededAsync` — ödül `largeWinThreshold`'u
  (150.000) geçerse `GameplayEvents` tablosuna `chance_large_win` / `economy_audit`
  kategorisiyle idempotent kayıt düşer; mevcut admin analytics oyuncu detayı bunu diğer
  kritik olaylarla birlikte gösterir (ayrı bir dashboard sayfası backlog'da kalan bir sonraki iş).
- Kontroller: `tsc` · `check:i18n` (542 anahtar) · `check:driving` · `check:economy` ·
  `check:grading` · frontend production build · backend build + boot testi — hepsi yeşil.

---

## Faz 10 — Mahalle karakterleri: 3B model zorunlu değil

| Yaklaşım | Maliyet | Canlılık | Performans | Karar |
|---|---:|---:|---:|---|
| Her karakter benzersiz 3B | Çok yüksek | Yüksek | Riskli | İlk sürümde hayır |
| 2D portre + isim + konuşma | Düşük | Orta-yüksek | Çok iyi | Hikâye prototipinde evet |
| Modüler gövde + aksesuar/renk | Orta | Yüksek | İyi | 3B için evet |
| Uzakta instanced siluet, yakında portre | Düşük-orta | Yüksek | En iyi | Önerilen hibrit |

### Önerilen hibrit

- Şehirde 6–8 düşük poly arketip/instanced siluet.
- İsim, kişilik, hafıza ve ilişki 2D portre/konuşma kartında yaşar.
- Ortak gövde; renk, saç, şapka, çanta ve materyalle çoğaltılır.
- Önce sekiz isimli karakterle dikey dilim; etkisi ölçülmeden 30 benzersiz model yapılmaz.
- Hafıza: son karşılaşma, güven, tercih edilen hat/saat, sözler, şikâyet/övgü, hikâye durumu.

**Kemal şunu yapsın:** Mevcut `K15` görevi kapsamında ortak oran/materyale sahip 6–8 arketip
hazırlasın; karakter başına 1.5k–3k tris, en fazla iki materyal, animasyonsuz `.glb`. Benzersiz
kişilikler 2D portre ve aksesuar/material varyantlarıyla üretilecek; 30 ayrı model yapılmayacak.

---

## Faz 11 — Başarılar, rozetler ve uzun vade

Kategoriler: sürüş/güvenlik, hizmet, ekonomi/filo, şoför yönetimi, hat mastery, kontrat, şehir
event'leri ve gizli mizahi başarılar.

Rozetlerin çoğu güç vermez; profil vitrini, şirket kozmetiği veya unvan açar. Başarılar yalnız sayı
grind'i değil, farklı oynama biçimlerini teşvik eder. Sezon hedefleri core ekonomiyi sıfırlamaz.

---

## Faz 12 — Sosyal sistem en son

Core ve ekonomi oturmadan arkadaş sistemi genişletilmez. Bu fazda ayrıca kararlaştırılacaklar:

- Uygun asenkron arkadaş etkileşimi
- Ortak mahalle/topluluk kontratları
- Şirket vitrini ve başarı karşılaştırması
- Level bandına göre adil ligler
- Taciz, hile ve ekonomi sömürüsüne karşı sunucu kuralları

Global para sıralaması önerilmez. Ustalık notu, kontrat çeşitliliği veya haftalık eşit koşullu
challenge daha adildir.

---

## Analytics dashboard kapsamı

### Genel

- Yeni hesap, aktif ve eşzamanlı oyuncu
- D1/D7/D30 retention
- Ortalama, medyan ve p90 oturum
- Günlük vardiya sayısı
- Hata ve FPS p50/p95

### Funnel

- Kayıt → şirket → araç → ilk hareket → ilk durak → ilk rapor
- Level 1 → 3 → 5 → 8 → 10
- Şoför görüntüleme → işe alma → atama
- Araç görüntüleme → satın alma → aktif kullanma
- Kontrat görüntüleme → kabul → bitirme/bırakma

### Ekonomi

- Para kaynakları/giderleri
- Level başına medyan bakiye
- Ürün görülme/satın alma oranı
- Amortisman süresi
- Şans oyunlarının net etkisi
- Backend tarafından kırpılan şüpheli kazanç

### Oyuncu detayı

- Oturumlar, level/XP, şirket, araç, hat, şoför
- Kritik olay, satın alma, kontrat ve level geçmişi
- Hata/FPS geçmişi

Her tıklama körlemesine tutulmaz. Ürün kararı üreten butonlar `ui_action` olayıyla `action_id`,
`surface`, `context`, `result` alanlarını gönderir. Mouse hareketi ve her frame veri toplanmaz.

---

## İlk dört dikey dilim

### Dikey Dilim A

- Logout düzeltmesi
- Session/funnel telemetrisi
- Şirket kurma
- Level/XP backend modeli
- Level 1–5 unlock'ları

### Dikey Dilim B

- Ekonomi simülatörü
- İlk 60 dakika fiyat revizyonu
- Kiralık/ikinci el araç
- Dashboard ekonomi ekranı

### Dikey Dilim C

- Gün/vardiya başlangıcı
- Not hesaplayıcı
- Gün sonu raporu
- İlk 12 kontrat şablonu

### Dikey Dilim D

- Şoför 2.0 altı özellik
- İlk dört şehir eventi
- Üniversite/Sanayi/Ekspres hat kimliği
- Tutorial'ın ilk beş adıma bölünmesi

Bu dört dilim tamamlanmadan sosyal sisteme veya çok sayıda benzersiz yolcu modeline geçilmez.

## Ara dilim — Durak kasası, para üstü kararı, hat dışı düzeltmesi (2026-08-07)

Kemal'in oynanış geri bildirimi üzerine yapılan üç işlik dilim (yeni faz değil, mevcut
sistemlerin derinleştirilmesi):

- **Durak kasası:** Bekleyen yolcusu olan durakların önünde parlayan zemin alanı + dönen
  madeni para (`content/MvpWorld.tsx > StopMoneyBeacons`); dolmuş yanaşıp kapıyı açınca
  para toplanır ve tahsilat ekranda `+₺X` olarak patlar (`StopPayoutFx`, sinyal:
  `store > stopPayout`, `finishBoarding` içinde artan `id`).
- **Para üstü kararı:** Aritmetik bilmecesi kaldırıldı. Artık üç seçenekli dürüstlük kararı —
  kırmızı kazık / beyaz tam üstü / yeşil ikram. Üç tutar da açıkça gösterilir; kazık gün
  notuna **ihlal** yazar ve polis riski verir. Sayılar `economy.json > events.changeChoice`.
- **Hat dışı bug düzeltmesi:** Aracı yol ağının dışına taşıyan "sapak" hesabı kaldırıldı
  (binaların içinden geçen saçma rota bu yüzden oluşuyordu). Dolmuş artık yerinde bekler,
  5 saniye boyunca para kademeli birikir (`DetourPayoutOverlay`), sonra kaldığı yerden
  devam eder. `detourSeconds` 9 → 5.
- Kontroller: `tsc` · `check:i18n` (611 anahtar) · `check:driving` · `check:economy` ·
  `check:grading` · frontend production build · backend build + boot testi — hepsi yeşil.
- **Ertelendi:** Gerçek hat-dışı güzergâhı, yol ağı grafiği çıkarılınca ele alınacak
  (bkz. `05-hat-disi-risk-odul.md`).

## Ara dilim 2 — Tur/gezinti oturum yapısı ve HUD düzeni (2026-08-07)

Kemal'in ikinci oynanış turu geri bildirimi:

- **Gezinti modu + tur yapısı:** Oyun artık gezinti modunda başlar (`dayRun === null`);
  durak servisi, yolcu kararı ve tahsilat yalnızca vardiyada işler. Gün Başlat artık bir
  **hat önizlemesi** (durak sayısı dahil) ve **Sür / İptal** butanlarıdır. Hattın 12. durağı
  servis edilince **hat raporu** açılır (`LapReport.tsx`, `store > lapRun/lapReport/
  maybeCompleteLap`): brüt, gider, net kâr/zarar, binen yolcu, geçilen durak, hat dışı sefer,
  limit üstü yolcu, polis cezası (adet + tutar), ihlal. **Tekrar Sür** yeni tur başlatır,
  **Gezinti Modu** günü bitirip notlu gün raporuna geçer. Rapor açıkken dolmuş durur.
  Akış şeması: `02-cekirdek-dongu.md > Gezinti / gün / tur`.
- **Trafik kilitlenmesi düzeltildi:** `shouldYieldAtCrossing` artık **arkada kalan** araç için
  yol verdirmiyor. Eski hâlde kavşağa girmiş araç arkasındaki için fren yapıp ortada
  kilitleniyor, diğerleri içinden geçiyordu. Yeni `crossingClearMarginMeters` sabiti
  (`economy.json > driving`) ile iki yeni regresyon testi eklendi (`check:driving`).
- **Para üstü butonları:** Renk metinde değil **kutu zemininde** (kırmızı/beyaz/yeşil dolgu).
- **Durak ikonu:** Madeni para → **nakit deste** (üç banknot + bandrol).
- **Üst çubuk düzeni:** Logo absolute konumdan çıkarılıp `TopNav`'ın **orta sütununa**
  alındı; istatistikler sola, aksiyonlar sağa yaslandı, çakışma bitti (900px altında
  orta sütun gizlenir).
- Kontroller: `tsc` · `check:i18n` (632 anahtar) · `check:driving` · `check:economy` ·
  `check:grading` · frontend production build · backend build + boot testi — hepsi yeşil.
- **Ertelendi:** Yoldan çıkıp istenen sokağa girilen gerçek serbest sürüş; dolmuş hat
  geometrisine bağlı olduğu için yol ağı grafiği gerektirir (hat dışı güzergâhıyla aynı iş).
  → **Ara dilim 3'te yapıldı** (çarpışma hariç).

## Ara dilim 3 — Serbest sürüş, sıfırlama ve yükseltme game feel'i (2026-08-08)

Kemal'in üçüncü oynanış turu geri bildirimi:

- **Serbest sürüş (gezinti modu):** Dolmuş artık gezintide hat geometrisine bağlı değil.
  `GameCanvas > LeaderBus` içinde ayrı bir serbest sürüş dalı var: yön (`roamHeading`)
  direksiyonla döner, konum ileri vektörü boyunca entegre edilir, şehir sınırında kırpılır
  (`economy.json > driving.roamBoundsMeters/roamTurnRateRadPerSec`). Güne dönerken araç
  `route.ts > nearestRouteProgress` ile en yakın hat noktasına oturur. Takip kamerası artık
  progress yerine **gerçek araç konumunu** (`liveBusPose`) izler.
  **Ertelendi:** binalarla çarpışma (ayrı bir çarpışma katmanı işi).
- **Hat çizgisi** yalnız vardiyada veya hat önizlemesi açıkken görünür.
- **Oyunu sıfırla:** `POST /api/saves/{playerId}/reset` — hesap korunur, ilerlemenin tamamı
  (kayıt, şirket, level/XP, başarımlar, kontrat/vardiya kayıtları, şans oyunu geçmişi) tek
  transaction'da silinir; `EnsurePlayerFoundationAsync` yeni hesap gibi yeniden kurulur.
  İstemci tarafı `playerId.ts > clearLocalPlayerData` ile yerel izleri temizler ve sayfayı
  yeniler. Ayarlarda "Tehlikeli bölge" bölümünde **iki adımlı onay** arkasında.
- **Yükseltme game feel'i:** Motor/koltuk/ses/yazarkasa alınınca ekranın ortasında kutlama
  kartı (`UpgradeCelebrationCard.tsx`): takılan parça, aşama noktaları (kaçıncı seviye),
  ve dolmuşun **yükseltme sonrası güncel durumu** (hız çarpanı, kapasite, tüm parça seviyeleri).
  Sinyal: `store > upgradeCelebration` (sekmeler arası yayınlanmaz — satın almayı yapan
  sekmenin olayıdır).
- **Terminal tesisi açılışı:** Satın alınca kamera yeni binanın etrafında yavaşça döner
  (`GameCanvas > TerminalUnveilCam`; ChaseCam ve OrbitControls bu sırada devre dışı), ekranın
  altında tesisin adı, açıklaması ve getirdiği etkiler kartla gösterilir (`TerminalUnveil.tsx`).
  Kart kapanınca kamera kontrolü oyuncuya geri verilir.
- **Üst çubuk:** İstatistik çipleri sabit genişlikten esnek düzene geçti — yatay kaydırma
  kalktı, sekiz çip tek satıra sığıyor (ölçüldü: `scrollWidth === clientWidth`). Logo
  88px → 154px büyüdü ve tam ortada (ölçüldü: logo merkezi = ekran merkezi).
- Kontroller: `tsc` · `check:i18n` (648 anahtar) · `check:driving` · `check:economy` ·
  `check:grading` · frontend production build · backend build + boot testi — hepsi yeşil.

## Ara dilim 4 — Şirket kurma akışı gerçek karşılık kazanıyor (2026-08-08)

- **BUG (kritik, düzeltildi): sıfırlama sonrası şirket kurmak 500 veriyordu.** Ara dilim 3'te
  eklenen reset ucu `GameplayEvents` satırlarını silmiyordu; `company_created:{playerId}`
  idempotency anahtarı kaldığı için `UNIQUE(PlayerId, IdempotencyKey)` ihlal oluyordu.
  İki yerde düzeltildi: (1) reset artık `GameplayEvents`, `GameSessions` ve `TelemetryEvents`
  kayıtlarını da siliyor — böylece UNIQUE indeksli üç tablonun (`GameplayEvents`,
  `ContractRuns`, `ShiftResults`) hepsi temizleniyor; (2) `CreateCompanyAsync` funnel olayını
  eklemeden önce varlığını kontrol ediyor — analitik kaydı şirket kurmayı düşürmemeli.
- **Amblem seçimi görsel oldu:** Eskiden yalnızca amblem ADI yazıyordu, seçimin karşılığı yoktu.
  `CompanyEmblem.tsx` dört amblemi SVG olarak çiziyor (rota/direksiyon/şehir/yıldız) ve
  oyuncunun seçtiği iki renkle boyanıyor. İkincil renk seçimi de eklendi (önceden sabitti).
  Altında amblem + iki renk + şirket adını birleştiren canlı **şirket rozeti** var.
- **Yönetim yaklaşımının SAYISAL karşılığı eklendi** (`economy.json > progression.strategies`).
  Her yaklaşımın tek, ölçülebilir ve tek çıkış noktasından uygulanan bir etkisi var:
  | Yaklaşım | Etki | Uygulandığı yer |
  |---|---|---|
  | Hizmet | Durakta kazanılan memnuniyet ×1.35 (ceza aynı) | `finishBoarding` |
  | Operasyon | Polis riski birikimi ×0.8 | `applyPoliceRiskToState` (tüm risk buradan geçer) |
  | Büyüme | Filo (vardiyalı şoför) geliri ×1.2 | `tickOwnedBuses` |
  Sihirbazdaki açıklamalar artık bu sayıları birebir yazıyor — gizli bonus yok.
- **Minibüs seçimi showroom oldu:** `StarterBusShowroom.tsx` — seçili araç döner tabla
  üzerinde canlı 3B olarak sergileniyor (iki spot ışık, künyede koltuk/hız). Sekmelerle
  üç başlangıç aracı arasında geçiş yapılıyor.
- Canlı doğrulama: sıfırlama → 4 adımlı sihirbaz → şirket kuruldu (500 yok), yeni oyun
  Gün 1 / Seviye 1 / ₺0 / memnuniyet %60 ile gezinti modunda başladı.
- Kontroller: `tsc` · `check:i18n` (651 anahtar) · `check:driving` · `check:economy` ·
  `check:grading` · frontend production build · backend build + boot testi — hepsi yeşil.
- **Bilinen açık (Kemal):** `models/characters/peasant` materyali `Peasant Nolant Green.png`
  arıyor, klasörde `green.png` var → 404. → **Ara dilim 5'te çözüldü** (model değişti).

## Ara dilim 5 — Regresyon düzeltmeleri, yol çarpışması, karakterler ve ses (2026-08-08)

### Düzeltilen hatalar

- **REGRESYON (kritik): duraklarda yolcu alma çalışmıyordu.** Ara dilim 3'teki
  gezinti→gün geçişi `nextStopIndex`'i sabit **0** yapıyordu. Araç hattın ortasına
  oturduğunda "sıradaki durak" geride kaldığı için aradaki bütün duraklar tetiklenmeden
  geçiliyordu. Yeni `route.ts > nextStopIndexAfter(progress)` aracın **önündeki** ilk durağı
  seçiyor.
- **Trafik kilitlenmesi (ikinci tur).** İki ayrı sebep bulundu:
  1. Trafik, **duran** dolmuş için de kavşak rezervasyonu yapıyordu — oyuncu park edince
     bütün kavşak sonsuza kadar kilitleniyordu. Artık rezervasyon yalnızca dolmuş
     hareket hâlindeyken geçerli (`driving.busReservationMinKmh`).
  2. Genel **emniyet supabı**: bir araç `trafficStuckLimitSeconds` boyunca tamamen
     durursa rezervasyonları yok sayıp sürünerek geçiyor (`trafficCreepRatio`).
     Hiçbir mantık hatası aracı kalıcı kilitleyemez.

### Yeni

- **Serbest sürüşte yol çarpışması** (`cityRoads.ts`): şehir ızgarasının yol eksenlerinden
  (`mvpCityData.grid`) türetilen saf `isOnRoad` / `clampMoveToRoad`. Araç artık binaların
  içinden geçemiyor; tam hareket mümkün değilse tek eksende kaydırılıyor (duvar boyunca
  sürtme), sürtünce hız kesiliyor.
- **Gün hedeflerinin karşılığı** (`economy.json > dayGoals`): Kazanç/Memnuniyet/Güvenlik
  artık bir bahis. Hedef tutarsa net kazancın bir oranı prim olarak ödenir; tutmazsa ceza
  yok. Hedef ve prim oranı gün başlangıç ekranında yazıyor, sonuç gün raporunda
  "Tuttu / Tutmadı · gerçekleşen / hedef" olarak görünüyor.
- **Yaklaşım seçimi netleşti:** her seçeneğin yanında sayısal etki rozeti
  (`+%35 memnuniyet` / `−%20 polis riski` / `+%20 filo geliri`).
- **Gün/gece geçişi yumuşadı** (`SkyLife.tsx > advanceSkyClock`): gökyüzü ve ışıklar artık
  simülasyonun 4 Hz'lik sıçrayan `gameTimeMinutes` değerini değil, her kare kendi başına
  akan yumuşak bir saati okuyor (büyük sıçramada anında hizalanır).
- **Yolcu karakterleri değişti:** tek "peasant" modeli kaldırıldı; Animated Men/Women
  paketlerinden **8 animasyonlu karakter** eklendi (`public/models/characters/people/`).
  Her karakter klibin farklı yerinden başlar (senkron robot ordusu yok).
  PERF: modeller ön yüklenmez (~16 MB), Suspense ile talep üzerine gelir; ayrıca uzak
  durakların yolcuları hiç render edilmez (`VISIBLE_STOP_PROGRESS_RANGE`).
- **Ses efektleri** (`sfx.ts` + `SfxBinder.tsx`): WebAudio ile **sentezlenen** cozy tıklama
  seti — ses dosyası ve telif gerektirmez. Tüm butonlara tek bir capture dinleyiciyle
  bağlanır (`data-sfx` ile buton bazında değiştirilebilir). Oyun olayları da seslendirilir:
  durak tahsilatı (cash), yükseltme/hat raporu (confirm), polis cezası (error), tesis
  açılışı (pop). Ayarlar → Ses efektleri: açma/kapama + seviye.

- Kontroller: `tsc` · `check:i18n` (665 anahtar) · `check:driving` · `check:economy` ·
  `check:grading` · frontend production build · lint (yalnız 3 eski hata) — hepsi yeşil.

## Ara dilim 6 — Vardiya mantığı, direksiyon, ehliyet ceza sistemi (2026-08-08)

### Düzeltilen hatalar

- **Gün hattın ortasından başlıyordu.** "Gün Başlat → Sür" artık dolmuşu hattın **başına**
  (durak 1) alıyor. Yeni `dayStartToken` sayacı gerçek gün başlangıcını gezintiden
  dönüşten ayırıyor: gün sürerken gezintiye çıkıp dönersen kaldığın yerden devam ediyorsun.
- **Direksiyon neredeyse dönmüyordu.** Serbest sürüşte dönüş hızı `steerAngle` ile
  (radyan, tavanı 0,24) ÇARPILIYORDU → efektif ~15°/sn. Artık açı önce [-1,1] aralığına
  normalleştiriliyor; dönüş hızı `roamTurnRateRadPerSec` (1,6 rad/sn ≈ 92°/sn) tavanına
  çıkıyor ve tam etki `roamFullTurnKmh`'de (8 km/h) sağlanıyor.
- **Geri viteste direksiyon ters çalışıyor** (gerçek araç davranışı): geri manevrada
  A/D yer değiştirmiş gibi hissettiriyor.
- **Vardiya atamaları saatten bağımsız devralıyordu.** `assignDriverShift` atama anında
  `driverActive = true` yapıyordu; gece 03:00'te sabah vardiyasına şoför atayınca şoför
  hemen direksiyona geçiyordu. Artık tek kaynak `resolveShiftDriver()`: ana dolmuşu
  **o anki vardiyaya atanmış** şoför sürer, saat ilerledikçe (tickGameTime) devir otomatik
  gerçekleşir. Oyuncunun "kendim sürerim" tercihi (`manualOverride`) her zaman kazanır.
- **Serbest sürüşte araçların içinden geçiliyordu.** Gezinti moduna da trafik çarpışması
  eklendi (yalnızca gidiş yönündeki araçlar durdurur; geri giderken arkadakiler).

### Ehliyet ceza puanı sistemi (yeni)

Polis riski artık bir **bar**, ehliyet ise **ceza puanı** taşıyor
(`shared/economy.json > licence`, gösterge `RiskMeter.tsx`, ceza kartı `PenaltyCard.tsx`):

| İhlal | Riske etkisi | Ceza eşiği | Ceza puanı |
|---|---|---|---|
| Hız limiti aşımı | +%1/sn | risk ≥ %15 iken hâlâ hızlıysan | 5 |
| Hat dışı sefer | +%20 | risk ≥ %75 | 50 |
| Kapasite üstü yolcu | +%10 | risk ≥ %50 | 30 |
| Yolcu kazığı | — (riski artırmaz) | her 5 kazıkta | 20 |

- Ceza kesilince risk sıfırlanır (aynı ihlalden peş peşe ceza yağmaz).
- **100 ceza puanı** → ek para cezası + **30 saniye araç kilidi** (`vehicleLockSecondsLeft`),
  puan sıfırlanır.
- Risk barının ucundaki **yıldız**, ceza eşiği aşıldığında sarı yanıp söner — "polis geliyor".
- Her cezada ekranda **ceza kartı** açılır: ihlal, gerekçe, para cezası, yazılan puan ve
  ehliyetin doluluk çubuğu.

### Ses

- **Motor sesi** (`sfx.ts > updateEngineSound`): iki osilatör (temel + oktav altı) +
  alçak geçiren filtre; perde ve ses seviyesi hıza göre yumuşak rampalarla değişir.
  Araç kilitliyken/el konulmuşken susar. Dosya gerektirmez.

- Kontroller: `tsc` · `check:i18n` (681 anahtar) · `check:driving` · `check:economy` ·
  `check:grading` — hepsi yeşil.

### Bu dilimde YAPILMADI

- **Memnuniyet geri bildirimi (emoji):** dolmuşun üstünde yolcu ruh hâli emojisi ve
  memnuniyetin nedenini gösterme (hızlı sürüşten memnuniyetsizlik vb.).
- **Haftanın olayı kartı:** her gün 12:00'de açılacak büyük olay kartı. Not: Faz 7'de
  günlük şehir olayı sistemi (`cityEvent`) zaten var; bu iş onun üstüne kurulmalı,
  sıfırdan yazılmamalı.
- Ara dilim 5'ten devam eden asset işleri (aşağıda).

### Ara dilim 5'ten devreden (sıradaki iş)

- **Şehir genişletme (City Pack):** paket OBJ/FBX, oyun GLB yüklüyor. Önce dönüşüm
  (Blender/`fbx2gltf` → GLB + Draco), sonra `content/scene.ts` üzerinden yerleştirme.
  Hatlara dokunulmayacak.
- **Tren mekaniği (Modular Train Pack):** raylar + lokomotif GLB'ye çevrilecek, şehri
  dolaşan kapalı bir ray döngüsü ve `traffic.ts` benzeri bir hareket sistemi yazılacak.
- **Arka plan müziği:** telifsiz cozy bir parça **dosya olarak** gerekiyor; sentezlenen
  efektlerin aksine müzik üretilemez/indirilemez. Dosya `public/audio/` altına konunca
  bağlanacak (radyo sistemi zaten var, aynı ses zinciri kullanılabilir).
- **Karakter FBX → GLB dönüşümü:** dosya başına ~2 MB; GLB + Draco ile ~400 KB hedefi.

## Her faz için ortak bitiş kapısı

- `npx tsc --noEmit`
- `npm run check:i18n`
- `npm run check:driving`
- `npm run check:economy`
- Frontend production build
- Backend build ve ilgili testler
- TR/EN manuel senaryo
- Desktop ve mobil ana akış
- Telemetri olaylarının dashboard'a ulaşması
- Eski save migrasyon testi

## Analitik platformu genişletme backlog'u

Faz 0 dashboard'u bilinçli olarak temel seviyede bırakıldı. Core fazları oturduktan sonra aşağıdaki
analiz katmanı ayrı bir geliştirme paketi olarak büyütülecek:

- Gerçek zamanlı canlı oyuncu/oturum haritası ve aktif sürüm dağılımı
- Ülke/cihaz/tarayıcı kırılımı; ham IP saklamadan yaklaşık bölge
- Ekran, panel ve anlamlı buton bazında kullanım/terk hunileri
- Vardiya, kontrat, araç, şoför ve hat bazında kohort karşılaştırmaları
- Ekonomi kaynak/gider ledger'ı, enflasyon, servet yüzdelikleri ve anomali uyarıları
- D1/D7/D30 kohort matrisi, churn riski ve geri dönen oyuncu segmentleri
- Tutorial adımı bekleme süresi, hata noktası ve A/B varyantları
- FPS, yükleme süresi, JS/backend hata kümeleri ve sürüm regresyon alarmı
- Oyuncu zaman çizelgesi, güvenli admin aksiyon günlüğü ve rol bazlı dashboard yetkisi
- CSV/JSON dışa aktarma, zaman aralığı filtreleri ve planlı özet raporlar

## Ara dilim 7 — Kalan maddelerin tamamı (2026-08-08)

- **Yolcu ruh hâli balonu** (`content/PassengerMoodBubble.tsx`): dolmuşun üstünde emoji
  (😠/😕/🙂/😄). Memnuniyet artık sadece bir sayı değil; **hızlı sürüş** araçta yolcu varken
  memnuniyeti eritir (`satisfaction.speedingPenaltyPerSecond`) ve balon anında sinirli yüze
  dönüp zıplar — sebep görünür olur (`store > moodReason`, `tickPassengerMood`).
- **Günün olayı kartı** (`DailyEventCard.tsx`): her oyun günü **12:00**'de bir kez açılır
  (`store > tickGameTime`, `EVENT_ANNOUNCE_MINUTE`). Faz 7'nin mevcut `cityEvent`
  altyapısını kullanır — olay sıfırdan üretilmez, büyük ve okunur bir duyuruya çevrilir:
  olayın adı, şiddeti, etkilenen hat, talep/risk/ücret/memnuniyet etkileri ve (senin hattını
  vuruyorsa) "Hazırlan" butonu.
- **Arka plan müziği** (`sfx.ts > startMusic`): SENTEZLENİR, hazır parça kullanılmaz →
  telif sorunu yok. A minör pentatonik dizide yavaş, rastgele tek notalar + yumuşak akor
  pedi; uyumsuz nota üretmediği için sonsuza kadar çalar. Tarayıcı otomatik oynatmayı
  engellediği için ilk kullanıcı etkileşiminde başlar. Ayarlar → Ses'te aç/kapa + seviye.
- **Şehir genişletildi** (City Pack): `SceneProp` artık uzantıya göre GLB **/ OBJ / FBX**
  yükleyebiliyor ve `targetHeight` ile modeli otomatik ölçekliyor (paketlerin birim farkı
  böyle çözüldü, dönüştürmeye gerek kalmadı). 12 yeni bina `scene.ts > CITY_PACK_BUILDINGS`
  içinde parsel merkezlerine yerleştirildi — **hat geometrisi değişmedi**.
- **Şehir treni** (`content/CityTrain.tsx`): şehir sınırının dışında, köşeleri yumuşatılmış
  kapalı bir ray halkasında lokomotif + 3 vagon sürekli tur atıyor. Ray hiçbir yolu, durağı
  veya hattı kesmez. Ray parçaları eğri boyunca teğet döşenir.
- Kontroller: `tsc` · `check:i18n` (692 anahtar) · `check:driving` · `check:economy` ·
  `check:grading` — yeşil.
