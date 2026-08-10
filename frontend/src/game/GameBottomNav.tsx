"use client";

import { useState, type ComponentType, type SVGProps } from "react";
import {
  BusIcon,
  CityIcon,
  DiceIcon,
  DriverIcon,
  GarageIcon,
  RouteIcon,
  SettingsIcon,
  WrenchIcon,
  XIcon,
} from "./GameIcon";
import { useT } from "./i18n";
import { useRadioStore } from "./radioStore";
import { useUiStore, type ManagementTab } from "./uiStore";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const MOBILE_MENU: Array<{ tab: ManagementTab; labelKey: string; icon: IconComponent }> = [
  { tab: "garage", labelKey: "management.garage", icon: GarageIcon },
  { tab: "city", labelKey: "management.city", icon: CityIcon },
  { tab: "drivers", labelKey: "management.drivers", icon: BusIcon },
  { tab: "routes", labelKey: "management.routes", icon: RouteIcon },
];

export function GameBottomNav() {
  const t = useT();
  const stripMode = useUiStore((state) => state.stripMode);
  const profileOpen = useUiStore((state) => state.profileOpen);
  const settingsOpen = useUiStore((state) => state.settingsOpen);
  const chanceOpen = useUiStore((state) => state.chanceGamesOpen);
  const managementOpen = useUiStore((state) => state.managementOpen);
  const toggleProfile = useUiStore((state) => state.toggleProfile);
  const toggleSettings = useUiStore((state) => state.toggleSettings);
  const toggleChance = useUiStore((state) => state.toggleChanceGames);
  const toggleManagement = useUiStore((state) => state.toggleManagement);
  const openManagementTab = useUiStore((state) => state.openManagementTab);
  const [menuOpen, setMenuOpen] = useState(false);

  if (stripMode) return null;

  const closeRadio = () => useRadioStore.getState().closePanel();
  const openTab = (tab: ManagementTab) => {
    closeRadio();
    openManagementTab(tab);
  };

  return (
    <>
      <nav className="ff-desktop-bottom-nav" aria-label={t("nav.managementMenu")}>
        <BottomButton tutorialId="profile" active={profileOpen} label={t("profile.open")} icon={DriverIcon} onClick={() => { closeRadio(); toggleProfile(); }} />
        <BottomButton tutorialId="settings" active={settingsOpen} label={t("settings.open")} icon={SettingsIcon} onClick={() => { closeRadio(); toggleSettings(); }} />
      </nav>

      <div className="ff-mobile-top-tools" aria-label={t("nav.managementMenu")}>
        <RoundButton tutorialId="management" active={managementOpen} label={t("nav.management")} icon={WrenchIcon} onClick={() => { closeRadio(); toggleManagement(); }} />
        <RoundButton active={chanceOpen} label={t("nav.chance")} icon={DiceIcon} onClick={() => { closeRadio(); toggleChance(); }} />
        <RoundButton tutorialId="settings" active={settingsOpen} label={t("settings.open")} icon={SettingsIcon} onClick={() => { closeRadio(); toggleSettings(); }} />
      </div>

      <nav className={`ff-mobile-radial ${menuOpen ? "is-open" : ""}`} aria-label={t("nav.managementMenu")}>
        <div className="ff-mobile-radial-items">
          {MOBILE_MENU.map(({ tab, labelKey, icon: Icon }) => (
            <button
              key={tab}
              type="button"
              className="ff-mobile-radial-item"
              onClick={() => openTab(tab)}
              aria-label={t(labelKey)}
            >
              <Icon className="h-5 w-5" />
              <span>{t(labelKey)}</span>
            </button>
          ))}
          <button data-tutorial="profile" type="button" className="ff-mobile-radial-item ff-mobile-profile" onClick={() => { closeRadio(); toggleProfile(); }} aria-label={t("profile.open")}>
            <DriverIcon className="h-5 w-5" />
            <span>{t("profile.open")}</span>
          </button>
        </div>
        <button type="button" className="ff-mobile-menu-toggle" onClick={() => setMenuOpen((open) => !open)} aria-expanded={menuOpen} aria-label={t("nav.managementMenu")}>
          {menuOpen ? <XIcon className="h-7 w-7" /> : <WrenchIcon className="h-6 w-6" />}
        </button>
      </nav>
    </>
  );
}

function BottomButton({ active, label, icon: Icon, onClick, tutorialId }: { active: boolean; label: string; icon: IconComponent; onClick: () => void; tutorialId?: string }) {
  return <button type="button" data-tutorial={tutorialId} data-active={active} onClick={onClick}><Icon className="h-4 w-4" /><span>{label}</span></button>;
}

function RoundButton({ active, label, icon: Icon, onClick, tutorialId }: { active: boolean; label: string; icon: IconComponent; onClick: () => void; tutorialId?: string }) {
  return <button type="button" data-tutorial={tutorialId} data-active={active} aria-label={label} title={label} onClick={onClick}><Icon className="h-5 w-5" /></button>;
}
