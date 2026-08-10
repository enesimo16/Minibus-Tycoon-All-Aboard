"use client";

import { memo } from "react";
import { useGameStore } from "../store";
import {
  TERMINAL_UPGRADES,
  type TerminalUpgradeDefinition,
} from "../terminal";
import {
  hasTerminalUpgradeModel,
  TerminalUpgradeModel,
} from "./TerminalUpgradeModel";

export const TerminalDistrict = memo(function TerminalDistrict() {
  const owned = useGameStore((s) => s.terminalUpgrades);

  return (
    <group>
      <TerminalPlaza />
      <TerminalMarker />
      {TERMINAL_UPGRADES.map((upgrade) => (
        <group
          key={upgrade.id}
          position={[upgrade.position[0], 0.06, upgrade.position[1]]}
          rotation={[0, upgrade.rotationY, 0]}
        >
          {owned.includes(upgrade.id)
            ? (
              <group scale={2}>
                <TerminalBuilding upgrade={upgrade} />
              </group>
            )
            : <InvestmentPad accent={upgrade.accent} />}
        </group>
      ))}
    </group>
  );
});

function TerminalMarker() {
  return (
    <group position={[0, 0.1, 4.75]}>
      <mesh position={[-1.05, 0.82, 0]}>
        <boxGeometry args={[0.1, 1.65, 0.1]} />
        <meshStandardMaterial color="#26343c" />
      </mesh>
      <mesh position={[1.05, 0.82, 0]}>
        <boxGeometry args={[0.1, 1.65, 0.1]} />
        <meshStandardMaterial color="#26343c" />
      </mesh>
      <mesh position={[0, 1.48, 0]}>
        <boxGeometry args={[2.2, 0.48, 0.16]} />
        <meshStandardMaterial color="#14242b" emissive="#0d7e88" emissiveIntensity={0.24} />
      </mesh>
      <mesh position={[-0.66, 1.48, 0.1]}>
        <boxGeometry args={[0.46, 0.3, 0.025]} />
        <meshStandardMaterial color="#4bd6dc" emissive="#22aab2" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0.2, 1.48, 0.1]}>
        <boxGeometry args={[0.95, 0.07, 0.025]} />
        <meshStandardMaterial color="#f4cf69" emissive="#c89727" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[0.46, 1.34, 0.1]}>
        <boxGeometry args={[0.43, 0.045, 0.025]} />
        <meshStandardMaterial color="#d9e7e8" />
      </mesh>
    </group>
  );
}

function TerminalPlaza() {
  const lampXs = [-7.4, -4.45, -1.5, 1.5, 4.45, 7.4];

  return (
    <group>
      <mesh position={[0, 0.055, 0]} receiveShadow>
        <boxGeometry args={[18.05, 0.1, 10.45]} />
        <meshStandardMaterial color="#879398" roughness={0.96} />
      </mesh>

      <mesh position={[0, 0.115, 0]}>
        <boxGeometry args={[2.15, 0.025, 9.45]} />
        <meshStandardMaterial color="#b7c0c0" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.118, 0]}>
        <boxGeometry args={[17.1, 0.028, 0.72]} />
        <meshStandardMaterial color="#aab4b5" roughness={0.92} />
      </mesh>

      {[
        [0, 5.08, 17.7, 0.08],
        [0, -5.08, 17.7, 0.08],
        [-8.78, 0, 0.08, 10.08],
        [8.78, 0, 0.08, 10.08],
      ].map(([x, z, width, depth], index) => (
        <mesh key={index} position={[x, 0.13, z]}>
          <boxGeometry args={[width, 0.035, depth]} />
          <meshStandardMaterial
            color="#45ccd3"
            emissive="#168b96"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}

      {lampXs.flatMap((x) =>
        ([-4.72, 4.72] as const).map((z) => (
          <group key={`${x}-${z}`} position={[x, 0.12, z]}>
            <mesh position={[0, 0.45, 0]}>
              <cylinderGeometry args={[0.035, 0.05, 0.9, 8]} />
              <meshStandardMaterial color="#334147" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.93, 0]}>
              <sphereGeometry args={[0.095, 10, 8]} />
              <meshStandardMaterial
                color="#fff0ac"
                emissive="#ffd766"
                emissiveIntensity={0.8}
              />
            </mesh>
          </group>
        )),
      )}

      {([-8.05, 8.05] as const).map((x) => (
        <group key={x} position={[x, 0.13, 0]}>
          <mesh>
            <boxGeometry args={[0.7, 0.16, 2.4]} />
            <meshStandardMaterial color="#4c5a58" roughness={0.92} />
          </mesh>
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[0.52, 0.26, 2.12]} />
            <meshStandardMaterial color="#668650" roughness={0.98} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function InvestmentPad({ accent }: { accent: string }) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[2.35, 0.055, 1.55]} />
        <meshStandardMaterial color="#526168" roughness={0.92} />
      </mesh>
      <mesh position={[0, 0.035, 0]}>
        <boxGeometry args={[2.08, 0.035, 1.28]} />
        <meshStandardMaterial
          color="#26373c"
          emissive="#123d42"
          emissiveIntensity={0.16}
          transparent
          opacity={0.92}
        />
      </mesh>
      <mesh position={[0, 0.065, 0.6]}>
        <boxGeometry args={[1.76, 0.045, 0.07]} />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.42}
        />
      </mesh>
    </group>
  );
}

function TerminalBuilding({ upgrade }: { upgrade: TerminalUpgradeDefinition }) {
  if (hasTerminalUpgradeModel(upgrade.id)) {
    return <TerminalUpgradeModel id={upgrade.id} />;
  }

  switch (upgrade.id) {
    case "teaHouse":
      return <TeaHouse accent={upgrade.accent} />;
    case "toilet":
      return <Toilet accent={upgrade.accent} />;
    case "restaurant":
      return <Restaurant accent={upgrade.accent} />;
    case "park":
      return <RestPark />;
    case "billboard":
      return <Billboard accent={upgrade.accent} />;
    case "charging":
      return <ChargingStation accent={upgrade.accent} />;
  }
}

function TeaHouse({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.43, 0]}>
        <boxGeometry args={[1.35, 0.82, 0.92]} />
        <meshStandardMaterial color="#efe1c4" roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[1.58, 0.13, 1.12]} />
        <meshStandardMaterial color={accent} roughness={0.78} />
      </mesh>
      <mesh position={[0, 0.48, 0.47]}>
        <boxGeometry args={[0.82, 0.34, 0.05]} />
        <meshStandardMaterial color="#26363b" />
      </mesh>
      <mesh position={[0, 0.76, 0.51]}>
        <boxGeometry args={[0.72, 0.13, 0.04]} />
        <meshStandardMaterial color="#f4cf69" emissive="#9c681d" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

function Toilet({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.58, 0]}>
        <boxGeometry args={[1.45, 1.12, 1]} />
        <meshStandardMaterial color="#e2e5df" roughness={0.85} />
      </mesh>
      {[-0.37, 0.37].map((x) => (
        <mesh key={x} position={[x, 0.5, 0.51]}>
          <boxGeometry args={[0.48, 0.78, 0.05]} />
          <meshStandardMaterial color={accent} roughness={0.72} />
        </mesh>
      ))}
      <mesh position={[0, 1.17, 0]}>
        <boxGeometry args={[1.58, 0.11, 1.12]} />
        <meshStandardMaterial color="#42545a" />
      </mesh>
    </group>
  );
}

function Restaurant({ accent }: { accent: string }) {
  return (
    <group>
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[2.15, 1.16, 1.45]} />
        <meshStandardMaterial color="#ead8bd" roughness={0.88} />
      </mesh>
      <mesh position={[0, 1.26, 0]}>
        <boxGeometry args={[2.4, 0.16, 1.7]} />
        <meshStandardMaterial color={accent} roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.8, 0.76]}>
        <boxGeometry args={[1.62, 0.24, 0.08]} />
        <meshStandardMaterial color="#f4cf69" emissive="#bd6b22" emissiveIntensity={0.3} />
      </mesh>
      {[-0.62, 0, 0.62].map((x) => (
        <mesh key={x} position={[x, 0.47, 0.76]}>
          <boxGeometry args={[0.45, 0.38, 0.06]} />
          <meshStandardMaterial color="#91c8d2" metalness={0.05} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function RestPark() {
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[1.7, 1.85, 0.11, 16]} />
        <meshStandardMaterial color="#8ca469" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.56, 0.68, 0.22, 16]} />
        <meshStandardMaterial color="#b8b3a6" />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.42, 0.48, 0.12, 16]} />
        <meshStandardMaterial color="#4fc5d1" emissive="#237985" emissiveIntensity={0.3} />
      </mesh>
      {[-1.05, 1.05].map((x) => (
        <group key={x} position={[x, 0, 0.3]}>
          <mesh position={[0, 0.53, 0]}>
            <cylinderGeometry args={[0.08, 0.11, 0.86, 7]} />
            <meshStandardMaterial color="#7b5736" />
          </mesh>
          <mesh position={[0, 1.03, 0]}>
            <coneGeometry args={[0.48, 1.05, 8]} />
            <meshStandardMaterial color="#648c4c" roughness={0.95} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Billboard({ accent }: { accent: string }) {
  return (
    <group>
      {[-0.6, 0.6].map((x) => (
        <mesh key={x} position={[x, 0.7, 0]}>
          <boxGeometry args={[0.09, 1.4, 0.09]} />
          <meshStandardMaterial color="#394248" metalness={0.25} />
        </mesh>
      ))}
      <mesh position={[0, 1.45, 0]}>
        <boxGeometry args={[1.72, 0.92, 0.13]} />
        <meshStandardMaterial color="#17232a" />
      </mesh>
      <mesh position={[0, 1.45, 0.075]}>
        <boxGeometry args={[1.5, 0.7, 0.025]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.62} />
      </mesh>
      <mesh position={[0.25, 1.45, 0.094]}>
        <boxGeometry args={[0.74, 0.12, 0.015]} />
        <meshStandardMaterial color="#17232a" />
      </mesh>
    </group>
  );
}

function ChargingStation({ accent }: { accent: string }) {
  return (
    <group>
      {[-0.52, 0.52].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.82, 0.06, 1.5]} />
            <meshStandardMaterial color="#41494d" />
          </mesh>
          <mesh position={[0, 0.47, -0.5]}>
            <boxGeometry args={[0.28, 0.9, 0.24]} />
            <meshStandardMaterial color="#e6ece8" />
          </mesh>
          <mesh position={[0, 0.58, -0.63]}>
            <boxGeometry args={[0.17, 0.28, 0.025]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.75} />
          </mesh>
          <mesh position={[0, 0.06, 0.08]}>
            <boxGeometry args={[0.08, 0.025, 0.72]} />
            <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={0.35} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
