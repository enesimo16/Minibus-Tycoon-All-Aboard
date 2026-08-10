# FullFilled

FullFilled, canlı bir şehirde minibüs hattı işletmeye odaklanan 3B bir idle/tycoon oyunudur. Oyuncu seferleri yönetir, yolcu taleplerini karşılar, araç ve şoför yatırımları yapar, yeni hatlar satın alır ve şehir merkezindeki terminali geliştirir.

## Öne çıkan özellikler

- React Three Fiber ile oluşturulmuş canlı 3B şehir
- Gün/gece döngüsü, güneş, ay, yıldızlar ve hareketli bulutlar
- Şehir trafiği, trafik ışıkları ve farklı araç modelleri
- Minibüs hattı, duraklar ve takip kamerası
- Şoför, araç, hat ve terminal geliştirmeleri
- Yolcu kararları, şehir olayları ve idle gelir sistemi
- ASP.NET Core ve SQLite tabanlı kayıt sistemi

## Teknolojiler

- Frontend: Next.js 16, React 19, TypeScript, Three.js, React Three Fiber, Zustand
- Backend: ASP.NET Core, Entity Framework Core, SQLite
- Paket yöneticisi: npm

## Yerel kurulum

Gereksinimler:

- Node.js 20 veya daha yeni bir sürüm
- npm
- .NET 9 SDK

Depoyu klonlayın:

```bash
git clone https://github.com/kemylmaz/Fullfilled.git
cd Fullfilled
```

Backend'i başlatın:

```bash
cd backend/FullFilled.Api
dotnet run --urls http://localhost:5000
```

Frontend için `frontend/.env.local` dosyasını oluşturun:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000
```

Ardından frontend'i başlatın:

```bash
cd frontend
npm install
npm run dev
```

Oyun varsayılan olarak [http://localhost:3000](http://localhost:3000) adresinde açılır.

## Production dağıtımı

Oyun iki ayrı süreç olarak yayınlanır: Next.js frontend (`npm run build && npm run start`)
ve .NET backend (`dotnet publish -c Release`). Simülasyon istemcide çalıştığı ve kayıt
SQLite'ta tutulduğu için tek bir küçük VPS (veya frontend'i Vercel + backend'i VPS/Fly.io)
yeterlidir.

### Zorunlu ortam değişkenleri

| Değişken | Taraf | Açıklama |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Frontend (build sırasında) | Backend'in herkese açık HTTPS adresi, örn. `https://api.oyun.com` |
| `NEXT_PUBLIC_APP_VERSION` | Frontend (build sırasında) | Telemetride görünen sürüm/commit etiketi; her deploy'da benzersiz olmalı. |
| `Cors__AllowedOrigins__0` | Backend | Frontend'in herkese açık adresi, örn. `https://oyun.com`. **Verilmezse production'da tüm istekler CORS'ta reddedilir.** |
| `FULLFILLED_ADMIN_USERNAME` | Backend | Tek admin hesabının kullanıcı adı. Bu kullanıcı veritabanında gerçek, şifreli bir hesap olarak bulunmalı ve admin özelliklerine erişirken oturum açmış olmalıdır. |
| `ConnectionStrings__Default` | Backend | Örn. `Data Source=/data/fullfilled.db` — kalıcı bir diske işaret etmeli, yoksa her yeniden dağıtımda kayıtlar silinir. |
| `ASPNETCORE_ENVIRONMENT` | Backend | `Production` — hata detaylarını gizler. |
| `HttpsRedirection__Enabled` | Backend | TLS'i hosting proxy'si sonlandırıyorsa `false`; backend doğrudan HTTPS sunuyorsa `true`. |

İsteğe bağlı: `RateLimits__LoginPerMinute` (varsayılan 10) ve `RateLimits__GeneralPerMinute`
(varsayılan 300) IP başına dakikalık istek sınırlarını ayarlar. Admin kimliği frontend'e yazılmaz;
backend her istekte env'deki kullanıcı adını veritabanındaki hesap ve aktif oturumla doğrular.

### Vercel frontend kurulumu

1. Vercel'de depoyu içe aktarın ve **Root Directory** değerini `frontend` yapın.
2. Framework Preset'i `Next.js` bırakın; install/build/output ayarlarını Vercel otomatik algılar.
3. `frontend/.env.production.example` içindeki iki değişkeni Vercel Production ve Preview
   ortamlarına ekleyin. `NEXT_PUBLIC_API_BASE_URL` HTTPS backend adresi olmalıdır.
4. `NEXT_PUBLIC_` değişkenleri tarayıcı paketine yazıldığı için bunlara admin anahtarı veya
   başka bir secret koymayın. Değişken güncellendiğinde yeniden deploy gerekir.

Bu monorepo için Vercel **Root Directory** kesinlikle `frontend` olmalıdır. `public/models`
altındaki oyun modelleri GitHub'da normal dosya olarak tutulur ve Vercel build çıktısına dahil edilir.
Vercel yalnızca frontend'i yayınlar; uzun ömürlü .NET API Docker/VPS üzerinde çalışır.

### Backend container kurulumu

Backend Vercel serverless'a uygun değildir: ASP.NET Core uzun ömürlü bir süreçtir ve mevcut
SQLite veritabanı kalıcı disk ister. Docker destekleyen tek-instance bir servis (VPS, Fly.io,
Railway veya Render) kullanın. Image'i depo kökünden şu komutla üretin:

```bash
docker build -f backend/FullFilled.Api/Dockerfile -t fullfilled-api .
```

Host üzerinde `backend/FullFilled.Api/.env.example` şablonundaki değerleri tanımlayın, `/data`
dizinine kalıcı disk bağlayın ve port `8080`'i yayınlayın. Backend yayına çıktıktan sonra Vercel'deki
`NEXT_PUBLIC_API_BASE_URL` değerini gerçek HTTPS API adresiyle güncelleyip frontend'i yeniden deploy edin.

VPS'te önerilen kurulum:

```bash
cd /opt/minibus-tycoon
cp backend/FullFilled.Api/.env.production.example backend/FullFilled.Api/.env
# .env içindeki Vercel origin, admin kullanıcı adı ve diğer gerçek değerleri düzenleyin.
docker compose up -d --build
curl http://127.0.0.1:8081/health/ready
```

Compose yalnızca `127.0.0.1:8081` portunu açar ve SQLite dosyasını `minibus-data` adlı kalıcı
Docker volume'unda tutar. HTTPS frontend'in API'ye erişebilmesi için `api.example.com` trafiği
bu porta TLS sonlandıran bir reverse proxy veya Cloudflare Tunnel üzerinden yönlendirilmelidir.
Vercel domaini harici VPS API'sine kendiliğinden TLS sertifikası sağlamaz.

### Dağıtım öncesi kontrol listesi

1. `cd frontend && npx tsc --noEmit && npm run check:i18n && npm run check:driving && npm run check:economy && npm run check:grading`
2. `cd frontend && npm run build`
3. `cd backend/FullFilled.Api && dotnet publish -c Release`
4. Backend'i başlatıp `GET /health` ucunun 200 döndüğünü doğrulayın (uptime monitörünüzü de buna bağlayın).
5. SQLite dosyasının bulunduğu dizinin düzenli yedeklendiğinden emin olun (dosya kopyası yeterlidir).

### Bilinen sınırlar

- Backend **tek instance** varsayar: şans oyunlarındaki oyuncu kilitleri süreç içindedir ve
  SQLite tek yazıcıya uygundur. Yatay ölçekleme gerektiğinde PostgreSQL'e geçiş ve dağıtık
  kilit gerekir — mevcut oyuncu hacmi için gerekmez.
- Telemetri/analitik panel `/admin/analytics` altındadır; yalnızca `FULLFILLED_ADMIN_USERNAME`
  ile seçilen veritabanı hesabının geçerli oturum tokenıyla açılır.
- Radyo istasyonu metadata'sı üçüncü taraf bir yayın sunucusundan çekilir; erişilemezse oyun
  etkilenmez, yalnızca radyo paneli "çevrimdışı" görünür.

## Ekip

- [@kemylmaz](https://github.com/kemylmaz)
- [@enesimo16](https://github.com/enesimo16)

## Üçüncü taraf varlıklar

Projede kullanılan üçüncü taraf modeller ve lisans bilgileri [CREDITS.md](CREDITS.md) dosyasında listelenir. Yeni bir varlık eklenirken kaynak ve lisans bilgisinin bu dosyaya eklenmesi gerekir.

## Lisans

Kaynak kod MIT Lisansı ile sunulmaktadır. Ayrıntılar için [LICENSE](LICENSE) dosyasına bakın. Üçüncü taraf görsel ve 3B varlıklar kendi lisanslarına tabidir.
