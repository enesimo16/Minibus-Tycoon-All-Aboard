# FullFilled 🚐

> Codex için kanonik proje bağlamı: `codex.md`. Yeni bir sohbette veya işe başlamadan önce
> önce `codex.md`, sonra ilgili `docs/game-design/*`, `docs/adr/*` ve Kemal dokümanları okunur.
>
> **BAŞLAMADAN ÖNCE:** Kanonik bağlam `codex.md` — oradaki "ÖNCE BUNU OKU" bölümündeki
> 8 çalışma kuralı bağlayıcıdır. Güncel iş durumu: `docs/faz-plani.md`.
> **Yeni doküman dosyası açma**, mevcut olanları güncelle.

Türk mahallesinde geçen 3D **dolmuş tycoon** web oyunu. "Önce sürersin, sonra yönetirsin."

## Ekip ve Roller

- **Enes**: Oyun mantığı, backend, ekonomi dengesi. Bu repo ile asıl konuşan kişi.
- **Kemal**: Görsel/3D tasarımın TAMAMI (modeller, doku, UI görselleri, renk paleti).
  - **KURAL:** Görsel bir varlık gerektiren her iş ortaya çıktığında, Codex bunu net şekilde
    "**Kemal şunu yapsın:** ..." formatında, teknik spesifikasyonuyla (poly bütçesi, format,
    boyut, stil referansı) birlikte belirtmeli. Kemal'in iş listesi: `docs/kemal/gorev-listesi.md`
    — yeni görsel iş çıktıkça bu dosyaya ekle.
  - Kemal görsel hazır olana kadar kod tarafında **placeholder geometri** (kutu/kapsül, düz renk)
    kullanılır; asset takası kolay olacak şekilde kod yazılır.

## Teknoloji

- **Frontend:** Next.js (App Router, TypeScript) + Three.js via `@react-three/fiber` + `@react-three/drei`, state için `zustand`. Klasör: `frontend/`
- **Backend:** C# / .NET 9 Web API. Klasör: `backend/FullFilled.Api/`
- Oyun simülasyonu client'ta çalışır; backend kayıt, hesap, skor ve sosyal (link/korsan sefer) işlerini yapar. Detay: `docs/adr/`

## Doküman Haritası (koda dokunmadan önce ilgili dokümanı oku)

| Doküman | İçerik |
|---|---|
| `docs/game-design/01-oyun-vizyonu.md` | Oyun ne, kim için, neden farklı |
| `docs/game-design/02-cekirdek-dongu.md` | Para döngüsü, aşamalar, ilerleme |
| `docs/game-design/03-surus-mekanigi.md` | DUR/GEÇ, para üstü, doluluk riski |
| `docs/game-design/04-yonetim-ekonomi.md` | Şoförler, hatlar, yükseltmeler, sayısal denge |
| `docs/game-design/05-hat-disi-risk-odul.md` | Hat dışına çıkma, yakalanma, ceza sistemi |
| `docs/game-design/06-sosyal-link-sekme.md` | Link=şehir, korsan sefer, sekme-arası, şerit modu |
| `docs/game-design/07-hesap-giris.md` | Login (kullanıcı adı+şifre), otomatik kayıt, güvenlik |
| `docs/kemal/gorsel-rehber.md` | Kemal için stil rehberi ve teknik spesifikasyonlar |
| `docs/kemal/gorev-listesi.md` | Kemal'in güncel iş listesi |
| `docs/kemal/meshy-promptlari.md` | Meshy.ai için hazır 3D üretim promptları (dolmuş, mahalle kiti) |
| `docs/kemal/karakterler.md` | 10 yolcu karakteri için Meshy promptları + üçgen bütçesi |
| `docs/kemal/dolmusculer.md` | 12 dolmuşçu için 2D portre spesifikasyonu |
| `docs/adr/` | Mimari kararlar ve gerekçeleri |

## Kodsuz Sahne Editörü

Yeni bina/prop eklemek kod yazmayı gerektirmez: `frontend/src/game/content/scene.ts` içindeki
diziye bir kayıt eklemek yeterlidir (bkz. `PropDef` tipi). Tarayıcıda **E** tuşuna basınca açılan
editör panelinden objeler eklenebilir/sürüklenebilir (T: taşı, R: döndür), "JSON Kopyala" ile
çıktı alınıp `scene.ts`'e yapıştırılır. `modelPath` verilen bir obje için `.glb` dosyası
`frontend/public/models/`e düşünce placeholder otomatik gerçek modelle değişir — kod değişmez.

## Çalışma Kuralları

- Dil: kod ve identifier'lar İngilizce, dokümanlar ve oyun içi metinler Türkçe.
- Yeni bir mekanik eklenmeden önce ilgili game-design dokümanı güncellenir; kod dokümanı takip eder.
- Ekonomiyle ilgili tüm sabitler (fiyat, maaş, ceza) tek yerde tutulur: `shared/economy.json`. Frontend `economy.ts` bu JSON'u re-export eder; backend `EconomyConstants.cs` aynı JSON'u okur. Magic number yasak.
- Mimariyi etkileyen her karar için `docs/adr/` altına yeni ADR yazılır.
- Aşama disiplini: `02-cekirdek-dongu.md` içindeki inşa sırası bağlayıcıdır — Aşama 1 bitmeden Aşama 3 özelliğine başlanmaz.

## Login (bkz. `docs/game-design/07-hesap-giris.md`)

`POST /api/auth/login { username, password }` — kullanıcı adı yoksa otomatik kayıt (yeni
`playerId` + PBKDF2 hashlenmiş şifre), varsa şifre doğrulanır. Frontend: `LoginGate.tsx`
(`AppShell.tsx` üzerinden `layout.tsx`'e bağlı, tüm sayfaları sarar) — `playerId` bulununca
tekrar sormaz. `playerId` artık rastgele üretilmiyor, sadece login yanıtından geliyor
(`playerId.ts`). Şifreler asla düz metin — `PasswordHasher.cs`.

## Backend API (mevcut uçlar)

SQLite üzerinde save/load. Ekonomi doğrulaması `EconomyConstants.cs`'te; değerler
`shared/economy.json` içinden gelir, frontend ile aynı kaynağı kullanır.

| Uç | Açıklama |
|---|---|
| `POST /api/auth/login` | Kullanıcı adı yoksa kayıt, varsa şifre doğrulama — bkz. yukarısı |
| `GET /api/saves/{playerId}` | Kayıtlı durumu döner (yükseltmeler, şoför dahil), yoksa 404. Şoför varsa geçen süreye göre çevrimdışı gelir ekler (`offlineIncome`, 8 saat tavanlı). |
| `PUT /api/saves/{playerId}` | Durumu kaydeder; geçen süreye göre mümkün olmayan para artışını kırpar (`clamped: true`) |

Frontend tarafı `frontend/src/game/AutoSave.tsx`: açılışta yükler, 60 sn'de bir ve sekme gizlenince
otomatik kaydeder (`ECONOMY.save.autosaveIntervalSeconds`). Backend adresi
`NEXT_PUBLIC_API_BASE_URL` ile ezilebilir, varsayılan `http://localhost:5080`.

## Yükseltmeler ve Dolmuşçu Roster'ı

`frontend/src/game/store.ts`'teki `upgrades` state'i (motor/koltuk/ses/yazarkasa — dolmuşun
kendi yükseltmeleri, tek dolmuş modeli üstünde çalışır) + `hiredDriverId`/`driverActive`.
**U** tuşu yönetim panelini açar.

**Dolmuşçu roster'ı** (`shared/economy.json` → `drivers` dizisi, 12 karakter, bkz.
`docs/kemal/dolmusculer.md`): her dolmuşçunun kendi **hız çarpanı**, **verim** ve **maaş payı**
oranı var — "hızlı ama pahalı/düşük verimli" (örn. Hasan "Fırtına") ↔ "yavaş ama ucuz/güvenilir"
(örn. Fatma "Tedbirli") arasında tasarlanmış bir yelpaze. Şoför aktifken (`driverActive`):
DUR/GEÇ penceresi hiç açılmaz (risk almaz), mini-etkileşimler tetiklenmez, kazanç
`dolmuşçunun verimi × (1 - maaş payı)` ile, hız `dolmuşçunun hız çarpanı × motor yükseltmesi`
ile çarpılır (bkz. `GameCanvas.tsx` `LeaderBus`). Portreler `frontend/public/drivers/{id}.png`
— dosya yoksa emoji placeholder'a düşer (`ManagementHud.tsx` → `DriverPortrait`).

Not: "Dolmuş ve hat satın alma" — dolmuş yükseltmeleri zaten var (yukarıda); **birden fazla
farklı dolmuş modeli** (büyük otobüs vb.) ve bunların ayrı satın alınması henüz yok, Kemal'in
şehir/araç modelleri geldikçe eklenecek (bkz. konuşma geçmişi — backlog).

## Hat Dışı Risk + İkinci Hat (Aşama 3)

`store.ts`: durak sonrası %15 ihtimalle "hat dışı" teklifi çıkar (`interaction.type === "offroute"`),
KABUL edilirse dolmuş `GameCanvas.tsx`'te küçük bir yan-tur (detour) animasyonuyla ana hattan ayrılır;
bu sürede **Dikkat Çubuğu** (`attention`, 0-100) dolar. Detour bitince kazanç (₺17,5 × 2-4 kat)
eklenir, sonra tek seferlik denetim şansı (yakalanma ihtimali = çubuk doluluğu × 0,6) uygulanır;
yakalanırsa kazancın 2 katı ceza. Şoför modundayken bu teklif hiç çıkmaz (risk almaz).

İkinci hat (`secondLine` state): açılış + kendi şoförü sayısal bir pasif gelir akışı. **Görsel/3D
karşılığı henüz yok** — gerçek ikinci mahalle Kemal'in şehri entegre olunca gelecek. Artık
backend'e persist ediliyor (`HiredDriverId`, `SecondLineUnlocked`, `SecondLineHasDriver` — bkz.
`GameSave.cs`).

## Sekme-Arası Senkron + Şerit Modu (Aşama 4)

`useTabSync.ts`: Web Locks API ile **tek lider sekme** seçilir (`useLeaderElection`), lider
gerçek simülasyonu çalıştırır, periyodik olarak (`BroadcastChannel`, 150ms) durumunu yayınlar
(`useStateBroadcast`) — artık `decision`/`interaction` de yayına dahil. İzleyici sekmeler bu
yayını uygulayıp render eder; **kendi simülasyonunu çalıştırmaz** ama artık **girdi gönderebilir**:
`dispatchGameAction(actionName, ...args)` — lider sekmede doğrudan çağırır, izleyicide lidere
mesaj yollar (bkz. `DecisionHud`/`InteractionHud`/`ManagementHud`'daki tüm buton çağrıları).
2 gerçek sekmede test edildi (durum senkronu para/memnuniyet bire bir eşleşti; roster/panel
render'ı da doğrulandı — girdi yönlendirmenin uçtan uca canlı testi bu turda para birikimi
sandbox'ta gerçekleşmediği için tamamlanamadı, mantık aynı kanıtlanmış BroadcastChannel akışını
kullanıyor).

Bilinçli sadeleştirme: dolmuşun fiziksel "sağdan çık/soldan gir" sekmeler-arası geçiş animasyonu
henüz yok — bu, gerçek ikinci mahalle (şehir entegrasyonu) gelince anlamlı olacak (bkz. ADR-004
"Uygulama durumu").

**Dikkat:** `tabSync.ts`/`TabSync.tsx` gibi sadece büyük/küçük harfle ayrılan dosya adları
Windows'ta çakışır (case-insensitive FS) — hooks dosyaları `useXyz.ts`, bileşenler `Xyz.tsx`
şeklinde farklı köklerle adlandırılmalı.

Şerit modu (`uiStore.ts`'teki `stripMode`): **S** tuşu, ekranı 120px'lik alt şeride küçültür
(`GameCanvas.tsx` kamerayı da kompakt ayarlara geçirir), simülasyon arka planda çalışmaya devam
eder. Editör/yönetim panelleri şeride geçerken otomatik kapanır.

## Komutlar

- Frontend dev: `cd frontend && npm run dev`
- Backend dev: `cd backend/FullFilled.Api && dotnet run` (varsayılan `http://localhost:5080` gibi bir port — `launchSettings.json`'a bakın)
