# ADR-004: Sekme-Arası İletişim — BroadcastChannel, Tek "Lider" Sekme

**Durum:** Kabul edildi (2026-07-25)

## Bağlam
Sekme-arası mahalle özelliği (dolmuş bir sekmeden diğerine geçer) ve şerit modu, birden çok
sekmenin aynı oyun durumunu paylaşmasını gerektirir. İki sekme aynı simülasyonu ayrı ayrı
çalıştırırsa para iki kez kazanılır (çift sayım hatası).

## Karar
- Sekmeler arası mesajlaşma: **`BroadcastChannel` API** (aynı origin, sunucusuz, ~her modern
  tarayıcıda var).
- **Tek lider sekme modeli:** Web Locks API (`navigator.locks`) ile liderlik seçilir.
  Ekonomi tick'i ve save YALNIZ lider sekmede çalışır. Diğer sekmeler görselleştirici +
  girdi ileticisidir. Lider kapanırsa kilit boşalır, bir sonraki sekme lider olur.
- Dolmuşun sekme geçişi: çıkış sekmesi `bus:exit {busId, state}` yayınlar, hedef mahalleyi
  gösteren sekme `bus:enter` ile devralır; hedef sekme yoksa dolmuş lider sekmede sahne-içi
  bölge geçişiyle devam eder (özellik opsiyonel şovdur, oynanışı bloklamaz).
- Sekmelerin fiziksel ekran konumunu bilmek güvenilir değildir (API kısıtlı); geçiş
  "sağdan çık / soldan gir" sabit konvansiyonuyla yapılır, gerçek pencere konumu aranmaz.

## Alternatifler
- `SharedWorker`: daha temiz tek-simülasyon modeli ama debug'ı zor, Android Chrome desteği
  sorunluydu; acemi ekip için fazla. Reddedildi (ileride göç mümkün).
- localStorage event hack'i: eski yöntem, mesaj boyutu/performans sorunlu. Red.

## Sonuçlar
- Oyun state mimarisi ilk günden "tek yazar (lider), çok okur" varsayımıyla kurulur —
  Aşama 1'de bile save/tick kodu lider kilidinin arkasına yazılır ki Aşama 4 sancısız olsun.

## Uygulama durumu (Aşama 4, güncellendi 2026-07-25)

- ✅ Lider seçimi (`frontend/src/game/useTabSync.ts` — `useLeaderElection`) ve durum yayını
  (`useStateBroadcast`) kodlandı, **2 gerçek sekmede canlı test edildi**: izleyici sekme
  "İzleyici sekme" rozeti gösterdi ve lider sekmenin parası/memnuniyeti ile bire bir eşleşti.
- ✅ **Girdi ileticisi kodlandı** (2026-07-25 devamı): `dispatchGameAction` ile izleyici
  sekmedeki her buton/kısayol artık `{type:"input", action, args}` mesajıyla lidere yönleniyor,
  lider kendi state'inde uygular. `decision`/`interaction` de yayına eklendi, DUR/GEÇ ve
  mini-etkileşim HUD'ları artık izleyici sekmede de görünüyor ve çalışıyor.
  Uçtan uca canlı test (izleyiciden tıklayıp liderde sonucu görmek) bu turda oturumdaki
  rAF/para birikim kısıtı yüzünden tamamlanamadı — mekanizma, önceden kanıtlanmış aynı
  BroadcastChannel akışını kullanıyor (bkz. yukarıdaki durum senkronu testi).
- ⚠️ Dolmuşun "sağdan çık / soldan gir" görsel geçişi henüz yok — şimdilik yalnızca dolmuş
  konumu (`busProgress`) yayınlanıyor, izleyici sekme aynı mahalleyi senkron gösteriyor.
  Çoklu-hat arası fiziksel geçiş animasyonu, gerçek ikinci mahalle (şehir entegrasyonu) gelince
  anlamlı olacak.
- Dosya adı notu: `tabSync.ts` (hooks) ile `TabSync.tsx` (bileşen) adı Windows'un büyük/küçük
  harf duyarsız dosya sisteminde çakıştı (derleme hatası) — hooks dosyası `useTabSync.ts`
  olarak yeniden adlandırıldı.
