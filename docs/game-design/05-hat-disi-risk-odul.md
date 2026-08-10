# 05 — Hat Dışı Seferler: Risk/Ödül Sistemi

Enes'in çekirdek fikri: **hat dışına çıkınca daha çok para, ama yakalanma riski.**
Bu sistem oyunun "kumar" damarıdır ve tamamen oyuncu seçimine dayanır.

## Nasıl tetiklenir?

Durak sonrası %15 ihtimalle (`ECONOMY.offRoute.offerChance`) özel yolcu teklifi gelir:
> "Abi hat dışı ama şuraya götürür müsün? 2-4 katını veririm 😏"

Oyuncu **KABUL (1) / RET (2)** seçer (3 sn pencere). Şoför aktifken hiç çıkmaz.

## Uygulanan mekanik (Aşama 3)

Kabul edilirse:
1. `detourActive = true` — dolmuş **bulunduğu noktada bekler** (`detourSeconds` = 5 sn),
   ekranın ortasında para birikişini gösteren kasa kartı açılır (`DetourPayoutOverlay`).
   Süre bitince dolmuş kaldığı yerden hatta devam eder.
   > **Neden hareket yok:** Önceki sürümde hattın sağına dik bir "sapak" noktası hesaplanıp
   > araç oraya taşınıyordu. Yol ağı bilinmediği için bu rota binaların/zeminin içinden
   > geçiyordu. Gerçek bir hat-dışı güzergâhı ancak yol ağı grafiği çıkarılınca mümkün;
   > o zamana kadar "yerinde bekle + kasa efekti" bilinçli tercih.
2. Bu sürede **Dikkat Çubuğu** (`attention`, 0-100) dolar (saniyede +9, 5 sn'de ~%45).
3. Kazanç kabul anında sabitlenir (`₺40 × rastgele(2-4) × hat çarpanı`) ve süre boyunca
   **kademeli olarak** kasaya işlenir — oyuncu parayı birikirken görür.
4. Tek seferlik denetim şansı = `attention/100 × catchChanceAtFullAttention (0,6)`.
5. Yakalanırsa: seferin kazancının 2 katı ceza (`firstCatchPenaltyMultiplier`).
6. Yakalanmayınca: `attention` yavaşça boşalır (4 sn'de tamamen — `attentionDecaySeconds`).

## Hız ihlali riski (ayrı sistem)

Hat dışından **bağımsız** bir risk sistemi: `SpeedingRisk` (0-100).
- `playerSpeedMultiplier > 1.0` → SpeedingRisk saniyede +8 dolar.
- `playerSpeedMultiplier ≤ 1.0` → saniyede -5 azalır.
- SpeedingRisk > 30 → polis kontrol şansı aktif (`maxCatchChancePerSecond = 0,035/sn`).
- Risk tam doluyken: saniyede %3,5 yakalanma şansı (üstel formül: `risk^1.5`).

### Kademeli polis ceza sistemi (`policeLevel` 0→4)

| `policeLevel` | Ceza | Ek etki |
|---|---|---|
| 0→1 | ₺150 | — |
| 1→2 | ₺400 | — |
| 2→3 | ₺1.000 | Ehliyet askı: dolmuş 2 oyun saati (60 gerçek sn) durur |
| 3→4 | ₺3.500 | Araç el konuldu — yeni araç bedeli ₺3.000, policeLevel 2'ye düşer |

**Gece çarpanı:** 22:00–06:00 arası yakalanma ihtimali 2,2× (`ECONOMY.police.nightCatchMultiplier`).

Her yakalanmada: SpeedingRisk sıfırlanır, -8 memnuniyet, `PoliceAlert` gösterilir.

## Ödül modeli

- Hat dışı kazanç: `₺17,5 × 2-4 kat` (tek seferlik, zincir çarpanı henüz yok).
- Hız ihlali ödülü yok — saf risk/ceza; yalnızca zaman kazandırır.

## Eklenecekler (gelecek iterasyon)

- Zincir bonusu: art arda yakalanmadan hat dışı sefer → çarpan artar (x1.1, x1.25...).
- QTE anı: "ARKA SOKAĞA SAP / YAVAŞLA VE DUA ET".
- "Gözü kara" şoförler (Evre 3): kendi başına hat dışı yapan, cezalar oyuncuya.
- Hat dışı hedef keşifleri: yeni hat açılışında indirim.

## Şoförler ve hat dışı

- Tüm mevcut şoförler hat dışına çıkmaz, hız ihlali yapmaz.
- Şoför aktifken `playerSpeedMultiplier` devre dışı → SpeedingRisk hiç birikmez.

## Global polis sistemi (2026-07-28 guncellemesi)

`policeRisk` artik tek global sayactir. Eski "risk yuksekse rastgele yakalanma" akisi
kanonik degildir; risk `ECONOMY.police.catchRiskThreshold` olan 100'e ulastigi anda
ceza kesin uygulanir.

Riski artiran kaynaklar `shared/economy.json > police.globalRisk` altinda tutulur:

- Hiz limiti asimi: surucu aktif degilken `playerSpeedMultiplier > speed.limit`.
- Hat disi sefer: kabul aninda sabit risk, sefer sirasinda saniyelik risk, sefer bitisinde
  dikkat cubuguna bagli ek risk.
- Gizli gece vardiyasi: 00:00-08:00 arasinda atanmis her aktif sofor saniyelik risk ekler.
- Yanlis para ustu: yolcuya hatali para ustu vermek sabit risk ekler.
- Fazla yolcu: kapasite ustu yolcu kabul etmek sabit risk ekler.
- Yolcu indirmeme: durakta veya musait yerde inmek isteyen yolcuyu reddetmek risk ekler.
- Verilen durak sozunu bozmak: "durakta indirecegim" dedikten sonra `GEC` secmek yuksek risk ekler.
- Durak disi indirme: musait yerde indirmeyi kabul etmek kucuk ama global risk ekler.
- Yorgun sofor: gunluk vardiya limitini asan soforler sureye bagli risk ekler.

Pozitif risk kaynagi yoksa `police.riskDecayPerSecond` ile risk yavas iner. Ceza sonrasi
`police.riskAfterPenalty` degerine doner, hiz limit seviyesine cekilir, memnuniyet ceza alir.
3. seviyede ehliyet askisi, 4. seviyede araca el koyma uygulanir.
