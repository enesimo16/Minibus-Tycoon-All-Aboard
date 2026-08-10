# 04 — Yönetim ve Ekonomi

Tüm sayısal sabitler `shared/economy.json` içinden gelir. Frontend `frontend/src/game/economy.ts`
bu JSON'u re-export eder; backend `EconomyConstants.cs` aynı dosyayı okur. Buradaki değerler
başlangıç dengesidir; oynanış testine göre bu doküman + JSON birlikte güncellenir.

## Para birimi ve gelir

- Birim: ₺ (oyun içi, gerçek parayla ilişkisi yok).
- Temel bilet: **₺17,5** (tam), **₺12** (öğrenci). Bahşiş: ₺5-₺25.
- Hat zenginliği çarpanı: Başlangıç Hattı x1.0 → sonraki hatlar x1.5, x2.2, x3.5...
  (yeni hat = daha pahalı açılış + daha zengin yolcu).

## Yükseltmeler (dolmuş başına)

| Yükseltme | Etki | Seviyeler |
|---|---|---|
| Motor | Tur süresi kısalır | 5 |
| Koltuk | Kapasite 10 → 14 → 17 → 20 | 4 |
| Yazarkasa | Para üstü mini oyununu otomatikleştirir | 1 |
| Ses sistemi | Yolcu memnuniyeti pasif + | 3 |
| Süsleme (nazar boncuğu, perde, yazılar) | Kozmetik + minik bahşiş şansı | çok |

Fiyatlandırma ilkesi: her seviye bir öncekinin ~x2.2 katı (üstel; idle türü standardı).

## Dolmuşçular (uygulandı — bkz. `shared/economy.json` → `drivers`, `docs/kemal/dolmusculer.md`)

12 isimli dolmuşçudan **2D portreyle** seçim yapılır (yönetim panelinde "Dolmuşçu Seç").
Her birinin 3 ekseni var:
- **Hız çarpanı** (%85-135) — dolmuşun temel hızına çarpan.
- **Verim** (%60-92) — topladığı ücretin oyuncuya yansıyan oranı.
- **Maaş payı** (%15-40) — verimden düşülen kesinti.

Net kazanç çarpanı = `verim × (1 - maaş payı)`. Tasarım ilkesi: **hızlı + düşük verim + yüksek
maaş** (örn. Hasan "Fırtına") ↔ **yavaş + yüksek verim + düşük maaş** (örn. Fatma "Tedbirli")
arasında bilinçli bir yelpaze — "hızlı ama pahalı" hissi net biçimde hissedilsin diye.
Şoför aktifken oyuncu DUR/GEÇ ve mini-etkileşimlere karışmaz, risk almaz (hat dışı teklif dahil).

**MVP'de olmayanlar** (ileride): kovup değiştirme, zam isteme/izin/küsme olayları, birden fazla
dolmuşçuyu aynı anda farklı dolmuşlarda çalıştırma (bkz. "Dolmuş ve hat satın alma" backlog'u).

## Hatlar

- Hat = durak dizisi + spline yol + zenginlik çarpanı + talep profili (sabah/akşam yoğunluğu).
- Yeni hat açma bedeli üstel artar. Her hat bir "mahalle" sahnesidir (sekme-arası bölünmenin
  doğal birimi).
- Rakip NPC dolmuşlar: her hatta 1-2 rakip; oyuncunun DUR/GEÇ ritmini etkiler. Evre 3'te
  rakip ağadan "hattı satın alma" hedefi.

### Yol ve hat mutabakati (uygulandi)

`frontend/src/game/route.ts` rota icin tek kaynak kabul edilir. Harita modelinin
`city_data.json` dosyasindaki cift serit kurali kullanilir: serit merkezi = yol ekseni
`+/- grid.laneOffset`. Dolmus yol ekseninden degil, serit merkezlerinden gider.

Hat kademeleri:
- **Hat 1 - Mahalle Ici Ezik Hat:** kisa merkez ici rota, 5 durak, gelir x0.75.
- **Hat 2 - Ana Mahalle Hatti:** 11 durakli MVP sehir turu, gelir x1.0.
- **Hat 3 - Sanayi - Meydan Hatti:** bati/guney sokaklari, gelir x1.45.
- **Hat 4 - Yeni Semt Ring Hatti:** dis yola cikan premium ring, gelir x2.2.

Ileride rastgele hat uretimi ayni yol agindan turetilir: durak secimi + serit merkezleri +
donus noktasi listesi. Elle yazilan rotalar sadece tasarim onayi alinmis baslangic setidir.

## Denge hedefleri (test edilecek)

- İlk yükseltme: ~3. seferde alınabilmeli (~4 dk).
- İlk şoför: ~25-35 dk oyunda.
- 2. hat: ~1. saatte.
- Çevrimdışı birikim tavanı: 8 saat.

## Ekonomi anti-hile

Backend kayıtta mantık kontrolü yapar: geçen süreye göre kazanılabilecek maksimum parayı
aşan kayıtlar reddedilir/kırpılır (bkz. ADR-002). Skor tablosu ve sosyal özellikler buna dayanır.

## Faz 1 şirket yetenekleri

- Şirket yaklaşımı başlangıçta `service`, `operations` veya `growth` seçilir; bu kalıcı sınıf değildir.
- **Yaklaşımın sayısal karşılığı (2026-08-08 · `economy.json > progression.strategies`):**
  her yaklaşımın TEK ve ölçülebilir bir etkisi vardır, tek bir çıkış noktasından uygulanır ve
  şirket kurma ekranında birebir yazılır (gizli bonus yoktur):

  | Yaklaşım | Etki | Kod |
  |---|---|---|
  | **Hizmet** | Durakta kazanılan memnuniyet ×1.35 (memnuniyet CEZASI değişmez — yaklaşım hatayı örtmez) | `store.ts > finishBoarding` |
  | **Operasyon** | Polis riski birikimi ×0.8 | `store.ts > applyPoliceRiskToState` (hız, hat dışı, ihlal — tüm risk buradan geçer) |
  | **Büyüme** | Vardiyalı şoförlü filo geliri ×1.2 | `store.ts > tickOwnedBuses` |
- Her 2 level'da bir yetenek puanı gelir. Puanlar üç ağaçta harcanabilir ve oyuncu ücretsiz olarak
  yeniden dağıtabilir; böylece erken yanlış seçim hesabı bozmaz.
- Faz 1 yetenekleri ekonomi miktarlarını doğrudan değiştirmez. Önce kalıcı seçim, doğrulama ve UI
  omurgası kurulur; sayısal etkiler Faz 2 ekonomi simülasyonuna ölçümlü olarak bağlanır.
- Yetenek ağacı düğümleri: Hizmet (`loyal-passengers`, `service-recovery`), Operasyon
  (`preventive-care`, `route-prep`), Büyüme (`contract-choice`, `fleet-planning`). Her düğüm 3 kademedir.
- Şirket adı 3–28 karakterdir; harf, rakam, boşluk, tire ve apostrof kabul edilir. Kontrol backend'de
  normalize edilmiş benzersiz ad ve küçük bir uygunsuz sözcük listesiyle yapılır.


## Guncel ekonomi revizyonu (2026-07-28)

- Tam bilet: 40 TL, ogrenci: 30 TL. Bahsis 10-60 TL.
- Soforler artik gunluk vardiya ucretiyle dengelenir: 1500-3000 TL bandi. Verimi dusuk ama pahali soforler bilerek "kazik" hissi verir; ucuz/guvenilir soforlerin hiz dezavantaji vardir.
- Her arac icin 3 vardiya vardir: Sabah 08:00-16:00, Aksam 16:00-00:00, Gece 00:00-08:00. Gece vardiyasi gizli/yasak vardiyadir.
- Pasif gelir formulu: `(arac gunluk brut / 3 * vardiya carpani * sofor verimi) - sofor gunluk ucreti`.
- Ana arac hedef brutu 21.000 TL/gun, ek arac hedef brutu 19.000 TL/gun. Ortalama 3 soforlu bir arac icin hedef: gunluk yaklasik 6.000 TL maas gideri ve 10.000-15.000 TL net pasif gelir.
- Ek dolmus alma bedelleri milyon bandina cekildi: 1.250.000 / 1.850.000 / 2.750.000 TL.
- Hat acma bedelleri milyon bandina cekildi: Ana Mahalle 1.500.000 TL, Sanayi-Meydan 2.350.000 TL, Yeni Semt Ring 3.600.000 TL. Ikinci pasif hat 1.500.000 TL.
