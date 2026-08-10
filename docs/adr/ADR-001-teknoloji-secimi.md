# ADR-001: Teknoloji Seçimi — Next.js + react-three-fiber / .NET 9 Web API

**Durum:** Kabul edildi (2026-07-25)

## Bağlam
2 kişilik acemi ekip; 3D tarayıcı oyunu; Enes backend'de C# istiyor; link tabanlı
şehir sayfaları (SEO/paylaşım önizlemesi önemli) ve hesap/kayıt sistemi gerekiyor.

## Karar
- **Frontend:** Next.js (App Router, TypeScript) + Three.js'i `@react-three/fiber` (R3F) ile,
  yardımcılar için `@react-three/drei`, oyun state'i için `zustand`.
- **Backend:** ASP.NET Core (.NET 9) Web API + EF Core; başlangıç DB'si SQLite,
  büyüyünce PostgreSQL.

## Gerekçe
- Next.js: `fullfilled.app/{kullanici}` dinamik şehir sayfaları + Open Graph paylaşım kartları
  bedavaya gelir; deploy kolay (Vercel).
- R3F, ham Three.js'e göre React bileşen modeliyle çalışır → UI (React) ve 3D sahne aynı
  zihinsel modelde; acemi ekip için tek paradigma.
- zustand: oyun döngüsü (60fps tick) React render'ından bağımsız state tutmayı kolaylaştırır.
- C#: Enes'in tercihi; .NET Web API + EF Core öğrenme kaynağı bol, tip güvenliği var.

## Alternatifler
- Ham Three.js + Vite: daha hafif ama link/SEO sayfalarını elle kurmak gerekir.
- Unity WebGL: yükleme boyutu (20MB+) web oyununun "tıkla-oyna" avantajını öldürür. Red.
- Node backend: tek dil avantajı var ama ekip C# istiyor; API sınırı net olduğundan sorun değil.

## Sonuçlar
- Oyun döngüsü React render'ına DEĞİL, R3F `useFrame` + zustand store'a yazılır
  (her tick'te React re-render yasak — performans ilkesi).
- Frontend/backend sınırı: JSON REST. SignalR/WebSocket YOK (bkz. ADR-003).
