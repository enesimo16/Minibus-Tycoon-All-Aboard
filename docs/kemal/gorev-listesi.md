# Kemal Görev Listesi ✅

> **Model teslim kuralları (Faz 4 sonrası — koda dokunmadan çalışır):**
> 1. **Dosya adı ve klasör yapısı birebir korunmalı.** Kod `public/models/...` altındaki
>    yolları arar; ad değişirse model yüklenmez, placeholder'a düşer.
> 2. **Yükseklik derdi yok:** artık her araç `content/groundAlign.ts` ile kendi sınır
>    kutusundan yere oturtuluyor. Modeli origin'i neresi olursa olsun teslim edebilirsin.
> 3. **Ölçek ve yön** mevcut modellerle aynı birimde olsun (araçlar +X'e bakar).
> 4. **Şehir GLB'si Draco sıkıştırmalı** kalsın (Blender glTF export → Compression).
> 5. **FBX texture'ları ayrı PNG** olarak yanında gelsin, adlarını değiştirme.
> 6. **Yeni model tipi** eklersen (yeni araç sınıfı gibi) dosyayı at, kod bağlamasını Enes yapar.
>    Bina/prop için kod gerekmez: `scene.ts` + **E** tuşuyla açılan editörden ekleyebilirsin.

## Faz 4 ile açılan yeni işler

- [ ] **K-BUS-2 — Midibüs modeli** (`public/models/vehicles/midibus.glb`): Şu an
  `bus2.glb` geçici olarak kullanılıyor. 14 koltukluk gövde, dolmuştan belirgin uzun.
  ≤6.000 üçgen. Katalogdaki adı: "Midibüs" (`content/busCatalog.ts`).
- [ ] **K-BUS-3 — Premium şehir otobüsü** (`public/models/vehicles/premium.glb`): Şu an
  `bus3.glb` geçici. 20 koltuk, modern/prestijli hat. ≤8.000 üçgen.
- [ ] **K-STOP-1 — Durak yerleşimi**: Her sokağa 1 durak hedefi. Duraklar
  `route.ts → STARTER_STOP_LAYOUT` içinde konumlanıyor; yerleşimi editörle çıkarıp
  JSON olarak ver, Enes bağlar. Yerleşimi olmayan hatlar şehir verisindeki dock
  noktasına düşüyor (çalışır ama estetik değil).
- [ ] **K-HURDA — 3 hurda araç ayrımı**: Tutorial'da oyuncu 3 hurda arasından seçecek
  (Faz 5). Şu an üçü de `bus1.glb`. Üç ayrı boyalı/yıpranmış varyant iyi olur:
  `hurda_mavi.glb`, `hurda_sari.glb`, `hurda_yesil.glb`.

Sıra önem sırasıdır. Her iş `gorsel-rehber.md` spesifikasyonlarına uyar.
**Meshy.ai ile başlangıç mesh'i üretmek için hazır promptlar `meshy-promptlari.md`'de —
onları kopyala/yapıştır, Blender'da işle, aşağıdaki tam dosya adıyla teslim et.**
Bitince `[x]` işaretle ve dosya adını yaz.

## Aşama 1 için (ŞİMDİ lazım)

- [ ] **K1 — Dolmuş modeli** (`dolmus_base.glb`): Klasik Magirus/kısa minibüs silüeti,
  dolmuş sarısı, ayrı tekerlek objeleri (`wheel_fl/fr/rl/rr`), kapı tek parça.
  ≤4.000 üçgen. ÖNCE blockout at, onaydan sonra detaylandır. Meshy prompt: bkz. K1.
- [ ] **K2 — Yolcu seti (10 karakter)**: `yolcu_teyze.glb`, `yolcu_ogrenci.glb`,
  `yolcu_amca.glb`, `yolcu_memur.glb`, `yolcu_isci.glb`, `yolcu_evhanimi.glb`,
  `yolcu_genckiz.glb`, `yolcu_dede.glb`, `yolcu_cocuk.glb`, `yolcu_turist.glb`.
  Aynı gövde tabanı, farklı renk/aksesuar. Her biri ≤1.500 üçgen, tek parça (animasyon yok).
  **Tam Meshy promptları + öncelik sırası: `docs/kemal/karakterler.md`** (ayrı doküman).
- [ ] **K3 — Mahalle kiti v1**: `bina_cumbali_01.glb`, `bina_cumbali_02.glb`,
  `bina_bakkal.glb`, `bina_cayocagi.glb`, `prop_cinar.glb`, `prop_copkutusu.glb`.
  Her bina ≤800, prop ≤300 üçgen. Modüler düşün. Meshy prompt: bkz. K3.
  Bu 7 obje zaten `frontend/src/game/content/scene.ts`'te tanımlı — dosyayı doğru
  isimle `frontend/public/models/`e koyunca sahnede otomatik görünür, kod değişmez.
- [ ] **K4 — Durak tabelası** (`prop_durak.glb`) + yol dokusunun renk kararı: asfalt/kaldırım/
  şerit renk denemesi, ekran görüntüsüyle öneri getir. Meshy prompt: bkz. K4.
- [ ] **K12 — Final şehir düzenleme pass'i** (`Fullfilled_City_FINAL.glb`):
  **Kemal şunu yapsın:** mevcut Drive klasöründeki `Fullfilled_City_OPTIMIZED.glb`,
  `city_data.json`, `BUSSIGN.glb` ve `bus1/bus2/bus3.glb` dosyalarını baz alarak şehirde
  yolları netleştir, iki şeritli yol okunurluğunu artır, 11 durağa bus stop/sign yerleştir,
  her durakta 3-4 karakterlik temiz bekleme alanı bırak. Teknik brief:
  `docs/kemal/blender-sehir-final-prompt.md`.
- [ ] **K11 — Sketchfab dolgu mahalle paketi entegrasyonu** (Enes onayladı, `CREDITS.md`'ye bakıldı):
  1. https://sketchfab.com/3d-models/simple-cartoon-city-mega-pack-free-download-8d5e54ad61a34fd9b36958e56904ca49
     adresinden paketi indir (CC-BY — kaynağa atıf zorunlu, bu yüzden `CREDITS.md` zaten eklendi).
  2. Küçük dolmuş-mahallesi ölçeğine uyan **8 basit bina** seç (gökdelen/çok katlı olmayan,
     2-3 katlı sade yapılar). Blender'da tek tek aç, gerekirse ≤1.500 üçgene decimate et
     (bu paket fillerdir, hero binalardan daha esnek bütçeye izin var).
  3. `pack_building_01.glb` ... `pack_building_08.glb` olarak `frontend/public/models/pack/`
     klasörüne koy — kod bu isimleri zaten `content/scene.ts`'te bekliyor, otomatik görünür.
  4. İstersen 5-6 uygun prop/ağaç da `pack_prop_01.glb` vb. adla aynı klasöre ekle (opsiyonel,
     kod henüz bunları referans almıyor — eklersen `scene.ts`'e satır olarak ben/Enes ekleriz).
  5. Yerleşim kaba/otomatik dizilmiş durumda (geniş bir halka) — tarayıcıda **E** tuşuyla
     editörü aç, binaları göze hoş gelecek şekilde sürükle/döndür, "JSON Kopyala" ile
     `scene.ts`'e yapıştır.
  (Oyun içi Krediler paneli Codex tarafından koda eklendi — `CreditsButton.tsx`, K11'in
  görsel/metin kısmı senin işin değil.)

## Aşama 2 için (sırada)

- [ ] **K5 — Şoför portreleri** (3 adet, 256x256 render): Şükrü (hızlı/dağınık),
  Ramazan (sakin/güvenilir), Cevdet (yaşlı kurt).
- [ ] **K6 — Dolmuş süsleme seti**: nazar boncuğu, boncuklu perde, arka cam yazısı
  ("Maşallah", "Sabreden Derviş..."), zar. Dolmuşa takılabilir ayrı `.glb`'ler.
- [ ] **K7 — UI ikon seti v1** (24px): para, koltuk, motor, şoför, memnuniyet, dikkat/polis.

## Aşama 3+ (bekleyebilir)

- [ ] **K8 — Polis/zabıta aracı + denetim noktası** (Dikkat sistemi görseli).
- [ ] **K9 — İkinci mahalle kiti** (daha zengin semt: apartmanlar, cafe).
- [ ] **K10 — Logo / FullFilled yazı karakteri denemesi.**

## Yeni cikan gorsel isler

- [ ] **K13 - Yol/cevre temizlik ve serit okunurlugu pass'i** (`Fullfilled_City_FINAL_DRACO.glb` revizyonu):
  **Kemal sunu yapsin:** mevcut sehir modelinde cift seritli yollari oyun kamerasindan net okunacak
  sekilde duzenle; sehir disi/oyun alani kenarinda kalan arac, agac ve prop kalabaligini azalt veya
  yol disina hizala. Teknik brief: yol eksenleri `city_data.json > grid.roadAxesX/Z`, serit merkezi
  `axis +/- laneOffset` (0.698). Asfalt ustunde arac/agac/prop kalmasin; durak cevresinde en az
  1.5m bos bekleme alani birak. Stil: sicak low-poly mahalle, mevcut paletle uyumlu. Format `.glb`,
  Draco sikistirmali teslim, ana sehir toplam draw/mesh sayisini artirma; mumkunse mevcut materyalleri
  reuse et.
- [ ] **K14 - Sans oyunlari UI asset seti**:
  **Kemal sunu yapsin:** Mahalle Carki paneli icin 2D UI asset seti hazirla: cark govdesi, ok/ibrelik,
  6 dilim rengi, kucuk zar/kupon ikonlari ve jackpot rozeti. Stil mevcut HUD ile uyumlu, okunakli,
  fazla parlak olmayan low-poly/arcade. Format PNG/WebP, transparent background; cark 1024x1024,
  ikonlar 128x128 ve 24px'e inince okunur olmali. Kod tarafinda su an CSS placeholder var, assetler
  gelince `ChanceGamesPanel.tsx` icinde kolayca degistirilecek.
- [ ] **K15 - Durak yolcusu mini karakter seti**:
  **Kemal sunu yapsin:** duraklarda bekleyen yolcular icin 8-10 adet dusuk poly karakter hazirla.
  Teknik spec: her karakter 1.5k-3k tris, tek materyal veya en fazla 2 materyal, animasyonsuz,
  sehirdeki cartoon/low-poly stile uygun. Format `.glb`; teslim klasoru `frontend/public/models/people/`.
  Onerilen adlar: `passenger_student.glb`, `passenger_aunt.glb`, `passenger_worker.glb`,
  `passenger_officer.glb`, `passenger_elder.glb`, `passenger_child.glb`, `passenger_tourist.glb`,
  `passenger_casual.glb`. Kodda su an ilk durakta gorunen placeholder insanlar var; modeller gelince
  `MvpWorld.tsx` icindeki fallback kolayca gercek assetlerle degistirilecek.

## Notlar

- Model gelene kadar kodda gri kutular oynuyor — geciken iş oyunu durdurmaz, çirkinleştirir. 🙂
- Yeni görsel ihtiyaç çıktıkça buraya "K##" numarasıyla eklenecek.

## 2026-08-08 — asset dönüşüm işleri (Claude'dan)

- [ ] **K16 — Yolcu karakterleri GLB'ye çevrilecek**: `public/models/characters/people/`
      altındaki 8 FBX (~2 MB/dosya) → GLB + Draco. Hedef: dosya başına **< 400 KB**,
      iskelet ve tek "idle/walk" animasyon klibi korunacak, doku atlası 512×512'ye
      indirilecek. Dönüşüm sonrası `content/CharacterModel.tsx` içinde `useFBX` →
      `useGLTF` değişecek (tek satır, başka kod etkilenmez).
- [ ] **K17 — City Pack entegrasyonu**: `City Pack` içindeki OBJ/FBX binalar
      (Apartment, Bar, Hospital, Hotel, Skyscraper, Town House, Large Building…) →
      GLB + Draco, bina başına **< 300 KB**. Dosyalar `public/models/city/props/`
      altına. Yerleştirme kod gerektirmez: `content/scene.ts` içine `PropDef` kaydı
      eklenecek (E tuşuyla editörden sürükleyip "JSON Kopyala" ile alınabilir).
      **Hat geometrisine dokunulmayacak.**
- [ ] **K18 — Tren paketi**: `Railway Track Straight/Curve` + `Locomotive Front` +
      `Locomotive PassengerWagon` → GLB + Draco. Ray parçaları modüler olacak şekilde
      orijini uçta ve eksene hizalı olmalı (birbirine eklenebilsin). Hedef: ray parçası
      < 120 KB, vagon < 350 KB.
