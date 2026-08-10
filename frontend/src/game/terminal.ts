export type TerminalUpgradeId =
  | "teaHouse"
  | "toilet"
  | "restaurant"
  | "park"
  | "billboard"
  | "charging";

export type TerminalUpgradeDefinition = {
  id: TerminalUpgradeId;
  name: string;
  shortName: string;
  description: string;
  cost: number;
  incomePerSecond: number;
  satisfactionPerSecond: number;
  demandBonus: number;
  accent: string;
  position: readonly [number, number];
  rotationY: number;
};

export const TERMINAL_UPGRADES: readonly TerminalUpgradeDefinition[] = [
  {
    id: "teaHouse",
    name: "Çay ocağı",
    shortName: "ÇAY",
    description: "Bekleyen yolcular oyalanır; küçük ama düzenli gelir sağlar.",
    cost: 600,
    incomePerSecond: 0.22,
    satisfactionPerSecond: 0.001,
    demandBonus: 0.02,
    accent: "#d88945",
    position: [-5.8, 2.65],
    rotationY: 0,
  },
  {
    id: "toilet",
    name: "Terminal tuvaleti",
    shortName: "WC",
    description: "Uzun bekleyişlerin memnuniyet cezasını azaltır.",
    cost: 950,
    incomePerSecond: 0.08,
    satisfactionPerSecond: 0.004,
    demandBonus: 0.01,
    accent: "#62b7d2",
    position: [0, 2.65],
    rotationY: 0,
  },
  {
    id: "restaurant",
    name: "Yolcu lokantası",
    shortName: "LOKANTA",
    description: "Terminalin ana ticari işletmesi; güçlü pasif gelir üretir.",
    cost: 1_650,
    incomePerSecond: 0.65,
    satisfactionPerSecond: 0.002,
    demandBonus: 0.04,
    accent: "#cf5c4e",
    position: [5.8, 2.65],
    rotationY: 0,
  },
  {
    id: "park",
    name: "Dinlenme parkı",
    shortName: "PARK",
    description: "Yeşil alan terminali çekici kılar ve talebi yükseltir.",
    cost: 2_300,
    incomePerSecond: 0,
    satisfactionPerSecond: 0.008,
    demandBonus: 0.08,
    accent: "#70a75f",
    position: [-5.8, -2.65],
    rotationY: 0,
  },
  {
    id: "billboard",
    name: "Dijital billboard",
    shortName: "REKLAM",
    description: "Reklam geliri ve yeni yolcu talebi üretir.",
    cost: 3_400,
    incomePerSecond: 0.48,
    satisfactionPerSecond: 0,
    demandBonus: 0.11,
    accent: "#f0ba4e",
    position: [0, -2.65],
    rotationY: 0,
  },
  {
    id: "charging",
    name: "Elektrikli şarj",
    shortName: "E-ŞARJ",
    description: "Modern terminal bonusu; en yüksek ticari geliri sağlar.",
    cost: 5_200,
    incomePerSecond: 1.1,
    satisfactionPerSecond: 0.003,
    demandBonus: 0.07,
    accent: "#43d4c4",
    position: [5.8, -2.65],
    rotationY: 0,
  },
] as const;

export function getTerminalUpgrade(id: TerminalUpgradeId) {
  return TERMINAL_UPGRADES.find((upgrade) => upgrade.id === id);
}

export function getTerminalEffects(owned: readonly TerminalUpgradeId[]) {
  return TERMINAL_UPGRADES.reduce(
    (total, upgrade) => {
      if (!owned.includes(upgrade.id)) return total;
      total.incomePerSecond += upgrade.incomePerSecond;
      total.satisfactionPerSecond += upgrade.satisfactionPerSecond;
      total.demandMultiplier += upgrade.demandBonus;
      return total;
    },
    {
      incomePerSecond: 0,
      satisfactionPerSecond: 0,
      demandMultiplier: 1,
    },
  );
}
