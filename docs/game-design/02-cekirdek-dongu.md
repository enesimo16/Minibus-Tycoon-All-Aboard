# 02 — Çekirdek Döngü ve İlerleme

## Gezinti / gün / tur

Oyunun üç oturum durumu vardır:

```text
GEZİNTİ MODU ──"Gün Başlat"──▶ HAT ÖNİZLEMESİ ──"Sür"──▶ GÜN (vardiya)
     ▲                              │"İptal"                    │
     │                              └──────────────▶ GEZİNTİ    │ 12 durak
     │                                                          ▼
     └──"Gezinti Modu"── HAT RAPORU ◀──"Tekrar Sür"──┐    TUR TAMAMLANDI
              (gün biter, gün raporu çıkar)          └─────────┘
```

- **Gezinti modu** (`dayRun === null`): oyun buradan başlar. Dolmuş **hat geometrisine
  bağlı değildir**: WASD ile şehirde istenen yöne serbestçe sürülür (`GameCanvas > LeaderBus`
  içindeki serbest sürüş dalı — konum + yön doğrudan entegre edilir). Durak servisi, yolcu
  kararı, tahsilat, durak para işaretleri ve **hat çizgisi** kapalıdır.
  - Güne dönüldüğünde araç, bulunduğu noktaya **en yakın hat progress'ine** oturtulur
    (`route.ts > nearestRouteProgress`) — başa ışınlanmaz.
  - Sınırlar: `economy.json > driving.roamBoundsMeters` (şehir dışına çıkılamaz),
    dönüş hızı `roamTurnRateRadPerSec`.
  > **Sınır:** Binalarla çarpışma yoktur — serbest sürüşte araç engellerin içinden geçer.
  > Gerçek çarpışma bir yol ağı/çarpışma katmanı gerektirir (hat dışı güzergâhıyla aynı iş).
- **Hat önizlemesi** (`DayStartModal`): hat, durak sayısı, hat profili, ustalık seviyesi,
  önerilen şoför/araç ve günün şehir olayı gösterilir. **Sür** günü başlatır, **İptal**
  gezintiye döner.
- **Gün** bir veya birden çok **tur** içerir. Bir tur = hattın 12 durağının tamamı.
- **Tur bitince hat raporu** açılır (`LapReport`): brüt gelir, gider, net kâr/zarar, binen
  yolcu, geçilen durak, hat dışı sefer sayısı, limit üstü alınan yolcu, polis cezası
  (adet + tutar) ve ihlal sayısı. Rapor açıkken dolmuş durur.
  - **Tekrar Sür:** sayaçlar sıfırlanır, yeni tur başlar, gün devam eder.
  - **Gezinti Modu:** gün biter → notlu **gün raporu** (`DayEndReport`, XP/itibar) →
    gezinti moduna dönülür.

Hat raporu operasyonel özettir (para), gün raporu değerlendirmedir (not + XP).

## Ana döngü

```

## Faz 1 — şirket ve level omurgası

- Yeni hesap ilk oyuna girmeden şirket adını, hazır amblemini, iki rengini, başlangıç yaklaşımını ve
  üç ücretsiz minibüsten birini seçer. Bu seçim tek bir backend transaction'ında kaydedilir.
- Mevcut hesaplar geriye uyumluluk için otomatik “miras şirketi” almaz; ilk girişlerinde aynı kısa
  şirket kurulumunu tamamlar, mevcut para/araç/save verileri korunur.
- Oyuncu XP'si toplam birikim olarak sunucuda tutulur. Level, `shared/economy.json > progression`
  eşiklerinden hesaplanır; istemci level veya XP yazamaz.
- İlk kilometre taşı ödülleri (`first_drive`, `first_stop_completed`, `first_upgrade`,
  `first_driver_hired`, `first_bus_bought`, `first_route_unlocked`) backend tarafından olay
  idempotency anahtarı üzerinden yalnız bir kez XP verir.
- Unlock kararı yalnız level değildir: backend `level + milestone` koşullarını döndürür; frontend
  satın alma butonlarını aynı karara göre açıklar ve backend koşulu tekrar doğrular.
- Level atlandığında açılan içerikler kuyruklanır; oyuncu her level için bildirimi bir kez görür.
Durakta yolcu birikir → dolmuş yolcuyu alır → hat boyunca kararlar verilir
→ yolcu iner, para öder → para ile yükseltme/şoför/hat alınır → döngü büyür
```

## Üç oyun evresi

### Evre 1 — Şoförlük (0. dakika → ~30. dakika)
- Oyuncu tek dolmuşu kendi "sürer" (bkz. `03-surus-mekanigi.md`).
- Tek hat: **Başlangıç Hattı** (4 duraklı elips, halka şeklinde).
- Hedef: ilk yükseltmeler + ilk şoförü tutacak parayı biriktirmek.

### Evre 2 — İşletmecilik (30 dk → saatler)
- İlk şoför tutulur → hat oyuncu olmadan çalışır (idle gelir).
- Oyuncu istediği an direksiyona geçebilir (%100 verim + bahşiş şansı).
- Yeni hatlar açılır; her hat bir sekme olabilir (bkz. `06-sosyal-link-sekme.md`).
- Hat dışı riskli seferler ve hız ihlali riskleri devrede.

### Evre 3 — Ağalık (uzun vade)
- 5+ hat, şoför kadrosu yönetimi, rakip NPC dolmuş ağaları.
- Arkadaş şehirlerine korsan sefer / misilleme meta-oyunu.
- İlk hurda dolmuş garajda nostalji objesi olarak durur, sürülebilir.

## Çevrimdışı (idle) gelir

- Şoförü olan hatlar oyuncu yokken de kazanır; çevrimdışı birikim **8 saatle sınırlı**.
- Girişte "Sen yokken olanlar" özeti: kazanç + olay bildirimi.

## İnşa sırası ve mevcut durum

| Aşama | Kapsam | Durum |
|---|---|---|
| **1** | 3D mahalle, tek dolmuş, DUR/GEÇ, para sayacı | ✅ Tamamlandı |
| **2** | Yükseltmeler, ilk şoför, idle gelir, backend kayıt | ✅ Tamamlandı |
| **3** | 2. hat + hat dışı risk sistemi | ✅ Büyük ölçüde tamamlandı |
| | Hat dışı: teklif, detour animasyonu, Dikkat Çubuğu, denetim | ✅ |
| | Hız kontrolü + 4 kademeli polis cezası | ✅ |
| | Oyun saati + gece/gündüz sistemi | ✅ |
| | Yolcu iniş talepleri (durakta + müsait yerde) | ✅ |
| | 2. hat: sayısal/pasif gelir + backend persist | ✅ |
| | 2. hattın görsel/3D mahallesi | ⏳ Kemal'in şehriyle gelecek |
| **4** | Sekme-arası geçiş + şerit modu | ✅ Büyük ölçüde tamamlandı |
| | Lider seçimi (Web Locks API) + BroadcastChannel senkron | ✅ |
| | İzleyici sekmeler `dispatchGameAction` ile girdi gönderebilir | ✅ |
| | Şerit modu: S tuşu, 120px strip, StripBar, kompakt kamera | ✅ |
| | DecisionHud / InteractionHud strip-mode aware | ✅ |
| | Dolmuşun sekmeden sekmeye fiziksel geçiş animasyonu | ⏳ Gerçek 2. mahalle gelince |
| **5** | Link=şehir, korsan sefer | ✅ Altyapı hazır |

**Kural:** Bir aşama bitmeden sonrakine kod yazılmaz.

## Performans mimarisi (2026-07)

Önemli optimizasyonlar uygulandı — GameCanvas.tsx:

| Bileşen | Önceki | Sonraki |
|---|---|---|
| Bus stops | 4 ayrı mesh (4 draw call) | InstancedMesh (1 draw call) |
| Yolcular | Her frame React reconcile, 64 Suspense+GLB | InstancedMesh, yalnızca kuyruk değişince GPU güncelleme |
| Draw call toplamı (shadow dahil) | ~136 | ~4 (mesh kısmı) |
| FollowerBus allocation | `new THREE.Vector3()` her frame | Pre-allocated ref |
| DPR | Sınırsız (2x/3x ekranlarda 4-9x piksel) | `dpr=[1,1.5]` ile max 2,25x |
| Shadow frustum | Tüm sahne | Rota sınırlarına (`±50`) sıkıştırıldı |
| Static components | Her re-render'da yeniden oluşuyor | `React.memo` ile önlendi |
