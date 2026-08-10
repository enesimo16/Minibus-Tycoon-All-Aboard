# Kemal İçin — Dolmuşçu Portreleri (12 Adet) 🧑‍✈️

Bu iş **3D DEĞİL** — dolmuşçular tarayıcıda 2D illüstrasyon/portre olarak seçiliyor
(yönetim panelindeki "Dolmuşçu Seç" listesi). Karakterlerin oyun içi istatistikleri zaten
kodda tanımlı (`frontend/src/game/economy.ts` — `drivers` dizisi); senin işin her birine
görsel bir yüz vermek.

## Format

- **PNG, şeffaf arka plan**, kare kadraj, **512×512px**.
- Yüz + omuz hizası (baş-omuz portresi / "avatar" kadrajı), yarı-karikatür/stilize çizim —
  3D modellerimizle aynı "Sıcak Low-Poly Mahalle" ruhu ama **2D illüstrasyon** olarak (bkz.
  `gorsel-rehber.md` renk paleti/karakter stili — göz vb. detay burada biraz daha serbest,
  2D olduğu için yüz ifadesi/mimik çok daha önemli).
- **Kişilik yüzden okunmalı**: hızlı/agresif olan asık suratlı-esprili, sakin olan gülümseyen,
  vs. İstatistiklere göre ifade seç (aşağıda her biri için ipucu var).
- Dosya adı: `frontend/public/drivers/{id}.png` — id'ler aşağıdaki tabloda birebir.

## Roster (istatistikler zaten kodda, sen sadece görsele bak)

| id | İsim "Lakap" | Hız | Verim | Maaş payı | Kişilik ipucu (yüz ifadesi) |
|---|---|---|---|---|---|
| `sukru` | Şükrü "Şimşek" | %130 | %65 | %35 | Aceleci, sabırsız bakış, biraz asabi gülümseme |
| `ramazan` | Ramazan "Sakin" | %100 | %85 | %20 | Huzurlu, güven veren, hafif gülümseme |
| `cevdet` | Cevdet "Kurt" | %110 | %80 | %25 | Tecrübeli, bıyıklı, kendinden emin |
| `turgut` | Turgut "Tribün" | %120 | %70 | %30 | Taraftar atkısı/forması, enerjik, bağırır gibi |
| `naciye` | Naciye "Hanım Şoför" | %95 | %90 | %22 | Dikkatli, şık başörtüsü, sakin gülümseme |
| `aziz` | Aziz "Amca" | %90 | %82 | %18 | Yaşlı, kasketli, babacan tebessüm |
| `deniz` | Deniz "Yeni Nesil" | %115 | %75 | %28 | Genç, kulaklıklı/şapkalı, kayıtsız/rahat ifade |
| `hasan` | Hasan "Fırtına" | %135 | %60 | %40 | En agresif — kaşları çatık, sinirli-hızlı bakış |
| `fatma` | Fatma "Tedbirli" | %85 | %92 | %15 | En sakin/güvenilir — gözlüklü, ciddi ama sıcak |
| `ibrahim` | İbrahim "Orta Yol" | %100 | %78 | %24 | Standart/dengeli, nötr-samimi ifade |
| `nazmi` | Nazmi "Gazcı" | %125 | %68 | %32 | Sırıtkan, gaza basmaya hevesli, şapka ters |
| `ayse` | Ayşe "Tez Canlı" | %110 | %83 | %23 | Enerjik ama dikkatli, canlı gülümseme |

## Teslim

`frontend/public/drivers/` klasörüne yukarıdaki id'lerle (`sukru.png`, `ramazan.png`, ...)
koy. Kod zaten bu yolları (`/drivers/{id}.png`) bekliyor — dosya doğru isimle gelince yönetim
panelindeki liste otomatik gerçek portreyle görünür (şu an placeholder yok, sadece isim/istatistik
metni gösteriliyor — portre eklenince kod tarafında `<img>` render'ı ben eklerim).

## Sıra

Öncelik: **sukru, ramazan, hasan, fatma** (en uç karakterler — hız/verim tezatı en belirgin
olanlar, ilk izlenimi verirler), gerisi arkadan gelsin.
