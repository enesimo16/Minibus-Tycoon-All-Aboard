# Fullfilled — MVP Şehir Haritası

Tarayıcıda çalışan minibüs durağı işletme oyununun ilk gerçek MVP haritası.

## Paket

| Dosya | MB | Ne için |
|---|---|---|
| **`Fullfilled_City_FINAL_DRACO.glb`** | 2.72 | **Üretim dosyası.** Tarayıcıya bunu yükle. |
| `Fullfilled_City_FINAL.glb` | 11.51 | Draco'suz aynı sahne (decoder istemeyen ortamlar için) |
| `Fullfilled_Prefabs.glb` | 3.03 | Spawn kütüphanesi: 10 araba, 14 karakter, 3 otobüs, durak tabelası |
| `vehicles/Fullfilled_Police_Car.glb` | 0.25 | Polis aracı (şehre gömülü değil) |
| `vehicles/Fullfilled_Taxi.glb` | 0.31 | Korsan taksi (şehre gömülü değil) |
| `city_data.json` | 0.02 | Rota, durak, spawn ve prefab referansı |
| `Fullfilled_City.blend` | 105 | Kaynak sahne (dokular gömülü) |
| `renders/` | | 5 referans görsel |

## Koordinat sistemi — önce bunu oku

`city_data.json` içindeki **tüm koordinatlar GLB ile birebir aynı uzayda**: glTF dünya uzayı, Y yukarı.

```
X = blender_x        Y = blender_z (yükseklik)        Z = -blender_y
```

- 2B `points` dizileri `[X, Z]` çiftidir.
- 3B `position` dizileri `[X, Y, Z]`'dir; `Y` gerçek zemin yüksekliğidir.
- `rotationY` radyandır.
- Bütün araç ve karakter prefablarında **ileri yön `-Z`** (Blender'da `+Y`).
- 1 birim ≈ 2.7 m.

> **Önemli:** Önceki `city_data.json`'da koordinatlar ham Blender `(x, y)` olarak yazılmıştı ve
> `z = -y` dönüşümü uygulanmamıştı. Elindeki eski rota polyline'ı o uzaya göreyse ikinci
> bileşenlerin işareti ters — bu dosyadaki değerlerle değiştir.

## Yol ve şerit

Ölçülmüş değerler (tahmin değil, yol dokusu taranarak çıkarıldı):

```
Yol modülü      3.436
Asfalt          2.792        →  şerit başına 1.396
Kaldırım        0.322 (her yanda)
Şerit merkezi   yol ekseni ± 0.698
```

`bus1` genişliği **1.074** → şerit/araç oranı **1.30** (brief 1.2–1.4 istiyordu ✓).
`bus1` sadece genişlikte %17 daraltıldı; boy 2.40'ta kaldı, yani karakter ölçeğiyle
uyumu bozulmadı ve en/boy oranı gerçek bir dolmuşa yaklaştı.

**Yol üstü temizlendi:** araç yüksekliğinde (z ≤ 1.6) asfalta taşan 506 prop tespit edildi;
490'ı dışarı itildi, binaya girecek 16'sı silindi. Şu an asfalt üstünde hiçbir prop yok.

## Duraklar

11 durak: 5 barınaklı (meydan) + 6 sadece tabelalı (ana caddeler).

> **Düzeltme:** STOP_01–05'in koordinatları önceki JSON'da barınağın *origin*'ini
> gösteriyordu, görsel konumunu değil — 1.275 birim sapma vardı (bir şeritten fazla).
> Bu dosyada hepsi görsel merkeze göre düzeltildi. STOP_06–11 zaten doğruydu.

Her durak kaydı:

```json
{ "id":"STOP_06", "position":[X,Y,Z], "rotationY":1.5708,
  "dock":[X,Z], "dockY":0.0, "type":"sign_only", "slots":3, "road":"vertical" }
```

`dock` = otobüsün duracağı **şerit üstü** nokta (duraktan en yakın şerit merkezine izdüşüm).
Meydandaki üç durak meydanın içinde olduğu için dock noktaları yola daha uzaktır; terminal
peronları ayrı bir alandır.

## Spawn noktaları — hiçbiri havada değil

Her nokta zemine ışın atılarak doğrulandı. Işın; prop, ağaç, tabela, araç ve barınak gibi
zemin olmayan her şeyi delip geçer, sadece yol karosu / parsel / taban plakasına takılır.
Yükseklik değeri `Y` alanında hazır geliyor, ayrıca yer bulma yapmana gerek yok.

| Anahtar | Adet | Ne |
|---|---|---|
| `stopSpawnPoints` | 38 | Duraklarda yolcu bekleme noktaları (durak başına 3–4, kaldırımda, çakışmasız) |
| `ambientSpawnPoints` | 98 | Kaldırımlarda rastgele yaya noktaları |
| `trafficRoutes` | 5 | Araba döngüleri (dış / orta / iç halka + 2 geçiş hattı) |
| `policeRoutes` | 2 | Geniş devriye + meydan denetimi |
| `taxiRoutes` | 2 | Korsan taksi kuzey ve güney hatları |

Rotalar şerit merkezlerinden geçer. Sağdan trafik: `ccw` döngüler dış şeridi, `cw` döngüler
iç şeridi kullanır. Her rotada `vehicleTypes` ve `count` alanı var.

## Yeni araçlar

Şehre **import edilmedi**, ayrı temiz GLB olarak duruyorlar:

| | Boyut (G×B×Y) | Tri | Materyal |
|---|---|---|---|
| Polis aracı | 0.716 × 2.05 × 0.648 | 5 616 | 14 |
| Taksi | 0.916 × 1.70 × 0.967 | 4 692 | 12 |

İkisinde de origin ayak izi merkezinde, taban `z=0`, ileri yön `+Y` (glTF'te `-Z`),
kamera/ışık yok, tek mesh. Polis dosyasında iki araç vardı; isimle tutarlı şekilde
ayrılıp biri alındı.

## Final GLB'de ne var, ne yok

**Var:** yollar, parseller, binalar, proplar, duraklar, taban plakası ve terminaldeki
dekor araçlar.
**Yok:** **karakter yok** (hiçbiri sahneye gömülü değil), kamera, ışık, empty/helper,
gizli mesh, spawn noktası objeleri, asset kütüphanesi.

Karakterlerin tamamı `Fullfilled_Prefabs.glb` içinde prefab olarak duruyor (14 adet).
Sahneye runtime'da `stopSpawnPoints` ve `ambientSpawnPoints` üzerinden sen koyacaksın.
Dekor araçlar (terminaldeki 6 peron + hattaki otobüsler ve arabalar, toplam 27) hâlâ
sahnede — onları da kaldırıp tamamen spawn'a bırakmak istersen `City_Vehicles`
koleksiyonunu silmek yeterli, başka hiçbir şey etkilenmez.

Spawn noktaları artık GLB'de değil — `city_data.json`'da. Prefablar da ayrı dosyada
(`Fullfilled_Prefabs.glb`), böylece haritayı ve varlıkları ayrı yükleyebilirsin.

## Yükleme

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
const loader = new GLTFLoader().setDRACOLoader(draco);

loader.load('Fullfilled_City_FINAL_DRACO.glb', g => scene.add(g.scene));

// spawn ornegi
const p = data.stopSpawnPoints[0].points[0];      // [X, Y, Z]
npc.position.set(p[0], p[1], p[2]);               // yukseklik hazir, duzeltme gerekmez
```
