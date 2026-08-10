"use client";

import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFBX, useGLTF, useTexture } from "@react-three/drei";
import { useLoader } from "@react-three/fiber";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { PropDef } from "./types";
import { ModelErrorBoundary } from "./ModelErrorBoundary";
import { propObjectRegistry } from "./registry";
import { useEditorStore } from "../editor/editorStore";

// Her prop için: modelPath varsa gerçek .glb yüklenir; yoksa/hata verirse
// türüne göre basit bir placeholder gösterilir. Kemal dosyayı public/models/
// altına koyduğunda kod hiç değişmeden gerçek model sahneye girer.

function PlaceholderMesh({ kind, color }: { kind: PropDef["kind"]; color?: string }) {
  const c = color ?? "#999999";
  if (kind === "vegetation") {
    return (
      <mesh castShadow position={[0, 1, 0]}>
        <coneGeometry args={[0.8, 2, 8]} />
        <meshStandardMaterial color={c} />
      </mesh>
    );
  }
  if (kind === "prop") {
    return (
      <mesh castShadow position={[0, 0.4, 0]}>
        <boxGeometry args={[0.5, 0.8, 0.5]} />
        <meshStandardMaterial color={c} />
      </mesh>
    );
  }
  // building
  return (
    <mesh castShadow position={[0, 1.5, 0]}>
      <boxGeometry args={[3, 3, 3]} />
      <meshStandardMaterial color={c} />
    </mesh>
  );
}

/**
 * Model yükleyici — uzantıya göre doğru yükleyiciyi seçer.
 * GLB/GLTF gömülü dokusuyla gelir; hazır paketlerden gelen OBJ ve FBX'lerde doku
 * ayrı dosyadadır ve `texturePath` ile bağlanır.
 */
function LoadedModel({
  path,
  texturePath,
  targetHeight,
}: {
  path: string;
  texturePath?: string;
  targetHeight?: number;
}) {
  const extension = path.slice(path.lastIndexOf(".")).toLowerCase();
  if (extension === ".obj") return <ObjModel path={path} texturePath={texturePath} targetHeight={targetHeight} />;
  if (extension === ".fbx") return <FbxModel path={path} texturePath={texturePath} targetHeight={targetHeight} />;
  return <GltfModel path={path} targetHeight={targetHeight} />;
}

/** Modeli hedef yüksekliğe göre ölçekler ve tabanını yere oturtur. */
function useNormalized(source: THREE.Object3D, targetHeight: number | undefined, texture?: THREE.Texture) {
  return useMemo(() => {
    const model = source.clone(true);
    if (texture) {
      model.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        object.material = materials.map((sourceMaterial) => {
          const material = (sourceMaterial as THREE.MeshStandardMaterial).clone();
          material.map = texture;
          material.color.set("#ffffff");
          material.needsUpdate = true;
          return material;
        });
        if (!Array.isArray(object.material)) return;
        if (object.material.length === 1) object.material = object.material[0];
      });
    }
    // PERF: hazır paket binaları gölge ÜRETMEZ. Gölge haritası zaten hat çevresine
    // sıkıştırılmış; şehrin kenarındaki dolgu binaları için ikinci bir geçiş ödemeye değmez.
    model.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = false;
        object.receiveShadow = false;
      }
    });

    if (!targetHeight) return { model, scale: 1 };
    const bounds = new THREE.Box3().setFromObject(model);
    const height = Math.max(0.001, bounds.max.y - bounds.min.y);
    const center = bounds.getCenter(new THREE.Vector3());
    model.position.set(-center.x, -bounds.min.y, -center.z);
    return { model, scale: targetHeight / height };
  }, [source, targetHeight, texture]);
}

function GltfModel({ path, targetHeight }: { path: string; targetHeight?: number }) {
  const { scene } = useGLTF(path);
  const { model, scale } = useNormalized(scene, targetHeight);
  return <primitive object={model} scale={scale} />;
}

function FbxModel({ path, texturePath, targetHeight }: { path: string; texturePath?: string; targetHeight?: number }) {
  const source = useFBX(path);
  const texture = useOptionalTexture(texturePath);
  const { model, scale } = useNormalized(source, targetHeight, texture);
  return <primitive object={model} scale={scale} />;
}

function ObjModel({ path, texturePath, targetHeight }: { path: string; texturePath?: string; targetHeight?: number }) {
  const source = useLoader(OBJLoader, path);
  const texture = useOptionalTexture(texturePath);
  const { model, scale } = useNormalized(source, targetHeight, texture);
  return <primitive object={model} scale={scale} />;
}

/**
 * Doku yolu opsiyoneldir ama hook sayısı sabit kalmalıdır — yol yoksa
 * 1x1 saydam bir veri URI'si yüklenir ve `undefined` döndürülür.
 */
const BLANK_TEXTURE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function useOptionalTexture(texturePath?: string): THREE.Texture | undefined {
  const loaded = useTexture(texturePath ?? BLANK_TEXTURE) as THREE.Texture;
  return useMemo(() => {
    if (!texturePath) return undefined;
    // Yüklenen doku drei önbelleğinde PAYLAŞILIR; üzerinde oynamak yerine kopyalıyoruz.
    // Kopya görüntüyü paylaşır (ek bellek yok), yalnızca ayarları kendine aittir.
    const copy = loaded.clone();
    copy.colorSpace = THREE.SRGBColorSpace;
    copy.needsUpdate = true;
    return copy;
  }, [loaded, texturePath]);
}

export function SceneProp({ def }: { def: PropDef }) {
  const group = useRef<THREE.Group>(null!);
  const editorActive = useEditorStore((s) => s.active);
  const select = useEditorStore((s) => s.select);

  useEffect(() => {
    propObjectRegistry.set(def.id, group.current);
    return () => {
      propObjectRegistry.delete(def.id);
    };
  }, [def.id]);

  const placeholder = <PlaceholderMesh kind={def.kind} color={def.color} />;

  return (
    <group
      ref={group}
      position={def.position}
      rotation={[0, def.rotationY ?? 0, 0]}
      scale={def.scale ?? 1}
      userData={{ propId: def.id }}
      onClick={
        editorActive
          ? (e) => {
              e.stopPropagation();
              select(def.id);
            }
          : undefined
      }
    >
      {def.modelPath ? (
        <ModelErrorBoundary fallback={placeholder}>
          <Suspense fallback={placeholder}>
            <LoadedModel path={def.modelPath} texturePath={def.texturePath} targetHeight={def.targetHeight} />
          </Suspense>
        </ModelErrorBoundary>
      ) : (
        placeholder
      )}
    </group>
  );
}
