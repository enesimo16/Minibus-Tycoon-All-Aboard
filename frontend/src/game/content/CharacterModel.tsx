"use client";

import { useFBX } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

// Mahalle sakinleri — "Animated Men/Women Pack" karakterleri.
// Eski tek "peasant" modeli kaldırıldı: tüm yolcular aynı kişiydi ve dokusu
// (Peasant Nolant Green.png) eksikti. Bu paketler dokularını FBX içinde taşır,
// bu yüzden ayrıca doku yüklemeye gerek yok.
//
// PERF NOTU: bunlar iskeletli (skinned) ve ANİMASYONLU modellerdir. Aynı anda
// sahnede çok sayıda bulunmamalı — durak başına görünür yolcu sayısı
// MvpWorld > MAX_VISIBLE_PASSENGERS_PER_STOP ile sınırlıdır.
export const CHARACTER_MODELS = [
  "/models/characters/people/Male_Casual.fbx",
  "/models/characters/people/Female_Casual.fbx",
  "/models/characters/people/Male_LongSleeve.fbx",
  "/models/characters/people/Female_Dress.fbx",
  "/models/characters/people/Male_Shirt.fbx",
  "/models/characters/people/Female_TankTop.fbx",
  "/models/characters/people/Male_Suit.fbx",
  "/models/characters/people/Female_Alternative.fbx",
] as const;

export const CHARACTER_VARIANT_COUNT = CHARACTER_MODELS.length;

function modelPathForVariant(variant: number): string {
  const index = ((variant % CHARACTER_VARIANT_COUNT) + CHARACTER_VARIANT_COUNT) % CHARACTER_VARIANT_COUNT;
  return CHARACTER_MODELS[index];
}

export function CharacterModel({
  variant,
  height = 0.59,
  /** true: yürüme/hareket klibi oynar. false: ilk kare (duruş) — CPU harcamaz. */
  animate = true,
}: {
  variant: number;
  height?: number;
  animate?: boolean;
}) {
  const source = useFBX(modelPathForVariant(variant));
  const mixer = useRef<THREE.AnimationMixer | null>(null);

  const { model, scale } = useMemo(() => {
    const cloned = cloneSkeleton(source);
    cloned.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = false;
      object.receiveShadow = false;
      object.frustumCulled = true;
    });

    // Modeli oyunun ölçeğine oturt: tabanı yere, merkezi orijine.
    const bounds = new THREE.Box3().setFromObject(cloned);
    const center = bounds.getCenter(new THREE.Vector3());
    const sourceHeight = Math.max(0.001, bounds.max.y - bounds.min.y);
    cloned.position.set(-center.x, -bounds.min.y, -center.z);
    return { model: cloned, scale: height / sourceHeight };
  }, [height, source]);

  useEffect(() => {
    const clips = source.animations;
    if (!animate || !clips || clips.length === 0) {
      mixer.current = null;
      return;
    }
    const instance = new THREE.AnimationMixer(model);
    const action = instance.clipAction(clips[0]);
    // Her karakter klibin farklı bir yerinden başlar — hepsi aynı anda aynı
    // hareketi yapan robot ordusu gibi görünmesin.
    action.time = (variant * 0.37) % Math.max(0.001, clips[0].duration);
    action.play();
    mixer.current = instance;
    return () => {
      instance.stopAllAction();
      instance.uncacheRoot(model);
      mixer.current = null;
    };
  }, [animate, model, source, variant]);

  useFrame((_, delta) => {
    mixer.current?.update(Math.min(delta, 0.05));
  });

  return (
    <group scale={scale} rotation={[0, Math.PI, 0]}>
      <primitive object={model} />
    </group>
  );
}

// PERF: BİLEREK ön yükleme yok. Sekiz karakter ~16 MB tutuyor; hepsini açılışta
// indirmek boot süresini uçuruyordu. Modeller Suspense ile ilk görüldüklerinde
// yüklenir; uzaktaki durakların yolcuları zaten render edilmiyor
// (MvpWorld > VISIBLE_STOP_PROGRESS_RANGE).
//
// Kemal şunu yapsın: bu sekiz FBX'i GLB + Draco'ya çevirip
// `public/models/characters/people/*.glb` olarak koysun (hedef: dosya başına
// < 400 KB, iskelet + tek "idle/walk" klibi korunacak). Dönüşüm sonrası bu dosyada
// `useFBX` yerine `useGLTF` kullanılacak — başka kod değişmez.
