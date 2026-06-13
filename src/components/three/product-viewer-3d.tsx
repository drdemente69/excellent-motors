"use client";

import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  Lightformer,
  ContactShadows,
  Stage,
  useGLTF,
} from "@react-three/drei";
import { Suspense } from "react";
import { BrakeDisc } from "@/components/three/brake-disc";

function GLBModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

// Interactive 360° product viewer with orbit controls. Uses a real .glb when the
// product has one, otherwise falls back to the procedural brake-rotor model.
export default function ProductViewer3D({ modelUrl }: { modelUrl?: string | null }) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.8]}
      camera={{ position: [0, 1, 6], fov: 40 }}
      gl={{ antialias: true, alpha: true }}
    >
      <Suspense fallback={null}>
        <ambientLight intensity={0.4} />
        <spotLight position={[5, 6, 4]} angle={0.4} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-5, -2, -3]} intensity={1.2} color="#2fd9ff" />
        <pointLight position={[4, -1, 3]} intensity={1.3} color="#ff6b1a" />

        {modelUrl ? (
          <Stage environment={null} intensity={0.5} adjustCamera={1.2}>
            <GLBModel url={modelUrl} />
          </Stage>
        ) : (
          <group position={[0, 0.2, 0]}>
            <BrakeDisc autoRotate={false} pointerReactive={false} />
          </group>
        )}

        <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={12} blur={2.5} far={4} />
        <Environment resolution={256}>
          <Lightformer intensity={2} position={[0, 3, 2]} scale={[6, 3, 1]} color="#ffffff" />
          <Lightformer intensity={3} position={[-4, 1, 2]} scale={[3, 3, 1]} color="#ff6b1a" />
          <Lightformer intensity={3} position={[4, -1, 1]} scale={[3, 3, 1]} color="#2fd9ff" />
        </Environment>

        <OrbitControls
          enablePan={false}
          minDistance={4}
          maxDistance={9}
          autoRotate
          autoRotateSpeed={1.2}
        />
      </Suspense>
    </Canvas>
  );
}
