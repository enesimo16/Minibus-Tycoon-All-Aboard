// Duraklarda beliren rastgele yolcu tipleri — Kemal'in 10 karakteri (bkz. docs/kemal/karakterler.md).
// modelPath henüz mevcut değilse otomatik placeholder'a düşülür (bkz. WaitingPassengers).

export interface PassengerType {
  id: string;
  modelPath: string;
  color: string; // model gelene kadar placeholder rengi
}

export const PASSENGER_TYPES: PassengerType[] = [
  { id: "teyze", modelPath: "/models/yolcu_teyze.glb", color: "#D98E73" },
  { id: "ogrenci", modelPath: "/models/yolcu_ogrenci.glb", color: "#8FA6BF" },
  { id: "amca", modelPath: "/models/yolcu_amca.glb", color: "#6FA35E" },
  { id: "memur", modelPath: "/models/yolcu_memur.glb", color: "#A8C4A2" },
  { id: "isci", modelPath: "/models/yolcu_isci.glb", color: "#F2B705" },
  { id: "evhanimi", modelPath: "/models/yolcu_evhanimi.glb", color: "#D98E73" },
  { id: "genckiz", modelPath: "/models/yolcu_genckiz.glb", color: "#8FA6BF" },
  { id: "dede", modelPath: "/models/yolcu_dede.glb", color: "#A8C4A2" },
  { id: "cocuk", modelPath: "/models/yolcu_cocuk.glb", color: "#F2B705" },
  { id: "turist", modelPath: "/models/yolcu_turist.glb", color: "#6FA35E" },
];

/** Durak+sıra'ya göre sabit (kararlı) bir rastgele yolcu tipi seçer — her render'da değişmez. */
export function passengerTypeFor(stopIndex: number, slotIndex: number): PassengerType {
  const hash = (stopIndex * 7919 + slotIndex * 104729) % PASSENGER_TYPES.length;
  return PASSENGER_TYPES[hash];
}
