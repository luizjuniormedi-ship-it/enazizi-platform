import { Suspense, useRef, useMemo, lazy, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useLipSync } from "@/hooks/useLipSync";

const MODEL_URL = "/models/tutor-avatar.glb";

// Viseme blend shape names from RPM
const VISEME_KEYS = [
  "viseme_sil", "viseme_PP", "viseme_FF", "viseme_TH", "viseme_DD",
  "viseme_kk", "viseme_CH", "viseme_SS", "viseme_nn", "viseme_RR",
  "viseme_aa", "viseme_E", "viseme_I", "viseme_O", "viseme_U",
];

interface AvatarModelProps {
  isSpeaking: boolean;
  lipSync: ReturnType<typeof useLipSync>;
}

function AvatarModel({ isSpeaking, lipSync }: AvatarModelProps) {
  const { scene } = useGLTF(MODEL_URL);
  const meshRef = useRef<THREE.SkinnedMesh | null>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Find the skinned mesh with morph targets
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary) {
        meshRef.current = child;
      }
    });
  }, [scene]);

  // Idle breathing animation + lip sync
  useFrame((state) => {
    if (groupRef.current) {
      // Subtle breathing
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.01;
      // Gentle head sway
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
    }

    const mesh = meshRef.current;
    if (!mesh || !mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;

    const dict = mesh.morphTargetDictionary;
    const influences = mesh.morphTargetInfluences;
    const activeIdx = lipSync.activeViseme.current;

    // Lerp all visemes toward target
    for (let i = 0; i < VISEME_KEYS.length; i++) {
      const key = VISEME_KEYS[i];
      const morphIdx = dict[key];
      if (morphIdx === undefined) continue;
      const target = i === activeIdx && isSpeaking ? 0.8 : 0;
      influences[morphIdx] = THREE.MathUtils.lerp(influences[morphIdx], target, 0.3);
    }

    // Blink every ~4 seconds
    const blinkKey = dict["eyeBlinkLeft"] ?? dict["eyeBlink_L"];
    const blinkKeyR = dict["eyeBlinkRight"] ?? dict["eyeBlink_R"];
    const blinkPhase = state.clock.elapsedTime % 4;
    const blinkVal = blinkPhase < 0.15 ? 1 : 0;
    if (blinkKey !== undefined) influences[blinkKey] = blinkVal;
    if (blinkKeyR !== undefined) influences[blinkKeyR] = blinkVal;
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={1.8} position={[0, -1.6, 0]} />
    </group>
  );
}

interface TutorAvatar3DProps {
  isSpeaking: boolean;
  lipSync: ReturnType<typeof useLipSync>;
  className?: string;
}

function WebGLFallback() {
  return (
    <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
      <span>Avatar 3D não suportado neste dispositivo</span>
    </div>
  );
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function hasModel(): boolean {
  // We'll check this asynchronously
  return true;
}

export default function TutorAvatar3D({ isSpeaking, lipSync, className }: TutorAvatar3DProps) {
  const [webglSupported] = useState(() => hasWebGL());
  const [modelExists, setModelExists] = useState(true);

  useEffect(() => {
    // Check if model file exists
    fetch(MODEL_URL, { method: "HEAD" })
      .then((r) => setModelExists(r.ok))
      .catch(() => setModelExists(false));
  }, []);

  if (!webglSupported || !modelExists) {
    return null; // Don't show anything if no WebGL or no model
  }

  return (
    <div className={`rounded-2xl overflow-hidden bg-gradient-to-b from-primary/5 to-transparent ${className || ""}`}>
      <Canvas
        camera={{ position: [0, 0, 2.5], fov: 30 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[2, 3, 5]} intensity={1} />
        <directionalLight position={[-2, 1, 3]} intensity={0.4} />
        <Suspense fallback={null}>
          <AvatarModel isSpeaking={isSpeaking} lipSync={lipSync} />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Preload the model
useGLTF.preload(MODEL_URL);
