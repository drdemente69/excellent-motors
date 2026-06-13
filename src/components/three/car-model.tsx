"use client";

import { useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { Shape, ExtrudeGeometry, Group, Vector3, MathUtils, DoubleSide } from "three";

// A stylized but genuinely car-shaped sports coupe. The body and greenhouse are
// EXTRUDED from hand-drawn side-profile silhouettes (not boxes), so the shape
// flows like a real car while every panel stays a separate, dismantlable part.
// Length runs along +X (front = +X). Scroll progress (0→1) choreographs:
//   0.00–0.45  side profile → top-down (camera arc)
//   0.45–0.60  hold top-down
//   0.60–1.00  exploded view — parts fly apart with labels

const ORANGE = "#ee5a13";
const CARBON = "#16181d";
const GLASS = "#0c1a24";
const RIM = "#d7dee7";
const RED = "#ff2d20";

function smoothstep(a: number, b: number, x: number) {
  const t = MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Build an extruded solid from a 2D side profile (x = length, y = height). */
function extrudeProfile(draw: (s: Shape) => void, width: number, bevel = 0.16) {
  const shape = new Shape();
  draw(shape);
  const geo = new ExtrudeGeometry(shape, {
    depth: width,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: bevel,
    bevelSegments: 6,
    steps: 1,
    curveSegments: 32,
  });
  geo.translate(0, 0, -width / 2); // centre across width
  geo.computeVertexNormals();
  return geo;
}

// ── Reusable sub-assemblies ───────────────────────────────────────────────────
function Wheel() {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* tyre */}
      <mesh castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.26, 40]} />
        <meshStandardMaterial color="#0b0d11" roughness={0.85} metalness={0.1} />
      </mesh>
      {/* rim face */}
      <mesh position={[0, 0.135, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.04, 32]} />
        <meshStandardMaterial color={RIM} metalness={1} roughness={0.22} />
      </mesh>
      {/* spokes */}
      {Array.from({ length: 10 }).map((_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.16, 0.14, Math.sin(a) * 0.16]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.04, 0.03, 0.28]} />
            <meshStandardMaterial color={RIM} metalness={1} roughness={0.28} />
          </mesh>
        );
      })}
      {/* hub + brake disc hint */}
      <mesh position={[0, 0.15, 0]}><cylinderGeometry args={[0.08, 0.08, 0.05, 20]} /><meshStandardMaterial color="#2a2e36" metalness={0.8} roughness={0.4} /></mesh>
      <mesh position={[0, 0.06, 0]}><cylinderGeometry args={[0.24, 0.24, 0.03, 32]} /><meshStandardMaterial color="#3a3f48" metalness={0.7} roughness={0.5} /></mesh>
    </group>
  );
}

function Seat() {
  return (
    <group>
      <mesh castShadow><boxGeometry args={[0.36, 0.12, 0.4]} /><meshStandardMaterial color={CARBON} roughness={0.5} /></mesh>
      <mesh position={[-0.02, 0.32, -0.16]} rotation={[-0.18, 0, 0]} castShadow><boxGeometry args={[0.36, 0.58, 0.12]} /><meshStandardMaterial color={ORANGE} roughness={0.5} metalness={0.2} /></mesh>
      <mesh position={[0, 0.62, -0.18]}><boxGeometry args={[0.18, 0.16, 0.1]} /><meshStandardMaterial color={CARBON} /></mesh>
    </group>
  );
}

// ── Part definitions ──────────────────────────────────────────────────────────
type PartDef = {
  assembled: [number, number, number];
  explode: [number, number, number];
  spin?: [number, number, number];
  label?: string;
  node: ReactNode;
};

function useParts(): PartDef[] {
  // Lower body — long-hood coupe tub (front = +X). Beltline flat where cabin sits.
  const bodyGeo = useMemo(
    () =>
      extrudeProfile((s) => {
        s.moveTo(-2.0, 0.30);
        s.lineTo(1.95, 0.30); // flat floor
        s.lineTo(2.2, 0.44); // front splitter lip
        s.quadraticCurveTo(2.32, 0.5, 2.18, 0.6); // nose
        s.lineTo(1.95, 0.64);
        s.lineTo(0.95, 0.66); // long bonnet
        s.quadraticCurveTo(0.6, 0.67, 0.5, 0.78); // cowl up to beltline
        s.lineTo(-0.78, 0.8); // beltline (cabin sits here)
        s.lineTo(-1.5, 0.74); // rear deck
        s.quadraticCurveTo(-1.92, 0.72, -2.05, 0.56); // rear haunch down
        s.lineTo(-2.08, 0.34); // rear bumper
        s.closePath();
      }, 1.5),
    [],
  );

  // Greenhouse — smoked-glass cabin (windshield → roof → fastback).
  const cabinGeo = useMemo(
    () =>
      extrudeProfile((s) => {
        s.moveTo(0.5, 0.78);
        s.quadraticCurveTo(0.18, 0.84, -0.08, 1.16); // raked windscreen
        s.lineTo(-0.62, 1.2); // roof
        s.quadraticCurveTo(-1.05, 1.18, -1.42, 0.82); // fastback rear glass
        s.lineTo(0.5, 0.78);
        s.closePath();
      }, 1.24, 0.06),
    [],
  );

  return [
    {
      assembled: [0, 0, 0],
      explode: [0, -0.7, 0],
      label: "Wide-body shell",
      node: (
        <group>
          <mesh geometry={bodyGeo} castShadow receiveShadow>
            <meshPhysicalMaterial color={ORANGE} metalness={0.55} roughness={0.28} clearcoat={1} clearcoatRoughness={0.12} />
          </mesh>
          {/* sill skirts */}
          <mesh position={[-0.1, 0.3, 0.78]}><boxGeometry args={[2.8, 0.12, 0.08]} /><meshStandardMaterial color={CARBON} roughness={0.5} /></mesh>
          <mesh position={[-0.1, 0.3, -0.78]}><boxGeometry args={[2.8, 0.12, 0.08]} /><meshStandardMaterial color={CARBON} roughness={0.5} /></mesh>
        </group>
      ),
    },
    {
      assembled: [0, 0, 0],
      explode: [0, 1.7, 0],
      spin: [0.15, 0.2, 0],
      label: "Roof & glass",
      node: (
        <mesh geometry={cabinGeo} castShadow>
          <meshPhysicalMaterial color={GLASS} metalness={0.5} roughness={0.08} clearcoat={1} transparent opacity={0.82} side={DoubleSide} />
        </mesh>
      ),
    },
    // Front splitter / body kit
    {
      assembled: [0, 0, 0],
      explode: [2.4, -0.5, 0],
      label: "Front lip / body kit",
      node: <mesh position={[2.05, 0.26, 0]} castShadow><boxGeometry args={[0.5, 0.06, 1.7]} /><meshStandardMaterial color={CARBON} roughness={0.4} /></mesh>,
    },
    // Rear diffuser
    {
      assembled: [0, 0, 0],
      explode: [-2.4, -0.4, 0],
      spin: [0.2, 0, 0],
      label: "Rear diffuser",
      node: (
        <group position={[-1.95, 0.26, 0]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} position={[0, 0, -0.6 + i * 0.24]}><boxGeometry args={[0.32, 0.2, 0.04]} /><meshStandardMaterial color={CARBON} roughness={0.45} /></mesh>
          ))}
        </group>
      ),
    },
    // Rear GT wing
    {
      assembled: [0, 0, 0],
      explode: [-1.8, 1.5, 0],
      spin: [-0.25, 0, 0],
      label: "GT wing",
      node: (
        <group position={[-1.7, 1.02, 0]}>
          <mesh castShadow><boxGeometry args={[0.42, 0.05, 1.8]} /><meshStandardMaterial color={CARBON} roughness={0.4} /></mesh>
          <mesh position={[0.05, -0.16, 0.62]}><boxGeometry args={[0.1, 0.3, 0.08]} /><meshStandardMaterial color={CARBON} /></mesh>
          <mesh position={[0.05, -0.16, -0.62]}><boxGeometry args={[0.1, 0.3, 0.08]} /><meshStandardMaterial color={CARBON} /></mesh>
        </group>
      ),
    },
    // Wheels (front +X, rear -X)
    { assembled: [1.4, 0.4, 0.92], explode: [1.6, -0.3, 2.4], spin: [0, 0, 0], label: "Forged wheels", node: <Wheel /> },
    { assembled: [1.4, 0.4, -0.92], explode: [1.6, -0.3, -2.4], spin: [0, 0, 0], node: <Wheel /> },
    { assembled: [-1.45, 0.4, 0.92], explode: [-1.6, -0.3, 2.4], spin: [0, 0, 0], node: <Wheel /> },
    { assembled: [-1.45, 0.4, -0.92], explode: [-1.6, -0.3, -2.4], spin: [0, 0, 0], node: <Wheel /> },
    // Bucket seats (inside cabin → rise out)
    { assembled: [-0.35, 0.5, 0.32], explode: [-0.35, 1.9, 1.0], spin: [0.3, 0.5, 0], label: "Bucket seats", node: <Seat /> },
    { assembled: [-0.35, 0.5, -0.32], explode: [-0.35, 1.9, -1.0], spin: [0.3, -0.5, 0], node: <Seat /> },
    // Headlights (front)
    {
      assembled: [0, 0, 0],
      explode: [2.8, 0.5, 0],
      label: "LED headlights",
      node: (
        <group position={[2.0, 0.58, 0]}>
          <mesh position={[0, 0, 0.55]} rotation={[0, 0, -0.3]}><boxGeometry args={[0.34, 0.12, 0.3]} /><meshStandardMaterial color="#eaf6ff" emissive="#bfe9ff" emissiveIntensity={1.5} /></mesh>
          <mesh position={[0, 0, -0.55]} rotation={[0, 0, -0.3]}><boxGeometry args={[0.34, 0.12, 0.3]} /><meshStandardMaterial color="#eaf6ff" emissive="#bfe9ff" emissiveIntensity={1.5} /></mesh>
        </group>
      ),
    },
    // Tail light bar
    {
      assembled: [0, 0, 0],
      explode: [-2.9, 0.6, 0],
      node: <mesh position={[-2.06, 0.62, 0]}><boxGeometry args={[0.06, 0.1, 1.5]} /><meshStandardMaterial color={RED} emissive={RED} emissiveIntensity={1.3} /></mesh>,
    },
    // Side mirrors
    { assembled: [0.45, 0.86, 0.92], explode: [0.45, 1.3, 2.2], label: undefined, node: <mesh castShadow rotation={[0, 0, -0.2]}><boxGeometry args={[0.2, 0.12, 0.1]} /><meshStandardMaterial color={CARBON} /></mesh> },
    { assembled: [0.45, 0.86, -0.92], explode: [0.45, 1.3, -2.2], node: <mesh castShadow rotation={[0, 0, -0.2]}><boxGeometry args={[0.2, 0.12, 0.1]} /><meshStandardMaterial color={CARBON} /></mesh> },
    // Sound system (subwoofer from the boot)
    {
      assembled: [-1.3, 0.55, 0],
      explode: [-3.4, 0.4, 0],
      spin: [0, 0.7, 0],
      label: "Sound system",
      node: (
        <group>
          <mesh castShadow><boxGeometry args={[0.46, 0.42, 0.46]} /><meshStandardMaterial color={CARBON} roughness={0.6} /></mesh>
          <mesh position={[0.24, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.17, 0.17, 0.04, 28]} /><meshStandardMaterial color="#222" /></mesh>
          <mesh position={[0.26, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.07, 0.1, 0.05, 24]} /><meshStandardMaterial color="#555" metalness={0.6} /></mesh>
        </group>
      ),
    },
  ];
}

export function CarModel({ progressRef, reducedMotion }: { progressRef: RefObject<number>; reducedMotion: boolean }) {
  const parts = useParts();
  const root = useRef<Group>(null);
  const groups = useRef<(Group | null)[]>([]);
  const [exploded, setExploded] = useState(false);
  const explodedRef = useRef(false);
  const tmp = useRef(new Vector3());

  useFrame((state) => {
    const p = reducedMotion ? 0 : progressRef.current ?? 0;
    const e = smoothstep(0.6, 1, p);

    const wantLabels = e > 0.06;
    if (wantLabels !== explodedRef.current) {
      explodedRef.current = wantLabels;
      setExploded(wantLabels);
    }

    if (root.current) {
      const idle = 1 - e;
      // Shift right + down only in the side-profile phase so the left-aligned
      // headline stays clear; re-centre by the time we reach top-down/explode.
      const shift = 1 - smoothstep(0.12, 0.5, p);
      const float = Math.sin(state.clock.elapsedTime * 0.8) * 0.05 * idle * (reducedMotion ? 0 : 1);
      root.current.position.x = 0.95 * shift;
      root.current.position.y = -0.12 * shift + float;
      root.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.04 * idle * (reducedMotion ? 0 : 1);
    }

    for (let i = 0; i < parts.length; i++) {
      const g = groups.current[i];
      if (!g) continue;
      const c = parts[i];
      tmp.current.set(
        c.assembled[0] + c.explode[0] * e,
        c.assembled[1] + c.explode[1] * e,
        c.assembled[2] + c.explode[2] * e,
      );
      g.position.lerp(tmp.current, 0.12);
      if (c.spin) {
        g.rotation.x = c.spin[0] * e;
        g.rotation.y = c.spin[1] * e;
        g.rotation.z = c.spin[2] * e;
      }
    }
  });

  return (
    <group ref={root}>
      {parts.map((part, i) => (
        <group key={i} ref={(el) => { groups.current[i] = el; }} position={part.assembled}>
          {part.node}
          {exploded && part.label && (
            <Html center distanceFactor={10} position={[0, 0.35, 0]} zIndexRange={[20, 0]}>
              <div className="pointer-events-none animate-in fade-in whitespace-nowrap rounded-full border border-primary/40 bg-black/75 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                {part.label}
              </div>
            </Html>
          )}
        </group>
      ))}
    </group>
  );
}

// Camera: side profile (+Z) → top-down (+Y) → pulled-back 3/4 for the explode.
export function CameraRig({ progressRef, reducedMotion }: { progressRef: RefObject<number>; reducedMotion: boolean }) {
  const { camera } = useThree();
  const pos = useRef(new Vector3(0.4, 1.1, 8.4));
  const target = useRef(new Vector3());
  const look = useRef(new Vector3(0, 0.55, 0));

  useFrame(() => {
    const p = reducedMotion ? 0 : progressRef.current ?? 0;
    if (p < 0.45) {
      const t = smoothstep(0, 0.45, p);
      target.current.set(
        MathUtils.lerp(0.4, 0.3, t),
        MathUtils.lerp(1.1, 8.6, t),
        MathUtils.lerp(8.4, 0.4, t),
      );
    } else {
      const t = smoothstep(0.5, 1, p);
      target.current.set(
        MathUtils.lerp(0.3, 6.4, t),
        MathUtils.lerp(8.6, 4.4, t),
        MathUtils.lerp(0.4, 7.2, t),
      );
    }
    pos.current.lerp(target.current, 0.08);
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
  });

  return null;
}
