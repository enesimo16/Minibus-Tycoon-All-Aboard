// Kodsuz içerik sistemi: sahnedeki her obje bir veri kaydıdır.
// Yeni bina/prop eklemek = scene.ts'e bir satır eklemek. Kod değişmez.

export type PropKind = "building" | "prop" | "vegetation";

export interface PropDef {
  id: string;
  kind: PropKind;
  /** Kemal'in dosyayı public/models/ altına koyacağı ad. Dosya yoksa placeholder gösterilir. */
  modelPath?: string;
  /**
   * OBJ/FBX modellerin dokusu ayrı dosyadadır (GLB'de gömülüdür). Verilirse
   * modelin tüm materyallerine bu doku uygulanır.
   */
  texturePath?: string;
  /**
   * Modelin dünya birimindeki hedef YÜKSEKLİĞİ (metre). Verilirse model kendi
   * sınır kutusuna göre otomatik ölçeklenir — hazır paketlerin birim farkı
   * (cm/inç/metre) böyle normalize edilir, elle scale denemeye gerek kalmaz.
   */
  targetHeight?: number;
  position: [number, number, number];
  rotationY?: number;
  scale?: number;
  /** Placeholder rengi (gerçek model gelince görünmez olur). */
  color?: string;
}
