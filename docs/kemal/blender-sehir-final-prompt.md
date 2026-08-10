# Blender Şehir Final Promptu

Bu prompt Kemal'e gönderilecek final şehir düzenleme brief'idir. Amaç: mevcut Google Drive klasöründeki şehir dosyasını oyun MVP'sine uygun son hale getirmek.

## Prompt

Kemal, FullFilled için mevcut şehir sahnesinin final MVP düzenlemesini yapıyoruz. Google Drive klasöründeki mevcut dosyaları baz al:

- `Fullfilled_City_OPTIMIZED.glb`: ana şehir modeli
- `city_data.json`: yol, durak ve metadata referansı
- `BUSSIGN.glb`: durak/sign görseli
- `bus1.glb`: temel oyuncu dolmuşu
- `bus2.glb`: ilk upgrade aracı
- `bus3.glb`: üst upgrade aracı

Şehrin son hali için Blender'da aşağıdaki düzenlemeleri yap:

1. Genel hedef
   - Şehir, 3D web oyunu için okunaklı, performanslı, renkli ve stylized görünmeli.
   - Kamera çoğunlukla üstten izometrik/yarı izometrik bakacak; bu yüzden yollar, duraklar ve kavşaklar uzaktan net okunmalı.
   - Binalar güzel görünsün ama yol okunurluğunu kapatmasın. Dolmuşun hareket edeceği hat ilk bakışta anlaşılmalı.

2. Yol sistemi
   - Ana yollar çift yönlü ve iki şeritli okunmalı.
   - Her yol yönünde tek dolmuşun sığacağı net bir şerit alanı bırak.
   - Şerit çizgileri, kavşak çizgileri ve yol kenarları belirgin olsun.
   - Asfalt rengi koyu gri olmalı; kaldırım ve refüjler asfalttan net ayrılmalı.
   - Yol üstündeki dekorlar, ağaçlar, tabelalar ve lambalar dolmuş rotasına taşmamalı.
   - Rota üzerindeki dönüşler keskin ama okunaklı olmalı; dolmuş köşelerde bina/prop içine girmiş gibi görünmemeli.

3. Oyuncu dolmuş ölçek referansı
   - `bus1.glb` basic araçtır; sahnede tek şeride rahat sığmalı.
   - `bus2.glb` ve `bus3.glb` upgrade görselleridir; daha değerli/ileri hissettirebilir ama tek şerit ölçeğini bozmamalı.
   - Şerit genişliği görsel olarak `bus1` genişliğinin yaklaşık 1.2-1.4 katı kadar okunmalı.
   - Otobüslerin gitmesi gereken yolları sahne içinde açık bırak; yol kenarındaki objeler araçla çakışmasın.

4. Durak ve sign yerleşimi
   - Aşağıdaki 11 noktaya durak/sign yerleştir. Koordinatlar `city_data.json` ile uyumludur; Blender'da X/Z düzleminde düşün:

| Stop | X | Z | Yolcu slot hedefi |
|---|---:|---:|---:|
| STOP_01 | -6.348 | -6.048 | 4 |
| STOP_02 | -1.548 | -6.048 | 3 |
| STOP_03 | 3.252 | -6.048 | 3 |
| STOP_07 | 20.987 | 16.320 | 4 |
| STOP_09 | 16.320 | 23.687 | 4 |
| STOP_10 | -8.959 | 28.350 | 4 |
| STOP_11 | -28.350 | 11.659 | 4 |
| STOP_06 | -20.987 | -16.320 | 3 |
| STOP_08 | -16.320 | -23.687 | 3 |
| STOP_04 | -4.000 | 6.428 | 3 |
| STOP_05 | 3.200 | 6.428 | 3 |

   - Her durakta `BUSSIGN.glb` veya aynı stil bir sign kullanılmalı.
   - Sign, yolun kenarında olmalı; dolmuşun şeridine taşmamalı.
   - Durakta gelecekte 3-4 karakter duracağı için küçük bir bekleme alanı bırak: kaldırımda temiz bir düz alan, çakışmasız.
   - Duraklar uzaktan ayırt edilsin: küçük sarı/mavi tabela, durak çizgisi veya kaldırım işareti olabilir.
   - Durak sign'ları her noktada yola doğru okunacak şekilde döndürülmeli.

5. Rota okunurluğu
   - Oyun şu polyline hattı kullanıyor; bu ana güzergah sahnede açık ve takip edilebilir olmalı:

```text
[-6.348,-6.048] -> [-1.548,-6.048] -> [3.252,-6.048] -> [10.309,-6.048] ->
[10.309,10.309] -> [20.987,10.309] -> [20.987,16.32] -> [22.337,16.32] ->
[22.337,23.687] -> [16.32,23.687] -> [-8.959,23.687] -> [-8.959,28.35] ->
[-22.337,28.35] -> [-22.337,11.659] -> [-28.35,11.659] -> [-28.35,-16.32] ->
[-20.987,-16.32] -> [-20.987,-23.687] -> [-16.32,-23.687] -> [-10.309,-23.687] ->
[-10.309,-6.048] -> [-6.348,-6.048] -> [-6.348,6.428] -> [-4,6.428] ->
[3.2,6.428] -> [3.2,-6.048] -> [-6.348,-6.048]
```

   - Bu hat üzerinde yol kesintisi, kaldırım taşıması veya prop çakışması olmasın.
   - Eğer görsel olarak rota çok belirsiz kalıyorsa, ana hat yollarına çok hafif bir görsel fark verilebilir: daha temiz asfalt, daha belirgin şerit çizgisi veya küçük durak ikonları.

6. Performans ve export
   - Final dosya adı: `Fullfilled_City_FINAL.glb`
   - Optimize edilmiş alternatif dosya adı: `Fullfilled_City_FINAL_DRACO.glb`
   - Web için toplam sahne makul kalmalı; gereksiz yüksek poly detayları azalt.
   - Tekrarlanan objeleri mümkünse instance/linked duplicate mantığıyla düzenle.
   - Texture çözünürlüklerini web için makul tut: büyük yüzeylerde 1024-2048, küçük propslarda 512 yeterli.
   - Export sonrası sahnede gereksiz kamera, ışık, helper, empty ve gizli mesh kalmasın.
   - Ölçek birimi korunmalı; mevcut şehir koordinat sistemi bozulmamalı.
   - Origin veya global transform değişikliği rotayı bozacaksa yapma. Şehir modeli mevcut koordinatlarda kalmalı.

7. Teslim paketi
   - `Fullfilled_City_FINAL.glb`
   - `Fullfilled_City_FINAL_DRACO.glb` varsa
   - Güncel `city_data.json`
   - 3 screenshot:
     - üstten genel şehir
     - durak/sign yakın plan
     - bus1'in tek şeritte durduğu ölçek kontrolü

Özet hedef: Yollar net, duraklar belli, sign'lar doğru yerde, dolmuş tek şeride sığıyor, karakterlerin durakta bekleyeceği alanlar hazır. Bu şehir bizim ilk gerçek MVP haritamız olacak.
