"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";

// A procedurally-built brake rotor (disc + drilled cooling holes + hub + bolts).
// Built from primitives so it needs zero external .glb assets — it can never
// fail to load, yet still reads clearly as a performance brake disc.
export function BrakeDisc({
  autoRotate = true,
  pointerReactive = true,
}: {
  autoRotate?: boolean;
  pointerReactive?: boolean;
}) {
  const group = useRef<Group>(null);

  const holes = useMemo(() => {
    const ring: { x: number; z: number; r: number }[] = [];
    const rings = [
      { count: 30, radius: 1.55, r: 0.07 },
      { count: 24, radius: 1.25, r: 0.06 },
      { count: 18, radius: 0.98, r: 0.05 },
    ];
    for (const { count, radius, r } of rings) {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        ring.push({ x: Math.cos(a) * radius, z: Math.sin(a) * radius, r });
      }
    }
    return ring;
  }, []);

  const bolts = useMemo(() => {
    const arr: { x: number; z: number }[] = [];
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      arr.push({ x: Math.cos(a) * 0.42, z: Math.sin(a) * 0.42 });
    }
    return arr;
  }, []);

  useFrame((state, delta) => {
    if (!group.current) return;
    if (autoRotate) group.current.rotation.y += delta * 0.35;
    if (pointerReactive) {
      const { x, y } = state.pointer;
      group.current.rotation.x += (y * 0.4 - group.current.rotation.x) * 0.05;
      group.current.rotation.z += (-x * 0.25 - group.current.rotation.z) * 0.05;
    }
  });

  return (
    <group ref={group} rotation={[0.5, 0, 0]}>
      {/* Rotor face */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1.85, 1.85, 0.16, 96]} />
        <meshStandardMaterial color="#9aa6b2" metalness={0.95} roughness={0.32} />
      </mesh>

      {/* Outer braking-surface lip */}
      <mesh position={[0, 0.085, 0]}>
        <torusGeometry args={[1.78, 0.05, 24, 96]} />
        <meshStandardMaterial color="#c9d3dd" metalness={1} roughness={0.25} />
      </mesh>
      <mesh position={[0, -0.085, 0]}>
        <torusGeometry args={[1.78, 0.05, 24, 96]} />
        <meshStandardMaterial color="#c9d3dd" metalness={1} roughness={0.25} />
      </mesh>

      {/* Inner machined groove */}
      <mesh position={[0, 0.09, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.72, 1.7, 80]} />
        <meshStandardMaterial color="#5c6671" metalness={0.9} roughness={0.5} />
      </mesh>

      {/* Drilled cooling holes */}
      {holes.map((h, i) => (
        <mesh key={i} position={[h.x, 0, h.z]}>
          <cylinderGeometry args={[h.r, h.r, 0.3, 16]} />
          <meshStandardMaterial color="#0b0e13" metalness={0.6} roughness={0.6} />
        </mesh>
      ))}

      {/* Hat / hub */}
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.62, 0.7, 0.3, 48]} />
        <meshStandardMaterial color="#ff6b1a" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.5, 0.62, 0.06, 48]} />
        <meshStandardMaterial color="#1a1f28" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Center bore */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.5, 32]} />
        <meshStandardMaterial color="#05070a" metalness={0.5} roughness={0.7} />
      </mesh>

      {/* Lug bolts */}
      {bolts.map((b, i) => (
        <mesh key={i} position={[b.x, 0.3, b.z]}>
          <cylinderGeometry args={[0.07, 0.07, 0.12, 6]} />
          <meshStandardMaterial color="#dfe6ee" metalness={1} roughness={0.2} />
        </mesh>
      ))}
    </group>
  );
}
