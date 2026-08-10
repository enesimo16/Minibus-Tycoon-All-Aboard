# FullFilled 🚐

Türk mahallesinde geçen 3D **dolmuş tycoon** web oyunu. "Önce sürersin, sonra yönetirsin."

> **BAŞLAMADAN ÖNCE:** Kanonik bağlam `codex.md` — oradaki "ÖNCE BUNU OKU" bölümündeki
> 8 çalışma kuralı bağlayıcıdır. Güncel iş durumu: `docs/faz-plani.md`.
> **Yeni doküman dosyası açma**, mevcut olanları güncelle.

## Ekip ve Roller

- **Enes**: Oyun mantığı, backend, ekonomi dengesi. Bu repo ile asıl konuşan kişi.
- **Kemal**: Görsel/3D tasarımın TAMAMI (modeller, doku, UI görselleri, renk paleti).
  - **KURAL:** Görsel bir varlık gerektiren her iş ortaya çıktığında, Claude bunu net şekilde
    "**Kemal şunu yapsın:** ..." formatında, teknik spesifikasyonuyla (poly bütçesi, format,
    boyut, stil referansı) birlikte belirtmeli. Kemal'in iş listesi: `docs/kemal/gorev-listesi.md`
    — yeni görsel iş çıktıkça bu dosyaya ekle.
  - Kemal görsel hazır olana kadar kod tarafında **placeholder geometri** (kutu/kapsül, düz renk)
    kullanılır; asset takası kolay olacak şekilde kod yazılır.

## Teknoloji

- **Frontend:** Next.js (App Router, TypeScript) + Three.js via `@react-three/fiber` + `@react-three/drei`, state için `zustand`. Klasör: `frontend/`
- **Backend:** C# / .NET 9 Web API, SQLite. Klasör: `backend/FullFilled.Api/`
- Oyun simülasyonu client'ta çalışır; backend kayıt, hesap, skor ve sosyal işlerini yapar.

## Doküman Haritası (koda dokunmadan önce ilgili dokümanı oku)

| Doküman | İçerik |
|---|---|
| `docs/game-design/01-oyun-vizyonu.md` | Oyun ne, kim için, neden farklı |
| `docs/game-design/02-cekirdek-dongu.md` | Para döngüsü, aşamalar, ilerleme, **mevcut aşama durumu** |
| `docs/game-design/03-surus-mekanigi.md` | DUR/GEÇ, para üstü, doluluk, iniş talepleri, hız/polis, oyun saati |
| `docs/game-design/04-yonetim-ekonomi.md` | Şoförler, hatlar, yükseltmeler, sayısal denge |
| `docs/game-design/05-hat-disi-risk-odul.md` | Hat dışına çıkma, Dikkat Çubuğu, hız riski, kademeli polis |
| `docs/game-design/06-sosyal-link-sekme.md` | Link=şehir, korsan sefer, sekme-arası, şerit modu |
| `docs/game-design/07-hesap-giris.md` | Login (kullanıcı adı+şifre), otomatik kayıt, güvenlik |
| `docs/kemal/gorsel-rehber.md` | Kemal için stil rehberi ve teknik spesifikasyonlar |
| `docs/kemal/gorev-listesi.md` | Kemal'in güncel iş listesi |
| `docs/kemal/meshy-promptlari.md` | Meshy.ai için hazır 3D üretim promptları |
| `docs/kemal/karakterler.md` | 10 yolcu karakteri için Meshy promptları + üçgen bütçesi |
| `docs/kemal/dolmusculer.md` | 12 dolmuşçu için 2D portre spesifikasyonu |
| `docs/faz-plani.md` | **Güncelleme fazlarının durumu (yapıldı/yapılmadı)** |
| `docs/adr/` | Mimari kararlar ve gerekçeleri |

## Çalışma Kuralları

- Dil: kod ve identifier'lar İngilizce, dokümanlar ve oyun içi metinler Türkçe.
- Yeni mekanik eklenmeden önce ilgili game-design dokümanı güncellenir; kod dokümanı takip eder.
- Tüm ekonomi sabitleri (fiyat, maaş, ceza, süre) tek yerde: `shared/economy.json`
  (`economy.ts` onu okur, backend `EconomyConstants.cs` de aynı dosyadan besleniyor). Magic number yasak.
- Oyun içi metinler `i18n/tr.ts` + `i18n/en.ts`; kodda `t("anahtar")`. Metin gömme yasak.
- Yeni bildirim bileşeni yazma: `pushToast()` kullan (`toastStore.ts`).
- Yeni satın alma eklerken parayı **backend de kessin** (`Program.cs` terminal/hat/araç kalıbı).
- Mimariyi etkileyen her karar için `docs/adr/` altına yeni ADR yazılır.
- Aşama disiplini: `02-cekirdek-dongu.md` içindeki inşa sırası bağlayıcıdır.

## Frontend Dosya Haritası (anahtar dosyalar)

```
frontend/src/game/
├── store.ts              # Zustand state — tüm oyun state'i burada
├── economy.ts            # TEK ekonomi sabit kaynağı
├── route.ts              # 8 hat + geometri kaydı (getRouteLength/getStopCount/getActiveRouteStops)
├── GameCanvas.tsx        # React Three Fiber canvas + tüm 3D bileşenler
├── GameHome.tsx          # Tüm UI overlay'lerini birleştiren shell
├── TopNav.tsx            # Üst çubuk: logo, istatistikler, aksiyon butonları
├── StripBar.tsx          # Şerit modu alt çubuğu (120px kompakt)
├── DecisionHud.tsx       # DUR/GEÇ butonları (normal + şerit modu)
├── InteractionHud.tsx    # Etkileşim paneli (overflow/student/change/offroute/dropoff)
├── SpeedLimiterWidget.tsx# Anlık km/h + hız limitörü + kapı durumu
├── DrivingControls.tsx   # WASD klavye girdisi
├── driving.ts            # Sürüş fiziği (saf fonksiyonlar, npm run check:driving)
├── ToastHub.tsx          # TÜM bildirimlerin tek çıkışı (sağ alt)
├── toastStore.ts         # pushToast() — yeni alert bileşeni yazma, bunu kullan
├── telemetry.ts          # track() — olay loglama, 20 sn'de bir backend'e
├── CornerControls.tsx    # TR/EN düğmesi + geri bildirim formu
├── GaragePanel.tsx       # Garaj: araç kataloğu + canlı 3B önizleme
├── i18n/                 # t(), tr.ts, en.ts — oyun içi metinler BURADA
├── ManagementHud.tsx     # Yönetim paneli (U tuşu): yükseltmeler, şoförler, ikinci hat
├── PoliceAlert.tsx       # Polis ceza toast + araç el koyma overlay
├── AutoSave.tsx          # Otomatik kayıt/yükleme (60 sn + sekme gizlenince)
├── uiStore.ts            # UI state: stripMode, chaseMode, managementOpen
├── useTabSync.ts         # Web Locks lider seçimi + BroadcastChannel senkron
├── TabSync.tsx           # useTabSync hook'unu mount eden bileşen
├── admin.ts              # isAdminUser() — NEXT_PUBLIC_ADMIN_USERNAMES env
├── editor/
│   ├── editorStore.ts    # Editör state (props, dragging, selected)
│   ├── Editor.tsx        # Canvas içi editör (T:taşı, R:döndür)
│   ├── EditorPanel.tsx   # Editör yan paneli (obje ekle, JSON kopyala)
│   └── EditorHotkeys.tsx # E tuşu (admin only)
└── content/
    ├── scene.ts          # Sahnedeki prop tanımları (PropDef dizisi)
    ├── SceneProp.tsx      # GLB yükleyici + placeholder fallback
    ├── passengerTypes.ts  # 10 yolcu tipi (renk + modelPath)
    └── ModelErrorBoundary.tsx
```

## Kodsuz Sahne Editörü

Yeni bina/prop eklemek kod yazmayı gerektirmez: `frontend/src/game/content/scene.ts` içindeki
diziye bir kayıt eklemek yeterlidir (bkz. `PropDef` tipi). Tarayıcıda **E** tuşuyla açılan
editör panelinden objeler eklenebilir/sürüklenebilir, "JSON Kopyala" ile çıktı alınıp
`scene.ts`'e yapıştırılır. `modelPath` verilen bir obje için `.glb` dosyası
`frontend/public/models/`e düşünce placeholder otomatik gerçek modelle değişir — kod değişmez.
**Editör yalnızca admin kullanıcılara görünür** (`NEXT_PUBLIC_ADMIN_USERNAMES` env'de tanımlı).

## Sürüş Mekaniği Özeti (tam detay: `03-surus-mekanigi.md`)

- **DUR/GEÇ:** Durağa yaklaşırken 2,5 sn pencere. Şoför aktifken açılmaz.
- **Sürüş:** Şoför tutulana kadar **WASD** (W/S gaz-fren-geri, A/D direksiyon, Space el freni,
  F kapı). Şoför kiralanınca otomatiğe döner. Fizik: `driving.ts` (saf fonksiyonlar + testli).
- **Hız kontrolü:** `speedLimitKmh` yalnızca TAVANI belirler; gerçek hız 30 km/h'yi
  (`legalLimitKmh`) aşınca SpeedingRisk birikir.
- **Polis sistemi:** SpeedingRisk > 30 → yakalanma şansı. `policeLevel` 0→4: para(×2) → ehliyet askı → araç el koyma.
- **Oyun saati:** 1 gerçek sn = 2 oyun dk. Gece 22:00–06:00 → polis çarpanı 2,2×.
- **Etkileşimler:** overflow / student / change / offroute / dropoffStop / dropoffRoadside.
- **İniş talepleri:** Durakta söz verince `stopDropoffPromised = true`; GEÇ seçilirse -12 memnuniyet.
- **Hat dışı:** %15 ihtimal, 9 sn detour, Dikkat Çubuğu, tek seferlik denetim şansı.

## Login (`docs/game-design/07-hesap-giris.md`)

`POST /api/auth/login { username, password }` — yoksa otomatik kayıt (yeni `playerId` + PBKDF2
hashlenmiş şifre), varsa şifre doğrulanır. Frontend: `LoginGate.tsx` tüm sayfaları sarar —
`playerId` bulununca tekrar sormaz. Şifreler asla düz metin.

## Backend API (mevcut uçlar)

SQLite üzerinde save/load. Ekonomi doğrulaması `EconomyConstants.cs`'te — frontend `economy.ts`
ile **senkron tutulmalı** (bilinçli borç, ADR-002).

| Uç | Açıklama |
|---|---|
| `POST /api/auth/login` | Kayıt veya şifre doğrulama |
| `GET /api/saves/{playerId}` | Kayıtlı durum (yükseltmeler + şoför). Çevrimdışı gelir hesaplar (8 saat tavan). |
| `PUT /api/saves/{playerId}` | Kaydet; mantık kontrolüyle kırpar (`clamped: true`) |
| `POST /api/saves/{playerId}/reset` | Oyunu sıfırla: hesap kalır, ilerlemenin tamamı silinir (Ayarlar → Tehlikeli bölge) |

Frontend: `AutoSave.tsx` — açılışta yükler, 60 sn + sekme gizlenince kaydeder.
Backend adresi: `NEXT_PUBLIC_API_BASE_URL` — `frontend/.env.local`'de tanımlanır
(şablon: `frontend/.env.example`). Bu makinede backend **5000** portunda çalışıyor.

## Yükseltmeler ve Dolmuşçu Roster'ı

`store.ts`'teki `upgrades` state'i: motor (5 seviye, +%15/sev hız) / koltuk (10→20) / ses /
yazarkasa. **U** tuşu yönetim panelini açar.

**12 dolmuşçu** (`economy.ts → drivers`): hız çarpanı × verim × maaş payı üçgeni. Şoför
aktifken (`driverActive`): DUR/GEÇ penceresi açılmaz, mini-etkileşimler yok, hız × şoförün
hız çarpanı. Portreler: `frontend/public/drivers/{id}.png` — yoksa emoji placeholder.

## Hat Dışı Risk + İkinci Hat (Aşama 3)

Hat dışı: durak sonrası %15 ihtimal → KABUL/RET → detour animasyonu → Dikkat Çubuğu → kazanç
→ denetim. Tam detay: `05-hat-disi-risk-odul.md`.

İkinci hat (`secondLine` state): sayısal/pasif gelir, backend persist. 3D görsel Kemal'in
şehriyle gelecek.

## Sekme-Arası Senkron + Şerit Modu (Aşama 4)

`useTabSync.ts`: Web Locks API → lider sekme seçilir. Lider simülasyonu çalıştırır, 150ms'de
`BroadcastChannel` ile yayınlar. İzleyici sekmeler: kendi simülasyonu yok ama
`dispatchGameAction(actionName, ...args)` ile lidere girdi gönderebilir (tüm HUD butonları
bunu kullanır).

**Şerit modu (`uiStore.ts → stripMode`):** M tuşu (S artık sürüşte fren/geri). Yönetim/editör paneli kapanır.
- `GameCanvas`: kamera `ChaseCam` üzerinden 120px şeride uygun alçak açılı konuma geçer.
- `TopNav`: gizlenir.
- `StripBar.tsx`: 44px alt çubuk — para, yolcu, memnuniyet, saat, hız kontrolü, çıkış butonu.
- `DecisionHud`: `bottom-11` konumunda kompakt DUR/GEÇ.
- `InteractionHud`: `bottom-11` konumunda tek satır + küçük butonlar.
- `PoliceAlert`: tam overlay yerine üst banner; araç el koyma için mini kart.
- `SpeedLimiterWidget`: gizlenir (StripBar'a taşınır).

**Dikkat:** Windows'ta case-insensitive dosya sistemi — `tabSync.ts`/`TabSync.tsx` çakışır.
Hook dosyaları `useXyz.ts`, bileşenler `Xyz.tsx` adlandırmasıyla ayrılır.

## Admin Sistemi

`frontend/src/game/admin.ts` → `isAdminUser(username)`: `NEXT_PUBLIC_ADMIN_USERNAMES` env
(virgülle ayrılmış, küçük harf karşılaştırması). Dosya: `frontend/.env.local`.
Editör butonu TopNav'da yalnızca admin kullanıcılara görünür. E tuşu EditorHotkeys'te
aynı kontrolü yapar. **UI-only guard — sunucu tarafında ek doğrulama yok.**

## Performans Mimarisi (GameCanvas.tsx)

3D render optimizasyonları (2026-07):

- **InstancedMesh:** Durak tabelaları (4 → 1 draw call) + yolcular (64 → 1 draw call).
  Shadow pass dahil draw call azaltması: ~%97.
- **useFrame imperativo güncellemesi:** `WaitingPassengersInstanced` React'ı atlayarak doğrudan
  GPU'ya yazar; yalnızca kuyruk sayısı değiştiğinde (~dakikada 10-15 kez, saniyede 60 değil).
- **Per-instance renk:** `setColorAt` + `vertexColors` ile tek draw call'da 10 farklı renk.
- **Pre-allocated refs:** `FollowerBus.targetPos`, `ChaseCam.targetPos/currentPos` — sıfır
  per-frame allocation.
- **Module-level pre-compute:** `STOP_POSITIONS`, `SLOT_COLORS`, `HIDE_MATRIX` — mount'ta değil,
  yükleme sırasında bir kez hesaplanır.
- **Canvas ayarları:** `dpr=[1,1.5]` (2x ekranda %44 daha az piksel), `powerPreference=
  "high-performance"` (çift GPU'lu cihazlarda güçlü GPU), shadow frustum rota sınırlarına sıkıştırıldı.
- **`React.memo`:** `Ground`, `BusStopsInstanced`, `Neighborhood` — editör değişikliği olmadan re-render yok.

## Komutlar

```bash
# Frontend
cd frontend && npm run dev           # http://localhost:3000

# Backend
cd backend/FullFilled.Api && dotnet run --urls http://localhost:5000

# Commit öncesi DÖRT kontrol
cd frontend && npx tsc --noEmit
cd frontend && npm run check:i18n      # TR/EN sözlük eşitliği + replik havuzu
cd frontend && npm run check:driving   # sürüş fiziği davranış testleri
cd frontend && npm run check:economy   # frontend/backend fiyat senkronu
```
