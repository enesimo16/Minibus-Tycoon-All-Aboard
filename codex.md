# FullFilled — Kapsamlı AI Asistan Başvuru Kılavuzu

> Bu dosya herhangi bir AI asistanın projeye hızlıca adapte olması için tasarlanmıştır.
> AGENTS.md, CLAUDE.md ve tüm game-design dokümanlarının güncel özetini içerir.
> Son güncelleme: 2026-07-30

---

## ÖNCE BUNU OKU — Devam Eden Geliştirme

**Faz 0–4 tamamlandı, Faz 5–7 sırada.** Ne yapıldı / ne kalmadı: **`docs/faz-plani.md`**.

### Bu repoda çalışma kuralları (bozmadan devam etmek için)

1. **Yeni doküman dosyası açma.** Durum takibi `docs/faz-plani.md`, kanonik bağlam bu dosya
   (`codex.md`). "notlar.md", "todo.md", "plan2.md" gibi dosyalar AÇILMAZ; mevcut olan güncellenir.
2. **Sayı gömme (magic number yasak).** Tüm denge/fiyat/süre değerleri `shared/economy.json`'da.
   Kod oradan okur. Fiyat eklersen backend `EconomyConstants.cs`'e de ekle ve
   `npm run check:economy` ile doğrula.
3. **Metin gömme yok.** Oyun içi her metin `i18n/tr.ts` + `i18n/en.ts`'te; kodda `t("anahtar")`.
   `npm run check:i18n` iki sözlük ayrışırsa hata verir.
4. **Bildirim tek yerden.** Yeni bir toast/alert bileşeni YAZMA — `pushToast()` kullan
   (`toastStore.ts`). Tüm bildirimler sağ altta tek yığında akar.
5. **Para her zaman sunucuda kesilir.** Yeni bir satın alma eklerken frontend'de düşmek
   YETMEZ; `Program.cs`'teki terminal/hat/araç kalıbını kopyala (sunucu önceki bakiyeden
   tahsil eder, liste küçültülemez). Aksi halde konsoldan bedava alınır.
6. **Sürüş fiziğine dokunacaksan** `driving.ts`'teki saf fonksiyonları değiştir ve
   `npm run check:driving` çalıştır — 24 davranış testi var.
7. **Yeni tuş atamadan önce** aşağıdaki "Klavye Kısayolları" tablosuna bak. Şu ana kadar
   iki kez çakışma yaşandı (S ve T); tablo dışına çıkma.
8. **Commit öncesi dört kontrol:**
   `npx tsc --noEmit` · `npm run check:i18n` · `npm run check:driving` · `npm run check:economy`

### Faz 0–4'te eklenen modüller

| Dosya | Ne işe yarar |
|---|---|
| `src/game/i18n/` | `t()`, `useT()`, TR/EN sözlükleri |
| `src/game/toastStore.ts` + `ToastHub.tsx` | Tüm bildirimlerin tek çıkışı (sağ alt) |
| `src/game/telemetry.ts` | `track()` — olaylar 20 sn'de bir backend'e batch gider |
| `src/game/CornerControls.tsx` | TR/EN düğmesi + geri bildirim formu |
| `src/game/driving.ts` | WASD fiziği: ivme, direksiyon, şerit, trafik kırpma (SAF fonksiyonlar) |
| `src/game/DrivingControls.tsx` | Klavye → sürüş girdisi |
| `src/game/SpeedLimiterWidget.tsx` | Anlık km/h + hız limitörü + kapı durumu |
| `src/game/content/passengerLines.ts` | 30 yolcu repliği (i18n anahtarı olarak) |
| `src/game/content/busCatalog.ts` | 5 dolmuş (3 hurda + midibüs + premium) |
| `src/game/GaragePanel.tsx` | Garajda canlı 3B araç önizlemesi |
| `src/game/content/groundAlign.ts` | Modelleri kendi tabanından yere oturtur |

---

## Proje Özeti

**FullFilled**, Türk mahallesinde geçen browser tabanlı 3D **dolmuş tycoon** oyunudur.
Slogan: "Önce sürersin, sonra yönetirsin."

Oynanış akışı:
1. Oyuncu tek dolmuşu kendi sürer (DUR/GEÇ kararları, etkileşimler, hız riski)
2. Para biriktirince dolmuşçu kiralar → idle gelir
3. Yeni hatlar açar → sekme-arası mahalleler
4. Arkadaş şehirlerine korsan sefer, misilleme meta-oyunu

---

## Ekip ve Roller

- **Enes Yel**: Oyun mantığı, backend, ekonomi dengesi — Codex ile konuşan kişi.
- **Kemal**: Görsel/3D tasarımın TAMAMI (modeller, doku, UI görselleri, renk paleti).
  - **KURAL:** Görsel bir varlık gerektiren her iş ortaya çıktığında, Codex bunu net şekilde
    **"Kemal şunu yapsın: ..."** formatında, teknik spesifikasyonuyla (poly bütçesi, format,
    boyut, stil referansı) birlikte belirtmeli. Kemal'in iş listesi: `docs/kemal/gorev-listesi.md`
    — yeni görsel iş çıktıkça bu dosyaya K## formatında ekle.
  - Kemal görsel hazır olana kadar kod tarafında **placeholder geometri** (kutu/kapsül, düz renk)
    kullanılır; asset takası kolay olacak şekilde kod yazılır.

---

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Frontend | Next.js 15 (App Router, TypeScript) |
| 3D Render | React Three Fiber (`@react-three/fiber`) + `@react-three/drei` |
| State | Zustand |
| Backend | C# / .NET 9 Web API, SQLite, PBKDF2 |
| Tab Sync | Web Locks API (lider seçimi) + BroadcastChannel (150ms yayın) |

```
plane-surfers/
├── frontend/               # Next.js oyun istemcisi
│   ├── src/game/           # Tüm oyun kodu burada
│   ├── public/models/      # .glb dosyaları (Kemal teslim edince)
│   └── public/drivers/     # Şoför portreleri ({id}.png)
├── backend/FullFilled.Api/ # .NET Web API
└── docs/                   # Tasarım belgeleri
```

---

## Doküman Haritası

Koda dokunmadan önce ilgili dokümanı oku:

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
| `docs/adr/` | Mimari kararlar ve gerekçeleri |

---

## Çalışma Kuralları

1. Dil: **kod ve identifier'lar İngilizce**, dokümanlar ve oyun içi metinler Türkçe.
2. Yeni mekanik eklenmeden önce ilgili game-design dokümanı güncellenir; kod dokümanı takip eder.
3. Tüm ekonomi sabitleri (fiyat, maaş, ceza, süre) tek yerde: `shared/economy.json`. Frontend `economy.ts` bu JSON'u re-export eder; backend `EconomyConstants.cs` aynı JSON'u okur. **Magic number yasak.**
4. Mimariyi etkileyen her karar için `docs/adr/` altına yeni ADR yazılır.
5. Aşama disiplini: `02-cekirdek-dongu.md` içindeki inşa sırası bağlayıcıdır — aşama bitmeden sonrakine başlanmaz.
6. Yeni etkileşim tipi → `InteractionType` union'ına ekle, `store.ts`'teki handler, `InteractionHud.tsx`'teki UI ve `useTabSync.ts`'teki payload birlikte güncellenir.
7. **Kemal'in modeli için iş** → `docs/kemal/gorev-listesi.md` — K## formatında, teknik spec (poly bütçesi, format, boyut) ile ekle.
8. **`dispatchGameAction` kullan** — HUD butonlarında doğrudan store action'ı çağırma; izleyici sekme desteği için zorunlu.
9. **Şerit modu farkındalığı:** HUD bileşenleri `useUiStore((s) => s.stripMode)` ile konumlarını ayarlar.
10. **Windows case-insensitive FS:** `tabSync.ts` ile `TabSync.tsx` çakışır — hook dosyaları `useXyz.ts`, bileşenler `Xyz.tsx` şeklinde farklı köklerle adlandırılmalı.
11. **Admin guard:** Editör görünürlüğü `isAdminUser(username)` ile — UI-only, sunucu tarafında ek doğrulama yok.
12. **Per-frame allocation yasak:** `useFrame` içinde `new THREE.Vector3()` gibi allocation'dan kaçın; `useRef` ile pre-allocate et.

---

## Frontend Kritik Dosyalar

### State ve Ekonomi
| Dosya | Rol |
|---|---|
| `src/game/store.ts` | **TEK zustand store** — tüm oyun state'i ve action'ları |
| `src/game/economy.ts` | `shared/economy.json` re-export'u — oyun kodu ekonomi değerlerini buradan alır |
| `src/game/uiStore.ts` | UI state: `stripMode`, `chaseMode`, `managementOpen` |
| `src/game/route.ts` | Kemal şehir GLB'sindeki yol akslarına bağlı polyline hat; 11 durak + gelecekteki yolcu spawn slotları |

### 3D Canvas
| Dosya | Rol |
|---|---|
| `src/game/GameCanvas.tsx` | R3F Canvas + tüm 3D bileşenler. **Performans kritik.** |
| `src/game/content/scene.ts` | Sahne prop tanımları (`PropDef[]`) — kod yazmadan editlenebilir |
| `src/game/content/passengerTypes.ts` | 10 yolcu tipi (renk + modelPath) |
| `src/game/content/BusModel.tsx` | `bus1.glb` temel araç, `bus2.glb`/`bus3.glb` upgrade görselleri; tek şeride sığacak ölçek normalizasyonu |
| `src/game/content/SceneProp.tsx` | GLB yükleyici + placeholder fallback |
| `src/game/content/ModelErrorBoundary.tsx` | GLB yükleme hatalarını yakalar |

### UI Overlay'leri (GameHome.tsx bağlar)
| Dosya | Rol |
|---|---|
| `src/game/GameHome.tsx` | Tüm UI overlay'lerini birleştiren shell bileşeni |
| `src/game/TopNav.tsx` | Üst çubuk — para, yolcu, memnuniyet, saat, butonlar. Şerit modunda gizlenir. |
| `src/game/StripBar.tsx` | Şerit modu 44px alt çubuğu — stats + hız kontrolü + çıkış butonu |
| `src/game/DecisionHud.tsx` | DUR/GEÇ — normal: `bottom-24`, şerit: `bottom-11` kompakt |
| `src/game/InteractionHud.tsx` | 6 etkileşim tipi — şerit modunda tek satır kompakt versiyon |
| `src/game/SpeedLimiterWidget.tsx` | Anlık km/h + hız limitörü + kapı durumu (eski SpeedHud silindi) |
| `src/game/ManagementHud.tsx` | Yönetim paneli (U) — yükseltmeler, dolmuşçular, ikinci hat |
| `src/game/PoliceAlert.tsx` | Polis toast + araç el koyma overlay — şerit modunda üst banner |
| `src/game/OfflineIncomeToast.tsx` | "Sen yokken" idle gelir bildirimi |

### Tab Sync ve Kayıt
| Dosya | Rol |
|---|---|
| `src/game/useTabSync.ts` | Web Locks lider + BroadcastChannel yayın/dinleme. `dispatchGameAction` burada. |
| `src/game/TabSync.tsx` | useTabSync mount eden bileşen |
| `src/game/AutoSave.tsx` | 60 sn + sekme gizlenince backend'e kayıt/yükleme |
| `src/game/admin.ts` | `isAdminUser()` — `NEXT_PUBLIC_ADMIN_USERNAMES` env |
| `src/game/ManagementHotkeys.tsx` | U tuşu |
| `src/game/StripModeHotkeys.tsx` | M tuşu |

### Hotkey bileşenleri
| Dosya | Rol |
|---|---|
| `src/game/editor/EditorHotkeys.tsx` | E tuşu (admin kontrolü içerir) |

### Auth
| Dosya | Rol |
|---|---|
| `src/game/LoginGate.tsx` | Tüm sayfaları saran login bileşeni (`playerId` bulununca tekrar sormaz) |
| `src/game/AppShell.tsx` | `layout.tsx`'e bağlı, LoginGate'i içerir |
| `src/game/playerId.ts` | `playerId` okuma/yazma — artık sadece login yanıtından gelir, rastgele üretilmez |

---

## Kodsuz Sahne Editörü

Yeni bina/prop eklemek kod yazmayı gerektirmez:
1. `frontend/src/game/content/scene.ts` içindeki `PropDef[]` dizisine yeni kayıt ekle.
2. Tarayıcıda **E** tuşuyla editör panelini aç (yalnızca admin kullanıcılara görünür).
3. Objeler eklenebilir/sürüklenebilir (**T**: taşı, **R**: döndür).
4. "JSON Kopyala" ile çıktı alınıp `scene.ts`'e yapıştırılır.
5. `modelPath` verilen obje için `.glb` dosyası `frontend/public/models/`e düşünce placeholder
   otomatik gerçek modelle değişir — **kod değişmez.**

Admin: `frontend/.env.local` → `NEXT_PUBLIC_ADMIN_USERNAMES=enes,kemal`

---

## Store State Özeti (`store.ts`)

```typescript
// Para ve dolmuş
money: number
passengersOnBoard: number
seatCapacity: number        // upgrades.seat seviyesiyle değişir (10/14/17/20)
satisfaction: number        // 0-100, sürekli talep çarpanı (0.5x–1.5x)
speedMultiplier: number     // motor upgrade etkisi

// Oyuncu kontrolü
speedLimitKmh: number           // hız TAVANI (km/h), +/- ile ayarlanır
currentSpeedKmh: number         // anlık gerçek hız, GameCanvas her karede yazar
driving: DrivingInput           // WASD girdisi: throttle/steer/handbrake/doorsOpen
speedingRisk: number            // 0-100, limit üstünde birikir
policeLevel: number             // 0-4 (0:temiz, 3:ehliyet askı, 4:araç el koyma)
suspensionMinutesLeft: number   // ehliyet askı kalan süre (oyun dk)
policeAlert: { message: string, level: number } | null

// Oyun saati
gameTimeMinutes: number     // başlangıç: 8*60 (08:00)
gameDay: number             // başlangıç: 1

// DUR/GEÇ kararı
decision: { open: boolean, secondsLeft: number, lastChoice: "DUR"|"GEC"|null }

// Etkileşim (bir anda max bir aktif)
interaction: {
  type: "overflow"|"student"|"change"|"offroute"|"dropoffStop"|"dropoffRoadside"|null
  secondsLeft: number
  billAmount?: number       // change için
  changeOptions?: number[]  // change için
}

// İniş talepleri
stopDropoffPromised: boolean    // durakta iniş sözü verildi → GEÇ seçilirse -12 memnuniyet
roadsidePendingDelay: number    // müsait iniş tetiklenecek gecikme sayacı (sn)
roadsidePauseLeft: number       // kabul sonrası duraklama süresi (sn)

// Hat dışı
attention: number               // 0-100 Dikkat Çubuğu
detourActive: boolean
detourSecondsLeft: number

// Şoför
hiredDriverId: string | null
driverActive: boolean
// getActiveDriver(): DriverDef | undefined — economy.ts drivers listesinden bulur

// Sekme senkronu
isLeader: boolean
busProgress: number             // 0-1, hat üzerindeki konum

// Yükseltmeler
upgrades: {
  motorLevel: number        // 0-5, her seviye +%15 hız
  seatLevel: number         // 0-3, kapasite 10→14→17→20
  soundLevel: number        // 0-3, pasif memnuniyet artışı
  hasCashRegister: boolean  // para üstü mini-oyunu otomatikleştirir
}

// Kuyruklar
stopsWaiting: number[]      // her duraktaki bekleyen yolcu sayısı (float, max 16)

// İkinci hat
secondLineUnlocked: boolean
secondLineHasDriver: boolean

// Sound
soundAccumulator: number
```

### Kritik Action'lar
```typescript
// Unified dispatcher — HER yerden bu kullanılır
dispatchGameAction(name: string, ...args: unknown[]): void
// Lider sekmede doğrudan çağırır, izleyicide BroadcastChannel ile lidere yönlendirir.

// Karar
openDecision()
chooseDecision("DUR" | "GEC")
autoChooseDur()               // şoför modunda otomatik DUR

// Etkileşimler
resolveOverflow(accept: boolean)
resolveStudent(accept: boolean)
resolveChange(amount: number)
resolveOffRoute(accept: boolean)
resolveDropoffStop(accept: boolean)
resolveDropoffRoadside(accept: boolean)

// Hız ve polis
increaseSpeed()
decreaseSpeed()
buyNewVehicle()               // policeLevel 4 → 2, ₺3000 kesilir
dismissPoliceAlert()

// Frame tick'leri (GameCanvas.tsx'ten çağrılır)
growStopQueues(delta: number)
applySoundSystem(delta: number)
tickDecision(delta: number)
tickInteraction(delta: number)
tickDetour(delta: number)
tickSecondLine(delta: number)
tickGameTime(delta: number)
tickSpeedRisk(delta: number)
tickRoadsideDelay(delta: number)
tickRoadsidePause(delta: number)
resolveArrivalAtStop(stopIndex: number): "DUR" | "GEC"
setBusProgress(progress: number)

// Yardımcılar
formatGameTime(gameTimeMinutes: number): string  // "08:00" formatı
isNightTime(gameTimeMinutes: number): boolean     // 22:00-06:00
```

---

## Ekonomi Sabitleri (`shared/economy.json`)

Tüm sayısal değerler buradan gelir. Magic number yasak. Önemli değerler:

```typescript
fare:      { full: 17.5, student: 12, tipMin: 5, tipMax: 25 }
bus:       { baseSeatCapacity: 10, baseSpeedMetersPerSec: 8 }
upgrades:  {
  motorCosts: [150, 400, 900, 1800, 3500],  // 5 seviye
  motorSpeedBonusPerLevel: 0.15,
  seatCosts: [300, 700, 1400],              // 3 seviye
  seatCapacityLevels: [10, 14, 17, 20],
  soundCosts: [200, 500, 1000],
  soundSatisfactionPerSecondPerLevel: 0.03,
  cashRegisterCost: 350,
}
decision:  { leadMeters: 10, windowSeconds: 2.5, geciSpeedMultiplier: 1.3 }
stopQueue: { growthPerSecond: 0.15, maxWaiting: 16 }
satisfaction: {
  initial: 60,
  demandMultiplierAtZero: 0.5,
  demandMultiplierAtHundred: 1.5,
  changeCorrectBonus: 4, changeWrongPenalty: 5,
  studentAcceptBonus: 3, studentRejectPenalty: 1,
  overflowPenalty: 3,
}
offRoute:  { offerChance: 0.15, offerWindowSeconds: 3, detourSeconds: 9,
             fareMultiplierMin: 2, fareMultiplierMax: 4,
             attentionGainPerSecond: 9, attentionDecaySeconds: 4,
             catchChanceAtFullAttention: 0.6, firstCatchPenaltyMultiplier: 2 }
speed:     { min: 0.5, max: 1.8, step: 0.1, limit: 1.0,
             riskGainPerSecond: 8, riskDecayPerSecond: 5 }
police:    { catchRiskThreshold: 30, maxCatchChancePerSecond: 0.035,
             nightCatchMultiplier: 2.2, fines: [150, 400, 1000, 3500],
             suspensionGameMinutes: 120, newVehicleCost: 3000, satisfactionPenalty: 8 }
time:      { gameMinutesPerRealSecond: 2, nightStartHour: 22, nightEndHour: 6 }
dropoff:   { stopRequestChance: 0.28, roadsideRequestChance: 0.20,
             roadsideMinDelay: 2.5, roadsideMaxDelay: 7.0, windowSeconds: 5,
             roadsidePauseSeconds: 2.5, roadsideTipAmount: 10,
             stopAcceptBonus: 3, roadsideAcceptBonus: 5,
             rejectPenalty: 7, promiseBreakPenalty: 12 }
events:    { studentEventChance: 0.25, changeTimeoutSeconds: 4,
             changeBillOptions: [20, 50, 100] }
save:      { autosaveIntervalSeconds: 60 }
idle:      { offlineCapHours: 8 }
secondLine: { openCost: 2000, wealthMultiplier: 1.5,
              driverHireCost: 900, idleIncomePerSecond: 4 }
social:    { checkpointCost: 1500, checkpointCatchChance: 0.5,
             raidDailyLimitPerHost: 3, raidStealPercent: 0.05, raidStealCap: 300 }
```

### Dolmuşçu Roster (12 karakter, `shared/economy.json → drivers`)

| id | İsim | Nickname | Hız | Verim | Maaş |
|---|---|---|---|---|---|
| sukru | Şükrü | Şimşek | 1.30 | 0.65 | 0.35 |
| ramazan | Ramazan | Sakin | 1.00 | 0.85 | 0.20 |
| cevdet | Cevdet | Kurt | 1.10 | 0.80 | 0.25 |
| turgut | Turgut | Tribün | 1.20 | 0.70 | 0.30 |
| naciye | Naciye | Hanım Şoför | 0.95 | 0.90 | 0.22 |
| aziz | Aziz | Amca | 0.90 | 0.82 | 0.18 |
| deniz | Deniz | Yeni Nesil | 1.15 | 0.75 | 0.28 |
| hasan | Hasan | Fırtına | 1.35 | 0.60 | 0.40 |
| fatma | Fatma | Tedbirli | 0.85 | 0.92 | 0.15 |
| ibrahim | İbrahim | Orta Yol | 1.00 | 0.78 | 0.24 |
| nazmi | Nazmi | Gazcı | 1.25 | 0.68 | 0.32 |
| ayse | Ayşe | Tez Canlı | 1.10 | 0.83 | 0.23 |

Net kazanç çarpanı = `verim × (1 - maaşPayı)`. Şoför aktifken: DUR/GEÇ yok, etkileşim yok,
SpeedingRisk birikmez. Portreler: `frontend/public/drivers/{id}.png` — yoksa emoji placeholder.

---

## Oyun Mekaniği Detayları

### DUR / GEÇ
Durağa `DECISION_LEAD_PROGRESS` (10m) kala 2,5 sn pencere açılır:
- **DUR (Space):** Yolcu alır, `STOP_PAUSE_SECONDS=1.5` sn bekler.
- **GEÇ (G):** Pas geçer, `geciSpeedMultiplier=1.3x` hız bonusu bir sonraki segmentte.
- Süre dolarsa: otomatik DUR.
- Şoför aktifken pencere açılmaz — `autoChooseDur()` çağrılır.

### Hız Kontrolü + Polis Sistemi
**GÜNCEL (Faz 1–2):** Hızı artık WASD sürer. `speedLimitKmh` yalnızca TAVANI belirler
(`shared/economy.json → speed`). Gerçek hız `currentSpeedKmh` olarak store'da tutulur ve
`currentSpeedKmh > legalLimitKmh` (30 km/h) olunca SpeedingRisk birikir (altında azalır).
Eski `playerSpeedMultiplier` çarpanı KALDIRILDI.
SpeedingRisk > 30 → polis kontrol şansı aktif. Yakalanma formülü: `risk^1.5 × maxCatchChancePerSecond × nightMultiplier × delta`.

| `policeLevel` | Tetikleyen ceza | Ek etki |
|---|---|---|
| 0 → 1 | ₺150 | — |
| 1 → 2 | ₺400 | — |
| 2 → 3 | ₺1.000 | Ehliyet askı: dolmuş 2 oyun saati (60 gerçek sn) durur |
| 3 → 4 | ₺3.500 | Araç el koyma — tam ekran bloke, yeni araç ₺3.000, level → 2 |

Gece (22:00–06:00): yakalanma ihtimali 2,2×. Her yakalanmada SpeedingRisk=0, -8 memnuniyet.

### Yolcu Etkileşimleri
`startPostBoardingEvent` sıralaması (bir anda max 1 aktif, `interaction.type !== null` iken dolmuş duraktan ayrılmaz):
1. Hat dışı teklif (şoför yoksa %15)
2. Durakta iniş talebi (`dropoffStop`, %28)
3. Müsait iniş gecikmesi zamanla (`roadsidePendingDelay`) → `dropoffRoadside`
4. Yazarkasa yoksa para üstü (`change`)
5. Öğrenci teklifi (`student`, %25)

### Oyun Saati
1 gerçek sn = 2 oyun dk → tam gün = 12 gerçek dk. Başlangıç: 08:00 G1.
Gece: 22:00–06:00. `isNightTime()` ve `formatGameTime()` `store.ts`'te export edilir.

### Hat Dışı Seferler
Durak sonrası %15 ihtimal → "hat dışı götürür müsün?" teklifi (3 sn pencere):
- KABUL → `detourActive = true` → 9 sn loop animasyonu → Dikkat Çubuğu dolar (~%80).
- Tur bitince: kazanç = `₺17,5 × 2-4` → denetim şansı = `attention × 0,6`.
- Yakalanırsa: kazancın 2 katı ceza. Şoför aktifken hiç çıkmaz.

### Yolcu İniş Talepleri
**Durakta (`dropoffStop`):** Binişten sonra %28 ihtimal. TAMAM → `stopDropoffPromised=true`, +3 memnuniyet.
Sonraki durakta GEÇ seçilirse: -12 memnuniyet (söz bozuldu). HAYIR → -7 memnuniyet.

**Müsait yerde (`dropoffRoadside`):** Sefer başından 2,5-7 sn sonra %20 ihtimal.
DURDUR → +5 memnuniyet, +₺10, `roadsidePauseLeft=2.5 sn`. HAYIR → -7 memnuniyet.

### Memnuniyet
`satisfaction` (0-100) bir sefer sonu skoru değil, **sürekli aktif talep çarpanı**:
- Düşük memnuniyet → duraklarda yolcu daha yavaş birikir (`0.5x`).
- Yüksek memnuniyet → daha hızlı birikir (`1.5x`).
Her karar anının etkisi `economy.ts → satisfaction` bloğunda.

---

## Login

`POST /api/auth/login { username, password }` — kullanıcı adı yoksa otomatik kayıt
(yeni `playerId` + PBKDF2 hashlenmiş şifre), varsa şifre doğrulanır.

Frontend:
- `LoginGate.tsx`: `AppShell.tsx` üzerinden `layout.tsx`'e bağlı, tüm sayfaları sarar.
- `playerId.ts`: `playerId` artık rastgele üretilmiyor, yalnızca login yanıtından geliyor.
- `playerId` bulununca login ekranı tekrar gösterilmez.

Şifreler asla düz metin — `backend/FullFilled.Api/PasswordHasher.cs` (PBKDF2).

---

## Backend API

SQLite üzerinde save/load. Ekonomi doğrulaması `EconomyConstants.cs`'te;
değerler frontend ile ortak `shared/economy.json` dosyasından okunur.

| Uç | Açıklama |
|---|---|
| `POST /api/auth/login` | Kullanıcı adı yoksa kayıt, varsa şifre doğrulama |
| `GET /api/saves/{playerId}` | Kayıtlı durumu döner (yükseltmeler, şoför dahil). Şoför varsa geçen süreye göre çevrimdışı gelir ekler (`offlineIncome`, 8 saat tavanlı). |
| `PUT /api/saves/{playerId}` | Durumu kaydeder; geçen süreye göre mümkün olmayan para artışını kırpar (`clamped: true`). |

Frontend tarafı `AutoSave.tsx`: açılışta yükler, `autosaveIntervalSeconds=60 sn`'de bir
ve sekme gizlenince kaydeder. Periyodik kayıttan önce sunucudaki güncel parayı çekip farkı
uygular (`applyExternalGain`) — ziyaretçi kazancının üstüne yazılmaması için.

Backend adresi: `NEXT_PUBLIC_API_BASE_URL` ile ezilebilir (varsayılan `http://localhost:5000`).

### Faz 0 veri ve analitik temeli (2026-08-02)

- `DatabaseMigrator` + `SchemaMigrations`: geriye uyumlu, transaction tabanlı SQLite şema zinciri.
- Güncel DB sürümü `3`, güncel `GameSave.saveVersion` değeri `2`.
- Kalıcı tablolar: `Companies`, `PlayerProgression`, `PlayerAchievements`, `GameSessions`,
  `GameplayEvents`, `ContractRuns`, `ShiftResults`.
- Telemetri batch'i session/build/device/locale/level/company bağlamı taşır; olaylar oyuncu bazında
  idempotenttir ve hassas JSON anahtarları sunucuda silinir.
- Admin dashboard: `/admin/analytics`. Backend okuma uçları `X-FullFilled-Admin` ister;
  anahtar yalnız `FULLFILLED_ADMIN_KEY`/server config üzerinden gelir, frontend bundle'a yazılmaz.

---

## Yükseltmeler ve İkinci Hat

`store.ts → upgrades` state'i: motor (5 seviye, +%15/sev hız) / koltuk (kapasite 10→20) /
ses sistemi (pasif memnuniyet) / yazarkasa (para üstü mini-oyununu kaldırır).

**İkinci hat (`secondLine` state):**
- `secondLineUnlocked`: ₺2.000'a açılır, `tickSecondLine` ile pasif gelir akışı.
- `secondLineHasDriver`: ₺900 ek yatırım, `idleIncomePerSecond=4` artış.
- Backend persist: `HiredDriverId`, `SecondLineUnlocked`, `SecondLineHasDriver` — `GameSave.cs`.
- **Görsel/3D karşılığı henüz yok** — Kemal'in şehri entegre olunca gelecek.

---

## Sekme-Arası Senkron

`useTabSync.ts`: Web Locks API ile **tek lider sekme** seçilir (`useLeaderElection`).
- **Lider:** Gerçek simülasyonu çalıştırır, 150ms'de bir `BroadcastChannel` ile durumunu yayınlar.
  `BroadcastPayload` içinde: money, satisfaction, decision, interaction, policeLevel, busProgress, vb.
- **İzleyici:** Kendi simülasyonu çalışmaz; yayını uygular. Artık `dispatchGameAction(actionName, ...args)`
  ile girdi gönderebilir — lider sekmede doğrudan çağırır, izleyicide mesaj yollar.
- Tüm `DecisionHud`, `InteractionHud`, `ManagementHud` butonları `dispatchGameAction` kullanır.

**Önemli:** `tabSync.ts`/`TabSync.tsx` gibi sadece büyük/küçük harfle ayrılan dosya adları
Windows'ta çakışır (case-insensitive FS). Hook dosyaları `useXyz.ts`, bileşenler `Xyz.tsx`
şeklinde farklı köklerle adlandırılmalı.

---

## Şerit Modu

**M tuşu** → `uiStore.ts → stripMode = true`:
- `GameHome`: container `fixed bottom-0 h-[120px] overflow-hidden`.
- `TopNav`: `if (stripMode) return null` → gizlenir.
- `StripBar.tsx`: 44px alt çubuk — para, yolcu, memnuniyet, saat/gün, polis, hız kontrolü, çıkış (⤢).
- `GameCanvas / ChaseCam`: `stripMode && !chaseMode` → dolmuşun yanından alçak açılı sinematik kamera.
- `OrbitControls`: `enabled={!dragging && !stripMode && !chaseMode}` → devre dışı.
- `DecisionHud`: `bottom-11` konumunda küçük DUR/GEÇ butonları (StripBar yüksekliği üstünde).
- `InteractionHud`: `bottom-11` → `StripInteraction` tek satır: mesaj + kompakt butonlar.
- `PoliceAlert`: tam ekran overlay yerine üst banner; araç el koyma için mini kart.
- `SpeedLimiterWidget`: şerit modunda gizlenir → StripBar'a taşınmıştır.
- `ManagementHud` ve `EditorPanel`: `!stripMode` koşuluyla `GameHome`'da render edilmez.

---

## Admin Sistemi

`frontend/src/game/admin.ts` → `isAdminUser(username: string | null | undefined): boolean`:
- `NEXT_PUBLIC_ADMIN_USERNAMES` env (virgülle ayrılmış, küçük harf karşılaştırması).
- Dosya: `frontend/.env.local` → `NEXT_PUBLIC_ADMIN_USERNAMES=enes,kemal`

Editör butonu `TopNav.tsx`'te yalnızca `admin && <NavButton>Editör</NavButton>` ile gösterilir.
`EditorHotkeys.tsx`'te de E tuşu önce `isAdminUser()` kontrolü yapar.
**UI-only guard — sunucu tarafında ek doğrulama yok.**

---

## Performans Mimarisi (`GameCanvas.tsx`)

Optimizasyonlar 2026-07-26'da uygulandı. Temel prensipler:

| Sorun | Önce | Sonra |
|---|---|---|
| Durak mesh'leri | 4 ayrı draw call | `BusStopsInstanced`: 1 InstancedMesh |
| Yolcu mesh'leri | Her frame React reconcile, 64 Suspense+GLB | `WaitingPassengersInstanced`: 1 InstancedMesh, useFrame bypass |
| Draw call toplamı (shadow dahil) | ~136 | ~4 (mesh kısmı %97 azalma) |
| FollowerBus allocation | `new THREE.Vector3()` her frame | `useRef(new THREE.Vector3())` pre-allocated |
| DPR | Sınırsız (2x/3x ekranda 4-9x piksel) | `dpr=[1,1.5]` ile max 2,25x |
| Shadow frustum | Tüm sahne | `±50` birim — rota sınırlarına sıkıştırıldı |
| Static components | Her re-render'da | `React.memo` ile önlendi |

**`WaitingPassengersInstanced` mantığı (kritik):**
- `useEffect` ile mount'ta: tüm instance'lar gizlenir, sabit renkler `setColorAt` ile yazılır.
- `useFrame` ile: kuyruk sayısı değişmediyse `return` — GPU'ya hiçbir şey gönderilmez.
- Değişince: `makeTranslation` ile matris güncellenir, `instanceMatrix.needsUpdate = true`.
- Renkler hiç değişmez (deterministik `passengerTypeFor(s, i)`) — `instanceColor.needsUpdate` sadece mount'ta.

**Module-level pre-compute (sıfır mount maliyeti):**
```typescript
const STOP_POSITIONS = Array.from({ length: STOP_COUNT }, (_, i) => routePoint(stopProgress(i)));
const SLOT_COLORS = Array.from({ length: STOP_COUNT }, (_, s) =>
  Array.from({ length: MAX_WAITING_PER_STOP }, (_, i) => new THREE.Color(passengerTypeFor(s, i).color))
);
const HIDE_MATRIX = new THREE.Matrix4().makeTranslation(0, -2000, 0);
```

**Canvas ayarları:**
```tsx
<Canvas
  dpr={[1, 1.5]}
  performance={{ min: 0.5 }}
  gl={{ antialias: true, powerPreference: "high-performance", preserveDrawingBuffer: false }}
  shadows
>
  <directionalLight
    shadow-mapSize={[1024, 1024]}
    shadow-camera-near={1} shadow-camera-far={120}
    shadow-camera-left={-50} shadow-camera-right={50}
    shadow-camera-top={50} shadow-camera-bottom={-50}
  />
```

---

## Aşama Durumu (2026-07-26)

| Aşama | İçerik | Durum |
|---|---|---|
| **1** | 3D sahne, tek dolmuş, DUR/GEÇ, para sayacı | ✅ Tamam |
| **2** | Yükseltmeler, ilk şoför, idle gelir, backend kayıt | ✅ Tamam |
| **3** | Hat dışı risk, hız/polis, oyun saati, iniş talepleri, 2. hat (sayısal) | ✅ Tamam |
| **4** | Sekme-arası altyapı, şerit modu, izleyici girdi yönlendirme | ✅ Tamam |
| **5** | Link=şehir, korsan sefer altyapısı | ✅ Tamam |

**Bekleyen / backlog:**
- Kemal'in modelleri (dolmuş, 10 yolcu, mahalle kiti) — placeholder geometriler yerleşik, takas kolay.
- 2. hattın görsel 3D mahallesi — sayısal gelir çalışıyor.
- NPC rakip dolmuş + trafik (InstancedMesh hazır, geometri eklenecek).
- Ekonomi rebalance (hat/şoför maliyetleri oynanışa göre ayarlanacak).
- QTE kaçış anı (hat dışı risk — `05-hat-disi-risk-odul.md`).

---

## Klavye Kısayolları (tamamı)

| Tuş | Eylem | Dosya |
|---|---|---|
| **W / S** | Gaz / fren–geri | `DrivingControls.tsx` |
| **A / D** | Direksiyon (şerit değiştir, sollama) | `DrivingControls.tsx` |
| **Space** | El freni | `DrivingControls.tsx` |
| **F** | Kapı aç/kapa (kapalıyken yolcu binmez) | `DrivingControls.tsx` |
| G | GEÇ | `DecisionHud.tsx` |
| 1 / 2 / 3 | Etkileşim seçeneği | `InteractionHud.tsx` |
| U | Yönetim paneli aç/kapat | `ManagementHotkeys.tsx` |
| C | Takip kamerası aç/kapat | `GameHome.tsx` |
| **M** | Şerit modu aç/kapat | `StripModeHotkeys.tsx` |
| E | Sahne editörü (yalnızca admin) | `EditorHotkeys.tsx` |
| T | Editör: taşı modu (**yalnızca editör açıkken**) | `EditorHotkeys.tsx` |
| R | Editör: döndür modu (**yalnızca editör açıkken**) | `EditorHotkeys.tsx` |
| − / + | Hız LİMİTİNİ azalt / artır | `SpeedLimiterWidget.tsx` (buton) |

> **Not:** `S` eskiden şerit moduydu, `T` de editör modunu koşulsuz değiştiriyordu.
> WASD gelince ikisi de çakıştı; şerit modu **M**'ye alındı, editör T/R yalnızca editör
> açıkken çalışacak şekilde sınırlandı. Yeni tuş atamadan önce bu tabloyu kontrol et.

---

## Komutlar

```bash
# Frontend geliştirme
cd frontend && npm run dev
# → http://localhost:3000

# Backend geliştirme
cd backend/FullFilled.Api && dotnet run
# → http://localhost:5000 (launchSettings.json'a bak)

# TypeScript kontrol
cd frontend && npx tsc --noEmit
```

---

## Kemal Şehir MVP Entegrasyonu (2026-07-26)

Kemal'in Drive teslimi oyuna MVP olarak entegre edildi:

| Dosya | Rol |
|---|---|
| `frontend/public/models/city/Fullfilled_City_OPTIMIZED.glb` | Draco sıkıştırmalı ana şehir GLB'si |
| `frontend/public/models/city/city_data.json` | Yol/spawn/durak metadata'sı; henüz rota üretiminde kullanılmıyor |
| `frontend/public/draco/` | Three.js yerel Draco decoder dosyaları; CDN bağımlılığı yok |
| `frontend/src/game/content/CityModel.tsx` | GLTFLoader + DRACOLoader ile şehri yükler |

GLB içinde gelen `KHR_lights_punctual` ışıkları çok yüksek intensity ile sahneyi patlattığı için
`CityModel.tsx` import edilen ışıkları kapatır; oyun kendi `GameCanvas.tsx` ışık sistemini kullanır.
Normal MVP görünümünde eski placeholder `Neighborhood` render edilmez, sadece editör açıkken görünür.

`route.ts` artık eski elips hattı kullanmaz; `city_data.json` içindeki 11 durak ve yol aksları baz
alınarak şehir içi polyline rota kullanır. Eski yeşil durak çubukları ve kapsül yolcu placeholder'ları
normal sahneden kaldırıldı; durak/şehir görseli GLB'nin kendi içeriğinden gelir.

## Kemal Araç MVP Entegrasyonu (2026-07-26)

Drive teslimindeki araçlar `frontend/public/models/vehicles/` altına eklendi:

| Dosya | Kullanım |
|---|---|
| `bus1.glb` | Temel oyuncu dolmuşu |
| `bus2.glb` | İlk upgrade görseli |
| `bus3.glb` | Üst upgrade görseli |

`frontend/src/game/content/BusModel.tsx`, GLB bounding box ölçülerini isimli sabitlerle normalize eder;
araç tek yol şeridine sığacak genişlikte tutulur. Geçici MVP eşlemesi:
`seatLevel >= 2` veya `motorLevel >= 4` → `bus3`; `seatLevel >= 1` veya `motorLevel >= 2` → `bus2`;
aksi halde `bus1`. Ayrı "araç satın alma / filo tier" ekonomisi geldiğinde bu eşleme store'da ayrı
bir `vehicleTier` alanına taşınmalı.

`CITY_BUS_STOPS` artık her durak için `passengerSlots` içerir; karakter paketleri geldiğinde duraklara
birkaç yolcu spawn etmek için bu slotlar kullanılacak.
