# 03 — Sürüş Mekaniği

Dolmuş hat üzerinde **kendi ilerler** (rayda gibi, elips spline takibi). Oyuncu direksiyon
sallamaz; yol boyunca çıkan karar anlarına tıkla veya tuşla cevap verir. Sürüş = karar ritmi.

## Karar anları

### 1. DUR / GEÇ (ana mekanik)
Durağa `ECONOMY.decision.leadMeters` (10m) kala ekranda iki büyük buton belirir (~2,5 sn süre):
- **DUR (Space):** Yolcu alırsın (+para, +memnuniyet), zaman kaybedersin.
- **GEÇ (G):** Hız bonusu (`geciSpeedMultiplier = 1.3x`) bir sonraki segmentte; duraktaki para kaçar.
- Süre dolarsa varsayılan: DUR.
- Şoför aktifken pencere açılmaz; şoför otomatik DUR seçer (risk almaz).

### 2. Para üstü kararı
Yolcu binince devreye girer ve **aritmetik sorusu değil, bir dürüstlük kararıdır.**
Yolcu banknotu uzatır (`events.changeBillOptions`); üç seçenek de tutarıyla birlikte açıkça
gösterilir — gizli doğru cevap yoktur, oyuncu ne kazanıp ne kaybettiğini görerek seçer:

| Renk | Seçenek | Verilen üstü | Etki |
|---|---|---|---|
| 🔴 Kırmızı | **Kazık** | Doğrusunun `shortChangeKeepRatio` kadar eksiği | Fark cebe kalır · −9 memnuniyet · +polis riski · gün notuna **ihlal** |
| ⚪ Beyaz | **Tam üstü** | Doğru tutar (banknot − ücret) | Bahşiş şansı (`fare.tipMin–tipMax`) · +4 memnuniyet |
| 🟢 Yeşil | **İkram** | Doğrusunun `generousExtraRatio × ücret` kadar fazlası | Fark zarardır · +8 memnuniyet |

- Zaman aşımı: yolcu üstünü kendi alır — kâr/zarar yok, −3 memnuniyet.
- Sayılar: `shared/economy.json > events.changeChoice`.
- **Yazarkasa** yükseltmesiyle olay hiç çıkmaz (karar otomatikleşir).
- Şoför aktifken hiç çıkmaz.

### 2c. Gün hedefi (Kazanç / Memnuniyet / Güvenlik)
Gün başlarken seçilen hedef bir BAHİSTİR; sayıları `economy.json > dayGoals`:

| Hedef | Koşul | Ödül |
|---|---|---|
| Kazanç | Gün sonu net ≥ `targetNet` | Net kazancın +%20'si prim |
| Memnuniyet | Gün sonu memnuniyet ≥ `targetSatisfaction` | Net kazancın +%12'si prim |
| Güvenlik | Gün boyu ihlal ≤ `maxViolations` | Net kazancın +%15'i prim |

Tutmazsa ceza yoktur — hedef risk değil, yön verir. Hedef ve prim oranı gün başlangıç
ekranında yazılır; sonuç gün sonu raporunda "gerçekleşen / hedef" olarak gösterilir.

### 2b. Durak kasası (görsel geri bildirim)
Bekleyen yolcusu olan her durağın önünde parlayan bir zemin alanı ve üstünde dönen bir
nakit deste durur (`content/MvpWorld.tsx > StopMoneyBeacons`) — gezinti modunda görünmez. Dolmuş yanaşıp kapıyı
açınca para "toplanır" (küçülüp söner), tahsil edilen tutar ekranda `+₺X` olarak patlar
(`StopPayoutFx`, kaynak sinyal `store > stopPayout`). Amaç: her durağın tycoon oyunlarındaki
gibi görünür bir kasa anı olması.

### 3. Doluluk riski
Kapasite dolduğunda ekstra yolcu teklifi gelir: "1 kişilik yer var mı abi?"
- **AL:** Tam ücret ama doluluk riski (SpeedingRisk değil — ayrı Dikkat Çubuğu doluluk sinyali).
- **ALMA:** Para yok, risk yok.
- -3 memnuniyet otomatik uygulanır (doluluk stres).

### 4. Çeşni olayları
- **"Öğrenciyim abi"** (ECONOMY.events.studentEventChance = %25): KABUL (+3 memnuniyet) / RET (-1).
- **Hat dışı teklif** (durak sonrası %15 ihtimal): `interaction.type = "offroute"` — bkz. madde 5.
- **Yolcu iniş talepleri** — bkz. madde 6.

### 5. Hat dışı seferler
Durak sonrası %15 ihtimalle: "Abi hat dışı ama şuraya götürür müsün, 2-4 katı veririm 😏"
- Kabul → `detourActive = true`: dolmuş **yerinde bekler** (5 sn), ortada kasa efekti açılır.
- Bu sürede **Dikkat Çubuğu** (`attention`, 0-100) ~%45 dolar.
- Süre boyunca kazanç kademeli işlenir, ardından tek seferlik denetim şansı (`attention × 0,6`).
- Yakalanırsa kazancın 2 katı ceza (`firstCatchPenaltyMultiplier`).
- Şoför aktifken hiç çıkmaz.

### 6. Yolcu iniş talepleri (uygulandı)

**Durakta iniş (`dropoffStop`):**
- Binişten hemen sonra %28 ihtimalle: "Abi durakta inecektim, durur musun?"
- TAMAM (1): `stopDropoffPromised = true`, +3 memnuniyet. Sonraki durakta GEÇ seçilirse -12 memnuniyet (söz bozuldu).
- HAYIR (2): -7 memnuniyet.
- TopNav'da "🚏 Durakta inecek var" göstergesi yanıp söner.

**Müsait yerde iniş (`dropoffRoadside`):**
- Sefer başından 2,5-7 sn sonra (duraklar arası) %20 ihtimalle: "Hocam şurda inebilir miyim? +₺10"
- DURDUR (1): +5 memnuniyet, +₺10 bahşiş, 2,5 sn duraklama (`roadsidePauseLeft`).
- HAYIR (2): -7 memnuniyet.
- Şoför aktifken hiç çıkmaz.

## Sürüş: WASD (Faz 2'de eklendi)

Şoför tutulana kadar aracı oyuncu sürer. Şoför kiralanınca kontrol otomatiğe döner.

| Tuş | Etki |
|---|---|
| **W / S** | Gaz / fren — S ile durduktan sonra geri vites (`maxReverseKmh` ile sınırlı) |
| **A / D** | Direksiyon. Açı rampalı döner, bırakılınca düze yaylanır. |
| **Space** | El freni (gazdan hızlı durdurur) |
| **F** | Kapı aç/kapa — **kapı kapalıyken durakta yolcu binmez, GEÇ işlenir** |

**Vardiyada** araç hat üzerinde raylıdır; A/D yalnızca şerit içinde yanal kayma
(`laneOffsetMaxMeters`) üretir. Kayma **hıza bağlıdır** — dururken direksiyon çevirmek
aracı yana taşımaz.

**Gezinti modunda** (gün başlamamışken) araç raya bağlı DEĞİLDİR: WASD ile şehirde
serbestçe sürülür. Yine de yoldan çıkılamaz — `cityRoads.ts > clampMoveToRoad` konumu
şehir ızgarasının asfaltıyla sınırlar; binaya sürtünce araç durmaz, yol boyunca kayar ve
hız kesilir. Bkz. `02-cekirdek-dongu.md > Gezinti / gün / tur`.

**Sollama:** öndeki araca `followGapMeters` kalınca tam durulur; yana çıkıp yanal mesafe
`laneBlockWidthMeters`'ı aşınca o araç engel olmaktan çıkar ve geçilir.

Tüm fizik `frontend/src/game/driving.ts` içinde SAF fonksiyonlardır; `npm run check:driving`
ile 24 davranış testi çalışır. Ayar değerleri `shared/economy.json → driving`.

## Oyuncu hız limitörü

`SpeedLimiterWidget` (sol alt, şerit modunda StripBar'da):
- **− / +** butonları: `speedLimitKmh` yalnızca üst sınırı belirler (15–55 km/h, adım 5).
- Gazı WASD verir; limitör aracın ulaşabileceği tavanı kısar.
- Yasal limit `legalLimitKmh = 30`. Gerçek hız bunu aşınca **SpeedingRisk** (0-100) birikir.
- Risk > 30 → polis kontrol şansı aktif (`maxCatchChancePerSecond = 0,035`).
- **Gece çarpanı**: 22:00–06:00 arası yakalanma ihtimali `nightCatchMultiplier = 2,2×`.
- Şoför aktifken, araç el konulmuşsa veya ehliyet askıdaysa kontroller kilitlenir.

## Ehliyet ceza puanı sistemi (2026-08-08)

Polis riski bir BAR (0-100), ehliyet ise CEZA PUANI taşır. Sayılar: `economy.json > licence`.

| İhlal | Riske etkisi | Ceza eşiği | Ceza puanı |
|---|---|---|---|
| Hız limiti aşımı | +%1/sn | risk ≥ %15 iken hâlâ hızlıysan | 5 |
| Hat dışı sefer | +%20 | risk ≥ %75 | 50 |
| Kapasite üstü yolcu | +%10 | risk ≥ %50 | 30 |
| Yolcu kazığı | riski ARTIRMAZ | her 5 kazıkta | 20 |

- Ceza kesilince risk sıfırlanır; aynı ihlalden peş peşe ceza yağmaz.
- **100 puan** → ek para cezası + **30 sn araç kilidi**, puan sıfırlanır.
- Gösterge (`RiskMeter.tsx`): bar + ucunda yıldız. Ceza eşiği aşılınca yıldız sarı yanıp söner.
- Her cezada `PenaltyCard.tsx` açılır: ihlal, gerekçe, para cezası, puan, ehliyet doluluğu.

## Kademeli polis ceza sistemi (uygulandı)

`policeLevel` 0→4 arası ilerler, her yakalanmada bir seviye atlar:

| Seviye | Durum | Sonuç |
|---|---|---|
| 0 | Temiz | — |
| 1 | 1. ceza | ₺150 |
| 2 | 2. ceza | ₺400 |
| 3 | Ehliyet askı | ₺1.000 + `suspensionMinutesLeft` (2 oyun saati = 60 gerçek sn) — dolmuş durur |
| 4 | Araç el koyma | ₺3.500 ceza + tam ekran bloke — yeni araç: ₺3.000, policeLevel 2'ye düşer |

`PoliceAlert.tsx`: toast bildirimi (4 sn); şerit modunda üst banner; seviye 4'te tam overlay.

## Oyun saati ve gece/gündüz

- 1 gerçek saniye = 2 oyun dakikası → tam gün = 12 gerçek dakika.
- Başlangıç: 08:00 G1. TopNav'da ☀️/🌙 göstergesi.
- Gece: 22:00–06:00. Polis yakalanma olasılığı 2,2× artar.

## Memnuniyet sistemi (sürekli çarpan)

`satisfaction` (0-100) bir son-of-sefer skoru değil, **sürekli aktif talep çarpanıdır**:
- `demandMultiplierAtZero = 0,5` → duraklarda yolcu birikimi yavaş.
- `demandMultiplierAtHundred = 1,5` → yolcu birikimi hızlı.
- Her karar anının memnuniyete etkisi `economy.ts → satisfaction` bloğunda tanımlı.

## Kontroller

| Tuş | Eylem |
|---|---|
| **Space** | DUR |
| **G** | GEÇ |
| **1 / 2 / 3** | Etkileşim seçeneği |
| **U** | Yönetim paneli |
| **C** | Takip kamerası (chase cam) |
| **M** | Şerit modu (120px kompakt) |
| **E** | Sahne editörü (yalnızca admin) |
| **W / A / S / D** | Sürüş: gaz / direksiyon / fren-geri |
| **Space** | El freni |
| **F** | Kapı aç/kapa |
| **− / +** | Hız LİMİTİNİ azalt / artır |
