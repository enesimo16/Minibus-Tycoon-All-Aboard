# ADR-002: Simülasyon Client'ta, Doğrulama Backend'de

**Durum:** Kabul edildi (2026-07-25)

## Bağlam
Oyun büyük oranda tek kişilik; sosyal katman asenkron. Sunucuda gerçek zamanlı simülasyon
çalıştırmak 2 kişilik acemi ekip için gereksiz karmaşıklık ve maliyet.

## Karar
- Tüm oyun simülasyonu (dolmuş hareketi, yolcular, ekonomi tick'i) **tarayıcıda** çalışır.
- Backend görevleri: hesap, save/load (periyodik snapshot, ~60 sn'de bir + önemli olaylarda),
  skor tabloları, sosyal olay kutusu (korsan sefer kayıtları).
- **Mantık doğrulaması:** backend her snapshot'ta `maxKazanç = geçenSüre × teorikMaksSaatlikGelir(hatlar, yükseltmeler)`
  hesaplar; aşan değer kırpılır ve işaretlenir. Çevrimdışı gelir de backend'de hesaplanır
  (client "8 saat geçti" diyemez; sunucu saati esastır).

## Gerekçe
- Tek kişilik ilerlemede hile "kendini kandırmak"tır; tam sunucu otoritesine değmez.
- Ama skor tablosu + korsan sefer rekabete girince bariz hileyi kesmek şart → ucuz üst-sınır
  kontrolü %95'ini yakalar.

## Sonuçlar
- Save şeması versiyonlanır (`saveVersion` alanı) — ekonomi değişince eski kayıt göç ettirilir.
- Ekonomi sabitleri tek kaynak olarak `shared/economy.json` içinde tutulur. Frontend
  `economy.ts` ile bu JSON'u re-export eder; backend `EconomyConstants.cs` ile aynı dosyayı okur.

## Faz 0 eki — sürümlü kayıt ve olay defteri (2026-08-02)

- `EnsureCreated + hata yutulan ALTER TABLE` yaklaşımı kaldırıldı. `SchemaMigrations` tablosu ve sıralı,
  transaction içindeki migrasyonlar veritabanı şemasının otoritesidir.
- İstemci simülasyonu sürdürür; analitik olayları benzersiz bir idempotency anahtarıyla backend'e yollar.
  Tekrar gönderilen olay ikinci defa yazılmaz.
- Para ve XP veren gelecek `ShiftResults`/`ContractRuns` işlemleri oyuncu + idempotency anahtarıyla
  tekilleştirilir. Ödül uygulaması ve sonuç kaydı aynı backend transaction'ında yapılacaktır.
- Serbest istemci JSON'u doğrudan güvenilir kabul edilmez: şema bağlamı sunucuda eklenir, hassas anahtarlar
  çıkarılır ve dashboard yalnız admin anahtarıyla okunur.
