import * as THREE from "three";

// Editör'ün TransformControls ile objeye erişmesi için basit bir kayıt defteri.
// React state'i DEĞİLDİR — sadece ref eşlemesidir, re-render tetiklemez.
export const propObjectRegistry = new Map<string, THREE.Object3D>();
