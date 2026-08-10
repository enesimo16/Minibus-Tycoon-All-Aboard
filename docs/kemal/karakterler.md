# Kemal İçin — Yolcu Karakterleri (10 Adet) 🧍🧍‍♀️🧍‍♂️

Bu doküman **sadece yolcu karakterleri** için. Genel stil kuralları (renk paleti, low-poly
felsefesi) `gorsel-rehber.md`'de; Meshy.ai kullanım şablonu (Art Style/Negatif/Export ayarları)
`meshy-promptlari.md`'nin başındaki "Genel ayarlar" bölümünde — oraya bakıp aynı ayarları kullan.

Daha önce 3 karakter (teyze, öğrenci, amca) tanımlanmıştı; bu doküman onları da içeriyor ve
**7 yeni karakterle 10'a tamamlıyor**. Çeşitlilik önemli: her durakta rastgele bu 10 karakterden
biri beliriyor, ne kadar çok farklı silüet olursa mahalle o kadar canlı görünür.

## Üçgen (poly) bütçesi — bağlayıcı kural

- **Her karakter ≤ 1.500 üçgen.** Bu limit `gorsel-rehber.md`'deki genel kuralla aynı, burada
  tekrar vurgulanıyor çünkü 10 karakter aynı anda sahnede (birden fazla durakta) görünebilir —
  toplam sahne performansı buna bağlı.
- Tek parça mesh, **rig/animasyon YOK** (zıplama/sallanma kodda yapılıyor).
- Aynı temel gövde oranını kullan (2.5 kafa boyu, tombul-kısa) — üretim hızlanır, stil tutarlı kalır.
- Göz = tek siyah nokta, yüzde başka detay yok.
- Malzeme: düz renk / vertex color, doku yok (ya da tek küçük atlas).
- Origin taban merkezinde, T-pose, öne bakıyor.

## Dosya adları (tam olarak bunlar — `scene.ts`/kod bu isimleri bekleyecek)

| # | Karakter | Dosya adı | Durum |
|---|---|---|---|
| 1 | Teyze | `yolcu_teyze.glb` | Daha önce tanımlandı |
| 2 | Öğrenci | `yolcu_ogrenci.glb` | Daha önce tanımlandı |
| 3 | Amca | `yolcu_amca.glb` | Daha önce tanımlandı |
| 4 | Memur | `yolcu_memur.glb` | Yeni |
| 5 | İnşaat İşçisi | `yolcu_isci.glb` | Yeni |
| 6 | Ev Hanımı | `yolcu_evhanimi.glb` | Yeni |
| 7 | Genç Kız | `yolcu_genckiz.glb` | Yeni |
| 8 | Emekli Dede | `yolcu_dede.glb` | Yeni |
| 9 | Çocuk | `yolcu_cocuk.glb` | Yeni |
| 10 | Turist | `yolcu_turist.glb` | Yeni |

---

## 1 — Teyze
> "Cute stylized cartoon low-poly game character, short chubby proportions (2.5 heads tall),
> Turkish middle-aged woman wearing a headscarf and floral dress, carrying a net shopping bag
> (file), simple round black dot eyes, no facial detail, flat cel-shaded colors, T-pose,
> game-ready asset, single mesh, no rig needed"

**Dosya:** `frontend/public/models/yolcu_teyze.glb`

## 2 — Öğrenci
> "Cute stylized cartoon low-poly game character, short chubby proportions (2.5 heads tall),
> young Turkish student with backpack, casual hoodie, simple round black dot eyes, no facial
> detail, flat cel-shaded colors, T-pose, game-ready asset, single mesh, no rig needed"

**Dosya:** `frontend/public/models/yolcu_ogrenci.glb`

## 3 — Amca
> "Cute stylized cartoon low-poly game character, short chubby proportions (2.5 heads tall),
> elderly Turkish man with flat cap (kasket), holding prayer beads (tesbih), simple round
> black dot eyes, no facial detail, flat cel-shaded colors, T-pose, game-ready asset, single
> mesh, no rig needed"

**Dosya:** `frontend/public/models/yolcu_amca.glb`

## 4 — Memur
> "Cute stylized cartoon low-poly game character, short chubby proportions (2.5 heads tall),
> Turkish office worker in a simple gray suit and tie, carrying a slim briefcase, small round
> glasses, simple round black dot eyes, no facial detail, flat cel-shaded colors, T-pose,
> game-ready asset, single mesh, no rig needed"

**Dosya:** `frontend/public/models/yolcu_memur.glb`

## 5 — İnşaat İşçisi
> "Cute stylized cartoon low-poly game character, short chubby proportions (2.5 heads tall),
> Turkish construction worker wearing an orange hi-vis vest over blue overalls, yellow hard
> hat, simple round black dot eyes, no facial detail, flat cel-shaded colors, T-pose,
> game-ready asset, single mesh, no rig needed"

**Dosya:** `frontend/public/models/yolcu_isci.glb`

## 6 — Ev Hanımı
> "Cute stylized cartoon low-poly game character, short chubby proportions (2.5 heads tall),
> Turkish housewife wearing a patterned apron over a simple dress, headscarf tied differently
> from the aunt character, carrying two full grocery bags, simple round black dot eyes, no
> facial detail, flat cel-shaded colors, T-pose, game-ready asset, single mesh, no rig needed"

**Dosya:** `frontend/public/models/yolcu_evhanimi.glb`

**Not:** Teyze'den silüet olarak ayırt edilebilir olmalı — başörtü stili ve poşetler farklı,
elbise rengi farklı bir palet tonundan seçilsin (aynı iki karakter birbirine benzemesin).

## 7 — Genç Kız
> "Cute stylized cartoon low-poly game character, short chubby proportions (2.5 heads tall),
> trendy young Turkish woman with a ponytail, casual modern outfit, holding a phone, simple
> round black dot eyes, no facial detail, flat cel-shaded colors, T-pose, game-ready asset,
> single mesh, no rig needed"

**Dosya:** `frontend/public/models/yolcu_genckiz.glb`

## 8 — Emekli Dede
> "Cute stylized cartoon low-poly game character, short chubby proportions (2.5 heads tall),
> very elderly Turkish man, slightly hunched posture, leaning on a simple wooden cane, flat
> cap, newspaper tucked under one arm, simple round black dot eyes, no facial detail, flat
> cel-shaded colors, T-pose (cane visible but character still in base pose), game-ready asset,
> single mesh, no rig needed"

**Dosya:** `frontend/public/models/yolcu_dede.glb`

**Not:** Amca'dan (3) daha yaşlı ve kırılgan hissettirmeli — duruşu hafif kambur, elinde baston.

## 9 — Çocuk
> "Cute stylized cartoon low-poly game character, short chubby proportions (2.5 heads tall but
> smaller overall scale than adults), Turkish schoolchild in a simple school uniform, small
> backpack, simple round black dot eyes, no facial detail, flat cel-shaded colors, T-pose,
> game-ready asset, single mesh, no rig needed"

**Dosya:** `frontend/public/models/yolcu_cocuk.glb`

**Not:** Export ölçeğini diğerlerinin ~%70'i kadar küçük tut (kod tarafında da ayrıca ölçeklenebilir
ama modelin kendi oranı da küçük hissettirmeli).

## 10 — Turist
> "Cute stylized cartoon low-poly game character, short chubby proportions (2.5 heads tall),
> foreign tourist with a sun hat, camera hanging around the neck, cargo shorts, small backpack,
> simple round black dot eyes, no facial detail, flat cel-shaded colors, T-pose, game-ready
> asset, single mesh, no rig needed"

**Dosya:** `frontend/public/models/yolcu_turist.glb`

**Not:** Mizah amaçlı — "yerel olmayan biri dolmuşa binmiş" hissi. Şapka/fotoğraf makinesi net
görünür olsun, siluetten bile ayırt edilebilmeli.

---

## Sıra ve teslim

Öncelik: **4, 5, 6** (Memur/İşçi/Ev Hanımı — günlük çeşitliliğin çoğunu bunlar sağlar),
sonra **7, 8** (Genç Kız/Dede), en son **9, 10** (Çocuk/Turist — mizah/detay katmanı).

Her dosya `frontend/public/models/` klasörüne tam bu isimle konunca, oyun içinde otomatik devreye
girer (kod zaten `content/scene.ts` ve yolcu render mantığında bu isimlere hazırlanacak — Codex
karakterler geldikçe bağlantıyı kuracak). Bitirdikçe `gorev-listesi.md`'deki K2 satırını güncelle.
