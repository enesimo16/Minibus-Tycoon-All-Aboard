# Kemal İçin Görsel Rehber 🎨

Bu doküman senin anayasan Kemal. Her asset bu kurallara uyarsa oyun bütün ve profesyonel görünür.

## Sanat yönü: "Sıcak Low-Poly Mahalle"

- **Stil:** Low-poly (az poligonlu), yumuşak renkler, **doku (texture) minimum** — renkler
  malzemeden (flat/vertex color) gelsin. Referanslar: Crossy Road, "Assemble with Care",
  Kenney.nl asset paketleri, BenelOil'in okunaklılığı.
- **Neden low-poly?** 1) Tarayıcıda hızlı yüklenir/akar. 2) İki kişilik ekiple üretilebilir.
  3) Stil tutarlılığı kolay — kötü görünmesi zordur.
- **Kimlik:** Türkiye mahallesi hissi şart: cumbalı evler, çay ocağı, bakkal önü kasalar,
  elektrik direkleri arası çamaşır ipi, kaldırım taşı deseni, çınar ağacı.

## Renk paleti (başlangıç — birlikte revize ederiz)

| Kullanım | Renk |
|---|---|
| Dolmuş sarısı (ana marka rengi) | `#F2B705` |
| Yol asfaltı | `#4A4A52` |
| Kaldırım | `#C9BFAE` |
| Ev cepheleri (3-4 varyasyon) | `#E8D5B5`, `#D98E73`, `#A8C4A2`, `#8FA6BF` |
| Yeşillik | `#6FA35E` |
| Gökyüzü (gündüz) | `#BFE3F0` |
| UI vurgu / para | `#2E9E6B` |
| Tehlike / Dikkat Çubuğu | `#D94F30` |

Kural: bir sahnede en fazla 6-7 ana renk ailesi. Doygunluğu düşük tut, "şeker" görünmesin.

## Teknik spesifikasyonlar (her model için geçerli)

- **Format:** `.glb` (glTF binary). Blender'dan direkt export.
- **Ölçek:** 1 birim = 1 metre. Dolmuş ~5.5m uzunlukta. Export öncesi transform apply
  (Ctrl+A), origin nesnenin taban merkezinde.
- **Poly bütçeleri:** dolmuş ≤ 4.000 üçgen; yolcu karakteri ≤ 1.500; bina ≤ 800;
  küçük prop (çöp kutusu, direk) ≤ 200.
- **Malzeme:** tek malzeme + vertex color tercih; doku şartsa tek 512x512 atlas.
- **İsimlendirme:** `dolmus_base.glb`, `bina_cumbali_01.glb`, `prop_cayocagi.glb` gibi —
  küçük harf, Türkçe karaktersiz, snake_case.
- **Teslim yeri:** `frontend/public/models/` (kod placeholder'ı otomatik bununla değiştirecek).
- Rigging/animasyon şimdilik YOK: yolcular tek parça, hareketleri kod tarafında (zıplama,
  sallanma) verilecek. Tekerlekler ayrı obje olsun (`wheel_fl` gibi) — kodda döndüreceğiz.

## Karakter stili

- Yolcular: kısa-tombul oranlı (2.5 kafa boyu), yüz detayı minimal (göz = siyah nokta).
- Çeşitlilik önemli: teyze (filesiyle), öğrenci (çantalı), amca (tesbihli), takım elbiseli.
  Aynı gövde + farklı renk/aksesuar yaklaşımı üretimi hızlandırır.
- Şoför portreleri: UI'da görünecek 256x256 stilize büst render'ları (3D modelden render
  almak yeterli, ayrı illüstrasyon gerekmez).

## UI görsel dili

- Yuvarlatılmış köşeler (12px), kalın okunaklı yazı, dolmuş sarısı vurgu.
- Konuşma baloncukları çizgi roman tarzı; mizah metinleri UI'ın yıldızı, onları ezme.
- İkonlar tek renk + dolgu, 24px grid.

## Hazır varlık paketleri (Sketchfab vb.)

Her şeyi sıfırdan modellemek zorunda değiliz — **dolgu/jenerik** binalar ve prop'lar için hazır
paket kullanmak makul (bkz. `CREDITS.md`, K11 görevi). Kural:
- **Hero binalar** (bakkal, çay ocağı, cumbalı ev — Türk mahallesi kimliğini veren şeyler)
  HER ZAMAN özel üretilir (Meshy prompt + Blender). Paketten asla alınmaz.
- **Dolgu binalar/prop'lar** (arka plandaki genel yapılar, trafik prop'ları, ağaçlar) paketten
  seçilebilir. Basit/düşük katlı, low-poly stilimize yakın olanları seç.
- Kullanılan her paket `CREDITS.md`'ye eklenir, lisansı (özellikle atıf/CC-BY) kontrol edilir.
- Poly bütçesi dolgu için biraz esnek (≤1.500) ama hero binalar için ≤800 kuralı hâlâ geçerli.

## İş akışı

1. Enes/Codex `gorev-listesi.md`'ye spesifikasyonlu iş ekler.
2. Kemal Blender'da yapar, `.glb`'yi `frontend/public/models/`e koyar, listede işaretler.
3. Kod placeholder'ı gerçek modelle değiştirir; oyun içi görüntüyü birlikte kontrol ederiz.
4. İlk iş her zaman **blockout** (kaba form) → onay → detay. Detaya onaysız girme.
