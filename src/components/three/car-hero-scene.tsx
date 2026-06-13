"use client";

import { Suspense, type RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer, ContactShadows } from "@react-three/drei";
import { CarModel, CameraRig } from "@/components/three/car-model";

// Self-contained: the environment map is built from Lightformers (no network
// HDR), so metal/paint reflect the brand colours and nothing downloads.
export default function CarHeroScene({
  progressRef,
  reducedMotion = false,
}: {
  progressRef: RefObject<number>;
  reducedMotion?: boolean;
}) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [7, 1.2, 0.6], fov: 38 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <spotLight position={[6, 8, 4]} angle={0.4} penumbra={1} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} />
        <pointLight position={[-6, 2, -4]} intensity={1.6} color="#2fd9ff" />
        <pointLight position={[5, 1, 4]} intensity={1.7} color="#ff6b1a" />

        <CarModel progressRef={progressRef} reducedMotion={reducedMotion} />
        <CameraRig progressRef={progressRef} reducedMotion={reducedMotion} />

        <ContactShadows position={[0, -0.02, 0]} opacity={0.5} scale={16} blur={2.6} far={5} color="#000000" />

        <Environment resolution={256}>
          <Lightformer intensity={2} position={[0, 4, 2]} scale={[8, 4, 1]} color="#ffffff" />
          <Lightformer intensity={3} position={[-5, 1, 2]} scale={[3, 4, 1]} color="#ff6b1a" />
          <Lightformer intensity={3} position={[5, 1, -2]} scale={[3, 4, 1]} color="#2fd9ff" />
          <Lightformer intensity={1.5} position={[0, -3, 0]} scale={[8, 2, 1]} color="#3a3f4a" />
        </Environment>
      </Suspense>
    </Canvas>
  );
}
