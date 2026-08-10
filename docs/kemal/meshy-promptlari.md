# Meshy.ai Promptları — Kemal İçin 🎨🤖

Meshy.ai'de **Text to 3D** modunu kullan. Her satır aşağıdaki gibi dolduracağın bir şablon:
**Prompt / Art Style / Negatif / Ayarlar / Export / Dosya Adı**. Dosya adı `gorsel-rehber.md`
ve `frontend/src/game/content/scene.ts`'teki `modelPath` değerleriyle **birebir** aynı olmalı —
farklı olursa kod otomatik tanımaz.

## Genel ayarlar (her model için sabit)

- **Art Style:** "Low poly" / "Voxel" değil — Meshy'nin **"Cartoon" veya "Stylized"** stilini seç,
  sonra Blender'da elle poly azaltma (decimate) yapacağız. Meshy'nin "PBR" texture çıktısını
  KULLANMA — bizim stilimiz düz/vertex renk (bkz. `gorsel-rehber.md`).
- **Negative prompt (her zaman ekle):** `realistic, photorealistic, high detail, hyperrealistic, dark, horror, blurry, noisy texture, complex pattern`
- **Topology:** Export ayarlarında "Quad" seç, sonra Blender'da poly bütçesine indir (rehberdeki
  limitler bağlayıcı).
- **Format:** `.glb` olarak indir.
- **Sonrası (Meshy sonrası Blender adımları — her model için):**
  1. Import → gereksiz iç geometriyi sil → Decimate ile poly bütçesine in.
  2. Malzemeyi düz renklere ayır (rehberdeki palet), tek texture atlas'a indir ya da vertex color'a çevir.
  3. Origin'i tabana al, transform'ları apply et (Ctrl+A).
  4. `frontend/public/models/` altına tam dosya adıyla export et.

---

## K1 — Dolmuş (`dolmus_base.glb`) 🚐

**Prompt:**
> "A small Turkish 'dolmuş' minibus (Ford Transit / Magirus style shuttle van), stylized
> cartoon low-poly game asset, boxy rounded shape, short front hood, sliding side door,
> chrome front grille, roof rack, bright yellow (#F2B705) body paint, simple flat shading,
> clean silhouette, no realistic textures, isometric game-ready asset, symmetrical, T-pose
> orientation facing forward"

**Ayarlar:** Symmetry: ON. Detail: Medium (fazla detay istemiyoruz, sonra decimate edeceğiz).

**Blender sonrası:**
- Tekerlekleri ayrı objelere böl: `wheel_fl`, `wheel_fr`, `wheel_rl`, `wheel_rr` (kodda
  döndürme animasyonu için gerekli).
- Kapı ayrı obje olabilir ama şimdilik zorunlu değil.
- Hedef: ≤4.000 üçgen.

**Dosya:** `frontend/public/models/dolmus_base.glb`

---

## K2 — Yolcu Karakterleri (3 adet) 🧍

Hepsi için ortak prompt gövdesi + karakter farkı. Aynı temel iskelet/oran kullan ki üretim hızlansın.

### Teyze
> "Cute stylized cartoon low-poly game character, short chubby proportions (2.5 heads tall),
> Turkish middle-aged woman wearing a headscarf and floral dress, carrying a net shopping bag
> (file), simple round black dot eyes, no facial detail, flat cel-shaded colors, T-pose,
> game-ready asset, single mesh, no rig needed"

### Öğrenci
> "Cute stylized cartoon low-poly game character, short chubby proportions (2.5 heads tall),
> young Turkish student with backpack, casual hoodie, simple round black dot eyes, no facial
> detail, flat cel-shaded colors, T-pose, game-ready asset, single mesh, no rig needed"

### Amca
> "Cute stylized cartoon low-poly game character, short chubby proportions (2.5 heads tall),
> elderly Turkish man with flat cap (kasket), holding prayer beads (tesbih), simple round
> black dot eyes, no facial detail, flat cel-shaded colors, T-pose, game-ready asset, single
> mesh, no rig needed"

**Blender sonrası:** her biri ≤1.500 üçgen, tek parça (rig/animasyon YOK — sallanma/zıplama
kodda yapılacak).

**Dosyalar:**
- `frontend/public/models/yolcu_teyze.glb`
- `frontend/public/models/yolcu_ogrenci.glb`
- `frontend/public/models/yolcu_amca.glb`

*(Not: bu dosya adları henüz `scene.ts`'te yok — yolcular Aşama 1'in bir sonraki adımında
koda bağlanacak. Kemal önce üretsin, biz `modelPath`'i ekleriz.)*

---

## K3 — Mahalle Kiti 🏘️

Her biniayı **ayrı ayrı** üret (tek "mahalle" olarak değil) — modüler olmalı, kodda tekrar tekrar
kullanılıyor.

### Cumbalı ev (varyasyon 1)
> "Small Turkish neighborhood house with a cumba (traditional bay window overhang), 2-story,
> stylized cartoon low-poly building, warm beige (#E8D5B5) facade, red tile roof, simple flat
> shading, no realistic texture, clean geometric silhouette, game-ready asset, front-facing"

**Dosya:** `frontend/public/models/bina_cumbali_01.glb`

### Cumbalı ev (varyasyon 2)
Aynı prompt, renk `#D98E73` (terracotta) yap, çatı eğimini biraz farklılaştır ("slightly
different roof angle and window layout for visual variety").

**Dosya:** `frontend/public/models/bina_cumbali_02.glb`

### Bakkal
> "Small Turkish corner grocery shop (bakkal), stylized cartoon low-poly building, green
> (#A8C4A2) awning/canopy over the entrance, crates of produce stacked outside, shop window
> with simple flat-colored goods, no realistic texture, game-ready asset, front-facing"

**Dosya:** `frontend/public/models/bina_bakkal.glb`

### Çay ocağı
> "Small Turkish tea house (çay ocağı) kiosk, stylized cartoon low-poly building, blue-gray
> (#8FA6BF) walls, small serving window, stacked tulip-shaped tea glasses visible on a tray,
> simple flat shading, no realistic texture, game-ready asset, front-facing"

**Dosya:** `frontend/public/models/bina_cayocagi.glb`

### Çınar ağacı (prop)
> "Large stylized cartoon low-poly plane tree (çınar), rounded low-poly foliage clusters in
> green (#6FA35E), thick simple trunk, no realistic bark texture, flat shading, game-ready
> asset, centered pivot at base"

**Dosya:** `frontend/public/models/prop_cinar.glb` (≤300 üçgen — küçük prop, ama görsel
ağırlığı olduğu için 200 limitinin biraz üstüne çıkabilir, sorun değil)

### Çöp kutusu (prop)
> "Small stylized cartoon low-poly street trash bin, dark gray (#4A4A52) metal cylinder with
> lid, simple flat shading, no realistic texture, game-ready asset, centered pivot at base"

**Dosya:** `frontend/public/models/prop_copkutusu.glb` (≤200 üçgen)

### Elektrik direği (prop — sonraki iterasyon, opsiyonel)
> "Simple stylized cartoon low-poly wooden utility pole with tangled cables, dark brown wood,
> flat shading, no realistic texture, game-ready asset, centered pivot at base"

**Dosya:** `frontend/public/models/prop_elektrikdiregi.glb`

---

## K4 — Durak Tabelası 🚏

> "Turkish public bus/dolmuş stop sign, stylized cartoon low-poly, simple metal pole with a
> flat rectangular yellow (#F2B705) sign on top showing a simple bus icon silhouette, green
> (#2E9E6B) accent stripe, flat shading, no realistic texture, game-ready asset, centered
> pivot at base"

**Dosya:** `frontend/public/models/prop_durak.glb`

---

## Önemli hatırlatma

Kod tarafı zaten hazır: `frontend/src/game/content/scene.ts`'teki her obje bir `modelPath`
bekliyor. Sen `.glb` dosyasını doğru isimle `frontend/public/models/` klasörüne koyduğun anda,
sahnedeki gri kutu **otomatik olarak** senin modelinle değişir — koda dokunmana gerek yok.
Yanlış/bozuk dosya varsa oyun çökmez, placeholder'a geri döner (bkz. ADR mimarisi).

Sıra: önce **K1 dolmuş** ve **K3'ten 2 bina + 1 çınar** (görsel olarak en çok fark yaratanlar),
gerisi arkadan gelsin.
