# Sans Oyunlari Sistemi

Bu dokuman, FullFilled icindeki sans oyunlari sekmesinin ilk tasarim fikrini anlatir.
Amac, oyuncuya ana dolmus ekonomisi disinda riskli ama heyecanli para artirma yolları vermektir.
Ana oyun dongusu yine dolmus surmek, hat almak, sofor atamak ve pasif gelir kurmaktir. Sans oyunlari
bu donguyu destekleyen, oyuncunun buyuk yatirimlara daha hizli ulasmasini saglayabilen yan sistemdir.

## Temel Amac

Sans oyunlari oyuncuya sureklilik saglamali:

- Oyuncu her gun oyuna girdiginde deneyecek kucuk bir sans hakki bulmali.
- Dolmus/hat/otobus fiyatlari milyonluk oldugu icin oyuncu zaman zaman buyuk sicrama sansi yakalamali.
- Kaybetme riski olmali; aksi halde ekonomi tamamen bozulur.
- Oyuncu tum parasini bir anda yakip oyunu kilitlememeli. Bunun icin gunluk limit, bahis limiti veya kilitli seviye sistemi kullanilmali.
- Oyunlar dolmus temasiyla uyumlu olmali: mahalle, durak, plaka, yolcu, sofor, polis, hat disi isler gibi ogeler kullanilmali.

## Ekonomi Prensibi

Sans oyunlari ana ekonomi acigini kapatan ama garantili olmayan sistemlerdir.

- Kucuk oyunlar: sik oynanir, oduller dusuk/orta, beklenen geri donus kontrollu olur.
- Riskli oyunlar: oyuncu kazanci katlama sansi bulur ama yanlis kararda para kaybeder.
- Buyuk oyunlar: nadir kazanilir, oduller otobus veya hat alimini hizlandiracak kadar buyuk olabilir.

Beklenen deger genel olarak hafif negatif veya dengeli tutulmali:

- Kucuk oyunlar yaklasik %85-95 geri donus verebilir.
- Riskli oyunlar oyuncu erken cikarsa makul, fazla zorlarsa tehlikeli olmali.
- Buyuk piyango dusuk ihtimalli ama yuksek odullu olmali.

## Gunluk Limit

Oyuncunun tum parasini tek sekmede kaybetmesini engellemek icin gunluk oyun limiti olmali.

Ornek:

- Baslangic gunluk sans oyunu limiti: 50.000 TL.
- Oyuncu ilerledikce limit artar.
- Yeni hat satin alindiginda veya daha fazla otobus sahibi olundugunda limit yukselebilir.
- Bazi yasa disi oyunlar limit disi oynanabilir ama polis riskini arttirir.

Bu limit iki sekilde uygulanabilir:

- Gunluk toplam bahis limiti.
- Her oyun icin gunluk hak/deneme sayisi.

## Sans Oyunlari Sekmesi

UI icinde ayri bir "Sans Oyunlari" sekmesi olur.

Sekmede gorulecek temel bilgiler:

- Bugunku kullanilan bahis limiti.
- Kalan gunluk limit.
- Oyuncunun kasasi.
- Aktif oyun kartlari.
- Her oyunun giris ucreti.
- Olası odul araligi.
- Risk seviyesi.
- Gunluk kalan deneme hakki.
- Son oynanan sonuclar.

Oyun kartlari net ve kisa olmali. Oyuncu bir karttan oyuna girer, sonucu aninda gorur.

## Oyun 1: Mahalle Carki

Mahalle Carki, ilk eklenecek sans oyunlarindan biri olabilir. Tema olarak durak yaninda duran basit bir cark gibi dusunulur.

### Mantik

Oyuncu belirli bir ucret oder ve carki cevirir. Cark bir segmente denk gelir.

Ornek giris ucretleri:

- Baslangic: 2.500 TL
- Orta seviye: 10.000 TL
- Ileri seviye: 50.000 TL

### Cark Segmentleri

Ornek segmentler:

- Bos: odul yok.
- Kucuk odul: bahis 1.2x.
- Orta odul: bahis 2x.
- Buyuk odul: bahis 5x.
- Nadir odul: bahis 20x.
- Sofor bonusu: bir gunluk sofor verimi +%5.
- Yakıt/masraf indirimi: o gun pasif gider azalir.
- Polis kontrolu: kucuk polis riski artisi veya direkt kucuk ceza.
- Hat disi teklif kuponu: sonraki hat disi teklifin odulu artar.

### Neden Iyi

- Anlasilmasi kolay.
- UI olarak basit.
- Gorsel olarak tatmin edici.
- Gunluk giris aliskanligi yaratir.

## Oyun 2: Tek/Cift Plaka

Dolmus temasina en uygun basit sans oyunudur.

### Mantik

Oyuncu gelen rastgele aracin plakasinin son hanesini tahmin eder:

- Tek
- Cift

Dogru tahmin ederse bahis yaklasik 1.8x doner. Yanlis tahminde bahis kaybolur.

### Gelismis Versiyon

Oyuncu sadece tek/cift degil, daha riskli secenekler de oynayabilir:

- Son hane 0-4 arasi.
- Son hane 5-9 arasi.
- Son hane tam sayi tahmini.

Odul carpanlari:

- Tek/Cift: 1.8x
- Dusuk/Yuksek: 1.8x
- Tam hane: 8x-9x

### Neden Iyi

- Hizli oynanir.
- Plaka ve trafik temasi oyuna uyar.
- Basit MVP icin uygundur.

## Oyun 3: Gunluk Piyango

Bu sistem buyuk para sicrama sansi verir.

### Mantik

Oyuncu gunluk piyango bileti alir. Cekilis oyun gunu sonunda veya belirli zaman araliginda yapilir.

Ornek bilet ucreti:

- 25.000 TL

Ornek odul havuzu:

- Kucuk odul: 50.000-100.000 TL
- Orta odul: 250.000-750.000 TL
- Buyuk odul: 1.000.000-5.000.000 TL

### Kural

- Oyuncu gunde sinirli sayida bilet alabilir.
- Daha fazla bilet daha fazla sans verir.
- Buyuk odul cok nadir gelmeli.
- Bilet almak gunluk sans oyunu limitinden dusmeli.

### Neden Iyi

- Milyonluk otobus ve hat fiyatlari icin umut verir.
- Oyuncuya uzun vadeli beklenti olusturur.
- Ana ekonomiyi tamamen bozmaz cunku kazanma ihtimali dusuktur.

## Oyun 4: Riskli Zarf

Oyuncuya 3 veya 5 zarf gosterilir. Her zarfin icinde farkli sonuc vardir.

### Ornek 3 Zarf

- Bir zarf: odul.
- Bir zarf: bos.
- Bir zarf: ceza/kayip.

### Ornek Sonuclar

- Bahis 3x.
- Bahis geri.
- Bahis kaybi.
- Polis riski +10.
- Memnuniyet -5.
- Bir gunluk sofor bonusu.

### Neden Iyi

- Cok hizli oynanir.
- Risk net hissedilir.
- Illegal oyunlara da kolay baglanir.

## Oyun 5: Durak Kuponu

Bu en ozgun sistem olabilir cunku dogrudan oyuncunun ana oyun performansina baglanir.

### Mantik

Oyuncu gun basinda veya vardiya basinda tahmin kuponu yapar.

Ornek tahminler:

- Bugun en az 80 yolcu tasirim.
- Bugun 10 kez DUR secerim.
- Bugun hic polis cezası yemem.
- Bugun 3 hat disi teklif kabul ederim.
- Bugun memnuniyeti 60'in altina dusurmem.
- Bugun 50.000 TL kazanirim.

Oyuncu bu tahminlerden bir veya birkacini secer. Tahmin tuttukca odul carpanı artar.

### Ornek

Tek tahmin:

- Bahis 10.000 TL.
- Tahmin tutarsa 1.8x.

Uc tahminli kupon:

- Bahis 10.000 TL.
- Hepsi tutarsa 5x.
- Biri bile tutmazsa bahis gider.

### Neden Iyi

- Sans ile beceriyi karistirir.
- Oyuncuyu ana oyunu daha dikkatli oynamaya iter.
- Sureklilik saglar cunku her gun yeni kupon kurulur.

## Oyun 6: Minibuscu Tombalasi

Gunluk olay karti gibi calisir.

### Mantik

Oyuncuya bir tombala karti verilir. Kartta gun icinde gerceklesebilecek olaylar vardir.

Ornek kutular:

- Ogrenci yolcu geldi.
- Para ustu sorusu geldi.
- Hat disi teklif geldi.
- Polis riski 50'yi gecti.
- Bir durakta 5+ yolcu bindi.
- Musait yerde inmek isteyen yolcu geldi.
- Sabah piki basladi.
- Bir sofor vardiyasi tamamlandi.

Oyuncu gun icinde kutulari doldurdukca odul alir.

### Odul Tipleri

- Satir tamamla: kucuk para.
- Kartin yarisi: orta para.
- Tam kart: buyuk odul veya nadir bonus.

### Neden Iyi

- Oyuncuyu gunluk donguye baglar.
- Direkt para basmak yerine ana oyun olaylarini degerli yapar.
- Uzun vadeli basari hissi verir.

## Yasal ve Yasa Disi Oyun Ayrimi

Sans oyunlari iki kategoriye ayrilabilir.

### Yasal Oyunlar

- Gunluk piyango.
- Mahalle carki.
- Basit plaka tahmini.
- Durak kuponu.

Yasal oyunlar polis riskini arttirmaz ama gunluk limite takilir.

### Yasa Disi Oyunlar

- Limit disi zarf oyunu.
- Gece oynanan gizli masa.
- Yuksek bahisli plaka tahmini.
- Hat disi gelirle acilan karanlik oyunlar.

Yasa disi oyunlar daha yuksek odul verir ama `policeRisk` arttirir.

Ornek:

- Yasal plaka tahmini: 10.000 TL bahis, 1.8x odul, polis riski yok.
- Yasa disi plaka tahmini: 100.000 TL bahis, 2.2x odul, polis riski +8.

## Polis Sistemiyle Baglanti

Mevcut global polis sistemi sans oyunlariyla baglanabilir.

Risk ekleyebilecek durumlar:

- Gunluk limit asimi.
- Yasa disi oyun oynamak.
- Gece gizli oyunlara girmek.
- Hat disi gelirle yuksek bahis acmak.
- Art arda cok buyuk bahis yapmak.

Bu durumda sans oyunlari sadece para sistemi olmaz, oyunun risk ekonomisine de baglanir.

## Oyuncu Koruma ve Denge

Oyuncunun tamamen batmasini engellemek icin:

- Ilk seviyelerde maksimum bahis dusuk tutulur.
- Gunluk limit olur.
- Oyuncunun son parasiyla buyuk bahis yapmasi engellenebilir.
- Piyango bileti sayisi sinirli olur.
- Yasa disi oyunlar ilerleme ile acilir.
- Kaybedince ufak teselli odulleri verilebilir.

Teselli odulu ornekleri:

- 1 gunluk kucuk memnuniyet bonusu.
- Sofor yorgunlugu azaltma.
- Kucuk indirim kuponu.
- Bir sonraki cark cevirisine +%5 sans.

## Ilerleme ve Kilit Acma

Sans oyunlari baslangicta hepsi acik olmamali.

Ornek kilit sirasi:

1. Baslangic: Mahalle Carki ve Tek/Cift Plaka.
2. Ilk hat satin alindiginda: Gunluk Piyango.
3. Ilk ek otobus alindiginda: Durak Kuponu.
4. Polis seviyesi veya hat disi mekanigi acildiginda: Yasa disi oyunlar.
5. 3+ sofor yonetildiginde: Minibuscu Tombalasi.

Bu sayede oyuncu yeni sistemleri tek tek ogrenir.

## Ilk MVP Onerisi

Ilk surumde sadece 3 oyun yapmak yeterli:

1. Mahalle Carki
2. Tek/Cift Plaka
3. Gunluk Piyango

Bu uc oyunla:

- Hizli oyun var.
- Gunluk aliskanlik var.
- Buyuk odul umudu var.
- UI cok karisik olmaz.

Durak Kuponu ve Minibuscu Tombalasi ikinci iterasyonda eklenmeli. Cunku onlar ana oyun datasina
daha fazla baglidir ve daha dikkatli test ister.

## Ilk Uygulama Karari

Sans oyunlari ust panelin icine gomulmez. Ust sag ikon grubuna kucuk bir sans/zar ikonu eklenir;
tiklayinca sagdan buyuk bir panel acilir. Panel desktop'ta genis bir drawer gibi, mobilde neredeyse
tam ekran gibi calisir.

Ilk kodlanacak oyun **Mahalle Carki**dir:

- Sonuc backend tarafinda uretilir.
- Frontend spin oncesi mevcut save'i backend'e yollar.
- Backend oyuncunun parasini, gunluk limitini ve spin hakkini kontrol eder.
- Segment agirliklari `shared/economy.json > chanceGames.wheel.segments` icinden okunur.
- Backend para sonucunu ve `chanceGames` gunluk state'ini kayda yazar.
- Frontend sadece gelen sonucu animasyonla gosterir.

Bu karar, carkin client tarafindan manipule edilmesini zorlastirir ve ileride Tek/Cift Plaka ile
Gunluk Piyango endpoint'lerinin ayni pattern ile eklenmesini kolaylastirir.

## UI Taslak

Sans Oyunlari paneli su bolumlerden olusabilir:

- Ust bar: kasa, gunluk limit, kullanilan limit.
- Oyun kartlari: her oyun icin kart.
- Sonuclar paneli: son 5 oyun sonucu.
- Risk etiketi: yasal / yasa disi.
- Buyuk odul alani: piyango veya jackpot bilgisi.

Kart uzerinde:

- Oyun adi.
- Kisa aciklama.
- Bahis miktari.
- Olası odul.
- Gunluk kalan hak.
- Oyna butonu.

## Uzun Vadeli Fikirler

- Jackpot havuzu: oyuncu kaybettikce havuz buyur, nadiren patlar.
- Sosyal rekabet: oyuncular haftalik piyango veya kupon skorunda siralanir.
- Mahalle etkinligi: bayram, mac gunu, yagmur gibi gunlerde sans oyunlari degisir.
- Kara para sistemi: hat disi kazanclar yasa disi oyunlarda daha yuksek carpan acar.
- Polis baskini: yasa disi oyunlarda risk 100 olursa sadece ceza degil, o gun oyun sekmesi kapanabilir.
- Sponsoresiz temiz oyun modu: daha dusuk odul ama polis riski yok.

## Ana Karar

Sans oyunlari oyunu tasiyan ana sistem olmamali; ana sistem dolmus isletmeciligi kalmali.
Sans oyunlari, oyuncunun buyuk hedeflere ulasirken heyecanli riskler almasini saglayan yan ekonomi
motoru olmali.

## Uygulanan MVP: Mahalle Carki

Mahalle Carki ilk aktif sans oyunudur. Panel ust sagdaki sans/zar ikonundan acilir ve sagdan
buyuk drawer olarak gelir. Tasarim su an CSS placeholder ile calisir; Kemal assetleri gelince
cark gorseli degistirilecek.

### Backend Akisi

- Endpoint: `POST /api/chance/wheel/spin/{playerId}`
- Frontend spin oncesi mevcut save'i backend'e yollar.
- Backend oyuncunun parasini, gunluk limitini ve spin hakkini kontrol eder.
- Segment sonucu backend'de agirlikli rastgele secilir.
- Para, gunluk limit, spin sayisi ve son sonuclar backend save'e yazilir.
- Frontend sadece gelen sonucu uygular ve animasyonla gosterir.

### Kayit State'i

Save icinde `chanceGames` tutulur:

- `day`: sans oyunu gunu.
- `dailyLimitUsed`: bugun harcanan sans oyunu butcesi.
- `wheelSpinsToday`: bugunku cark cevirme sayisi.
- `recentResults`: son cark sonuclari.

Gun degisince `dailyLimitUsed` ve `wheelSpinsToday` sifirlanir.

### Ekonomi Degerleri

Degerler `shared/economy.json > chanceGames` altindadir:

- Gunluk sans oyunu limiti: `50.000 TL`
- Sonuc gecmisi limiti: `8`
- Mahalle Carki bahis ucreti: `2.500 TL`
- Gunluk cark hakki: `5`

### Cark Segmentleri

| Segment | Carpan | Agirlik | Not |
|---|---:|---:|---|
| Bos | `0x` | `30` | Bahis kaybedilir |
| Kucuk Odul | `1.2x` | `28` | Dusuk kazanc |
| Orta Odul | `2x` | `18` | Net pozitif sonuc |
| Mahalle Sansi | `5x` | `7` | Nadir buyuk odul |
| Buyuk Patlama | `20x` | `1` | Cok nadir jackpot |
| Para Iadesi | `1x` | `16` | Para geri doner |

Yaklasik toplam agirlik `100` oldugu icin oranlar dogrudan yuzde gibi okunabilir.

### UI Davranisi

- Panel desktop'ta genis sag drawer olarak acilir.
- Mobilde neredeyse tam ekran gorunur.
- Ust kisimda kasa, gunluk limit ve kalan cark hakki gorunur.
- Orta kisimda cark ve `Carki Cevir` butonu vardir.
- Sag kisimda segment listesi ve son sonuclar vardir.
- Izleyici sekmede para islemi yapilmaz; lider sekmeden oynanmasi istenir.

## Uygulanan MVP: Tek/Cift Plaka

Tek/Cift Plaka ikinci aktif sans oyunudur. Oyuncu rastgele uretilen plakanin son hanesinin
tek mi cift mi oldugunu tahmin eder.

### Backend Akisi

- Endpoint: `POST /api/chance/plate/play/{playerId}`
- Request: `gameDay`, `guess` (`tek` veya `cift`)
- Backend plaka son hanesini `0-9` arasi uretir.
- Dogru cevap `digit % 2 == 0 ? cift : tek` olarak hesaplanir.
- Para sonucu, gunluk limit ve oyun sayaci backend save'e yazilir.

### Ekonomi Degerleri

Degerler `shared/economy.json > chanceGames.plate` altindadir:

- Bahis: `10.000 TL`
- Dogru tahmin carpani: `1.8x`
- Gunluk hak: `8`
- Yanlis tahminde odeme `0 TL`, bahis kaybedilir.

### Oran

- Tek kazanma ihtimali: yaklasik `%50`
- Cift kazanma ihtimali: yaklasik `%50`
- Dogru tahmin net sonucu: `+8.000 TL`
- Yanlis tahmin net sonucu: `-10.000 TL`

Bu oyun hizli oynanan, dusuk/orta riskli masa oyunu gibi davranir.

## Uygulanan MVP: Gunluk Piyango

Gunluk Piyango ucuncu aktif sans oyunudur. Oyuncu bilet alir; odul backend tarafinda agirlikli
rastgele secilir.

### Backend Akisi

- Endpoint: `POST /api/chance/lottery/ticket/{playerId}`
- Request: `gameDay`
- Backend bilet ucretini, gunluk limiti ve bilet hakkini kontrol eder.
- Odul `chanceGames.lottery.prizes` listesinden agirlikli secilir.
- Para sonucu, gunluk limit, bilet sayaci ve son sonuc backend save'e yazilir.

### Ekonomi Degerleri

Degerler `shared/economy.json > chanceGames.lottery` altindadir:

- Bilet ucreti: `25.000 TL`
- Gunluk bilet hakki: `3`

### Odul Tablosu

| Odul | Tutar | Agirlik | Yaklasik oran |
|---|---:|---:|---:|
| Bilet yanis | `0 TL` | `72` | `%72` |
| Kucuk ikramiye | `75.000 TL` | `18` | `%18` |
| Orta ikramiye | `350.000 TL` | `7` | `%7` |
| Buyuk ikramiye | `1.500.000 TL` | `2.5` | `%2.5` |
| Garaj ikramiyesi | `5.000.000 TL` | `0.5` | `%0.5` |

Piyango, otobus ve hat satin alma hedefleri icin nadir buyuk sicrama sansi verir. Gunluk bilet
limiti dusuk tutuldugu icin ana ekonomiyi surekli ezmez.

## MVP Panel Durumu

Sans oyunlari panelinde artik 3 aktif oyun vardir:

1. Mahalle Carki
2. Tek/Cift Plaka
3. Gunluk Piyango

Tum oyunlar ortak kurallari kullanir:

- Sonuc backend'de uretilir.
- Oyun oncesi frontend mevcut save'i backend'e yollar.
- Backend para, gunluk limit ve hak kontrolu yapar.
- Sonuclar `chanceGames.recentResults` icinde tutulur.
- Gunluk limit ortak oldugu icin oyuncu ayni gun tum sans butcesini tek oyuna yikamaz.

## Uygulanan Mini Oyun: Riskli Zarf

Riskli Zarf, hizli sonuc veren orta riskli mini oyundur. Oyuncu bahis oder, backend zarfin
icinden gelen sonucu agirlikli secer.

- Endpoint: `POST /api/chance/envelope/play/{playerId}`
- Bahis: `15.000 TL`
- Gunluk hak: `5`

| Sonuc | Odeme | Agirlik | Yaklasik oran |
|---|---:|---:|---:|
| Bos zarf | `0 TL` | `45` | `%45` |
| Zarf iadesi | `15.000 TL` | `20` | `%20` |
| Kalin zarf | `45.000 TL` | `25` | `%25` |
| Muhtar zarfi | `150.000 TL` | `10` | `%10` |

## Uygulanan Mini Oyun: Durak Kuponu

Durak Kuponu simdilik anlik kupon MVP'sidir. Gercek gun sonu performans kuponu daha sonra
eklenebilir; bu ilk surumde backend kupon sonucunu agirlikli secer.

- Endpoint: `POST /api/chance/coupon/play/{playerId}`
- Bahis: `12.000 TL`
- Gunluk hak: `4`

| Sonuc | Odeme | Agirlik | Yaklasik oran |
|---|---:|---:|---:|
| Kupon yatti | `0 TL` | `58` | `%58` |
| 2 durak tuttu | `30.000 TL` | `28` | `%28` |
| 3 durak tuttu | `90.000 TL` | `12` | `%12` |
| Tam kupon | `300.000 TL` | `2` | `%2` |

## Uygulanan Mini Oyun: Minibuscu Tombalasi

Minibuscu Tombalasi dusuk bahisli, gunluk az hakli bir kart oyunudur. Amac kucuk/orta odul
ritmini artirmak ve panelde daha hafif bir oyun secenegi sunmaktir.

- Endpoint: `POST /api/chance/tombala/play/{playerId}`
- Bahis: `8.000 TL`
- Gunluk hak: `3`

| Sonuc | Odeme | Agirlik | Yaklasik oran |
|---|---:|---:|---:|
| Kart bos | `0 TL` | `50` | `%50` |
| Bir sira | `20.000 TL` | `32` | `%32` |
| Yarim kart | `70.000 TL` | `15` | `%15` |
| Minibuscu tombalasi | `250.000 TL` | `3` | `%3` |

## Sans Oyunlari Brief

Paneldeki oyunlar 3 stile ayrildi:

- **Hizli bahis oyunlari:** Tek/Cift Plaka, Riskli Zarf. Kisa karar, aninda sonuc, orta risk.
- **Gorsel odul oyunlari:** Mahalle Carki, Minibuscu Tombalasi. Daha eglenceli, daha dusuk tempo.
- **Buyuk sicrama oyunlari:** Gunluk Piyango, Durak Kuponu. Dusuk ihtimalle hat/otobus hedeflerine
  yaklastiran buyuk odul potansiyeli.

Genel tasarim karari: oyunlar client tarafinda hesaplanmaz. Backend sonucu uretir, para ve gunluk
haklari save'e yazar. Frontend sadece panel, animasyon ve sonuc gecmisini gosterir.
