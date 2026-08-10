import { PropDef } from "./types";

// Başlangıç Hattı mahallesi — Kemal K3 (mahalle kiti) geldikçe modelPath'ler otomatik devreye girer.
// Yeni obje eklemek: bu diziye bir satır eklemek yeterli, başka hiçbir dosyaya dokunma.

const HERO_BUILDINGS: PropDef[] = [
  {
    id: "bina-cumbali-01",
    kind: "building",
    modelPath: "/models/bina_cumbali_01.glb",
    position: [10, 0, 6],
    rotationY: 0.3,
    color: "#E8D5B5",
  },
  {
    id: "bina-cumbali-02",
    kind: "building",
    modelPath: "/models/bina_cumbali_02.glb",
    position: [-9, 0, 8],
    rotationY: -0.5,
    color: "#D98E73",
  },
  {
    id: "bakkal",
    kind: "building",
    modelPath: "/models/bina_bakkal.glb",
    position: [-14, 0, -4],
    rotationY: 1.2,
    color: "#A8C4A2",
  },
  {
    id: "cay-ocagi",
    kind: "building",
    modelPath: "/models/bina_cayocagi.glb",
    position: [14, 0, -6],
    rotationY: -1.0,
    color: "#8FA6BF",
  },
  {
    id: "cinar-01",
    kind: "vegetation",
    modelPath: "/models/prop_cinar.glb",
    position: [4, 0, 2],
    scale: 1.2,
    color: "#6FA35E",
  },
  {
    id: "cinar-02",
    kind: "vegetation",
    modelPath: "/models/prop_cinar.glb",
    position: [-5, 0, -3],
    scale: 0.9,
    color: "#6FA35E",
  },
  {
    id: "cop-kutusu-01",
    kind: "prop",
    modelPath: "/models/prop_copkutusu.glb",
    position: [7, 0, -1],
    color: "#4A4A52",
  },
];

// Dolgu (filler) mahalle: Sketchfab "Simple Cartoon City Mega Pack" (CC-BY, bkz. CREDITS.md)
// kullanılacak — jenerik binalar/prop'lar için uygun, Türk mahallesi kimliği hero binalardan gelir.
// Kemal paketten seçtiği modelleri pack_building_01..08.glb / pack_prop_01..06.glb olarak
// yeniden adlandırıp public/models/pack/ altına koyunca bu halka otomatik gerçek modellerle dolar.
// Kaba yerleşim burada; ince ayar (döndürme/kaydırma) tarayıcıdaki E-editörüyle yapılır.
const FILLER_BUILDING_VARIANTS = 8;
const FILLER_RING_COUNT = 16;
const FILLER_RADIUS_X = 30;
const FILLER_RADIUS_Z = 22;
const FILLER_COLORS = ["#E8D5B5", "#D98E73", "#A8C4A2", "#8FA6BF"];

function buildFillerRing(): PropDef[] {
  return Array.from({ length: FILLER_RING_COUNT }, (_, i) => {
    const angle = (i / FILLER_RING_COUNT) * Math.PI * 2;
    const variant = (i % FILLER_BUILDING_VARIANTS) + 1;
    const variantLabel = String(variant).padStart(2, "0");
    return {
      id: `filler-bina-${i}`,
      kind: "building",
      modelPath: `/models/pack/pack_building_${variantLabel}.glb`,
      position: [Math.cos(angle) * FILLER_RADIUS_X, 0, Math.sin(angle) * FILLER_RADIUS_Z],
      rotationY: -angle + Math.PI / 2, // cepheler halka merkezine baksın
      color: FILLER_COLORS[i % FILLER_COLORS.length],
    } satisfies PropDef;
  });
}

// ---------------------------------------------------------------------------
// Şehir genişletmesi — "City Pack" binaları (2026-08-08)
//
// Modeller OBJ/FBX olarak public/models/city/props/ altındadır; SceneProp
// uzantıya göre doğru yükleyiciyi seçer ve `targetHeight` ile ölçeği normalize
// eder (paketlerin birim farkı böyle çözülür, elle scale denemeye gerek yok).
//
// Konumlar ızgaranın PARSEL merkezlerine oturur (yol eksenleri ±10.3 / ±22.3 /
// ±34.4 / ±46.4). Hiçbiri yolun veya durakların üstünde değildir — HAT
// GEOMETRİSİ DEĞİŞMEZ. İnce ayar tarayıcıdaki E-editöründen yapılabilir.
// ---------------------------------------------------------------------------
const CITY_PROPS_PATH = "/models/city/props";

const CITY_PACK_BUILDINGS: PropDef[] = [
  {
    id: "cp-apartment-01",
    kind: "building",
    modelPath: `${CITY_PROPS_PATH}/Apartment.obj`,
    texturePath: `${CITY_PROPS_PATH}/Apartment_BaseColor.png`,
    targetHeight: 9,
    position: [-16.32, 0, 16.32],
    rotationY: Math.PI / 2,
    color: "#E8D5B5",
  },
  {
    id: "cp-apartment-02",
    kind: "building",
    modelPath: `${CITY_PROPS_PATH}/Apartment.obj`,
    texturePath: `${CITY_PROPS_PATH}/Apartment_BaseColor.png`,
    targetHeight: 8,
    position: [28.35, 0, -28.35],
    rotationY: -Math.PI / 2,
    color: "#E8D5B5",
  },
  {
    id: "cp-house-01",
    kind: "building",
    modelPath: `${CITY_PROPS_PATH}/HouseWithDriveway.obj`,
    texturePath: `${CITY_PROPS_PATH}/HouseWithDriveway_BaseColor.png`,
    targetHeight: 4.2,
    position: [16.32, 0, 16.32],
    rotationY: Math.PI,
    color: "#D98E73",
  },
  {
    id: "cp-house-02",
    kind: "building",
    modelPath: `${CITY_PROPS_PATH}/HouseWithDriveway.obj`,
    texturePath: `${CITY_PROPS_PATH}/HouseWithDriveway_BaseColor.png`,
    targetHeight: 4.2,
    position: [-28.35, 0, -28.35],
    rotationY: 0,
    color: "#D98E73",
  },
  {
    id: "cp-skyscraper-01",
    kind: "building",
    modelPath: `${CITY_PROPS_PATH}/Skyscraper.obj`,
    texturePath: `${CITY_PROPS_PATH}/Skyscraper_BaseColor.png`,
    targetHeight: 22,
    position: [-28.35, 0, 28.35],
    rotationY: 0.4,
    color: "#8FA6BF",
  },
  {
    id: "cp-skyscraper-02",
    kind: "building",
    modelPath: `${CITY_PROPS_PATH}/Skyscraper.obj`,
    texturePath: `${CITY_PROPS_PATH}/Skyscraper_BaseColor.png`,
    targetHeight: 18,
    position: [28.35, 0, 28.35],
    rotationY: -0.25,
    color: "#8FA6BF",
  },
  {
    id: "cp-bar-01",
    kind: "building",
    modelPath: `${CITY_PROPS_PATH}/CUPIC_BAR.obj`,
    texturePath: `${CITY_PROPS_PATH}/barSurface_Color.png`,
    targetHeight: 4.5,
    position: [-16.32, 0, -16.32],
    rotationY: Math.PI / 2,
    color: "#C58C5A",
  },
  {
    id: "cp-hospital-01",
    kind: "building",
    modelPath: `${CITY_PROPS_PATH}/CUPIC_HOSPITAL.obj`,
    texturePath: `${CITY_PROPS_PATH}/hospitalSurface_Color.png`,
    targetHeight: 8.5,
    position: [16.32, 0, -16.32],
    rotationY: -Math.PI / 2,
    color: "#DCE7EC",
  },
  {
    id: "cp-townhouse-01",
    kind: "building",
    modelPath: `${CITY_PROPS_PATH}/Building1_Large.fbx`,
    targetHeight: 11,
    position: [-40.5, 0, 16.32],
    rotationY: Math.PI / 2,
    color: "#B9A78F",
  },
  {
    id: "cp-block-01",
    kind: "building",
    modelPath: `${CITY_PROPS_PATH}/Building4.fbx`,
    targetHeight: 9,
    position: [40.5, 0, -16.32],
    rotationY: -Math.PI / 2,
    color: "#A8C4A2",
  },
  {
    id: "cp-block-02",
    kind: "building",
    modelPath: `${CITY_PROPS_PATH}/Building4.fbx`,
    targetHeight: 7.5,
    position: [-40.5, 0, -28.35],
    rotationY: 0.15,
    color: "#A8C4A2",
  },
  {
    id: "cp-townhouse-02",
    kind: "building",
    modelPath: `${CITY_PROPS_PATH}/Building1_Large.fbx`,
    targetHeight: 10,
    position: [40.5, 0, 28.35],
    rotationY: -0.4,
    color: "#B9A78F",
  },
];

export const STARTING_NEIGHBORHOOD: PropDef[] = [
  ...HERO_BUILDINGS,
  ...CITY_PACK_BUILDINGS,
  ...buildFillerRing(),
];
