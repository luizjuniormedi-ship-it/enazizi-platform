import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { useLipSync } from "@/hooks/useLipSync";

interface ProceduralAvatarProps {
  isSpeaking: boolean;
  lipSync: ReturnType<typeof useLipSync>;
}

/** Simple procedural 3D avatar — no external model needed */
function ProceduralAvatar({ isSpeaking, lipSync }: ProceduralAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const mouthRef = useRef<THREE.Mesh>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);

  // Colors
  const skinColor = useMemo(() => new THREE.Color("#f5c6a0"), []);
  const hairColor = useMemo(() => new THREE.Color("#3a2a1a"), []);
  const eyeColor = useMemo(() => new THREE.Color("#2c3e50"), []);
  const mouthColor = useMemo(() => new THREE.Color("#c0392b"), []);
  const coatColor = useMemo(() => new THREE.Color("#2980b9"), []);
  const stethColor = useMemo(() => new THREE.Color("#7f8c8d"), []);

  useFrame((state) => {
    if (!groupRef.current) return;

    // Idle breathing
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 1.5) * 0.02;
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.05;

    // Mouth animation
    if (mouthRef.current) {
      const activeViseme = lipSync.activeViseme.current;
      const openAmount = isSpeaking && activeViseme > 0 ? 0.08 + (activeViseme >= 10 ? 0.06 : 0.02) : 0.01;
      const targetScaleY = THREE.MathUtils.mapLinear(openAmount, 0, 0.14, 0.3, 1.2);
      mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, targetScaleY, 0.3);
    }

    // Blink
    const blinkPhase = state.clock.elapsedTime % 3.5;
    const blinkScale = blinkPhase < 0.12 ? 0.1 : 1;
    if (leftEyeRef.current) leftEyeRef.current.scale.y = THREE.MathUtils.lerp(leftEyeRef.current.scale.y, blinkScale, 0.4);
    if (rightEyeRef.current) rightEyeRef.current.scale.y = THREE.MathUtils.lerp(rightEyeRef.current.scale.y, blinkScale, 0.4);
  });

  return (
    <group ref={groupRef}>
      {/* Head */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.45, 32, 32]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>

      {/* Hair */}
      <mesh position={[0, 0.8, -0.05]}>
        <sphereGeometry args={[0.46, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
        <meshStandardMaterial color={hairColor} roughness={0.8} />
      </mesh>

      {/* Left Eye */}
      <mesh ref={leftEyeRef} position={[-0.15, 0.58, 0.38]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color={eyeColor} />
      </mesh>

      {/* Right Eye */}
      <mesh ref={rightEyeRef} position={[0.15, 0.58, 0.38]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial color={eyeColor} />
      </mesh>

      {/* Eye whites */}
      <mesh position={[-0.15, 0.58, 0.36]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0.15, 0.58, 0.36]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>

      {/* Mouth */}
      <mesh ref={mouthRef} position={[0, 0.32, 0.4]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color={mouthColor} />
      </mesh>

      {/* Nose */}
      <mesh position={[0, 0.46, 0.42]} rotation={[0.3, 0, 0]}>
        <sphereGeometry args={[0.04, 12, 12]} />
        <meshStandardMaterial color={skinColor} roughness={0.5} />
      </mesh>

      {/* Neck */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.2, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.6} />
      </mesh>

      {/* Body / Lab coat */}
      <mesh position={[0, -0.5, 0]}>
        <cylinderGeometry args={[0.25, 0.35, 0.8, 16]} />
        <meshStandardMaterial color={coatColor} roughness={0.4} />
      </mesh>

      {/* Coat collar */}
      <mesh position={[0, -0.15, 0.12]}>
        <boxGeometry args={[0.35, 0.08, 0.12]} />
        <meshStandardMaterial color="white" roughness={0.3} />
      </mesh>

      {/* Stethoscope (simple torus) */}
      <mesh position={[0, -0.2, 0.2]} rotation={[0.3, 0, 0]}>
        <torusGeometry args={[0.1, 0.015, 8, 24]} />
        <meshStandardMaterial color={stethColor} metalness={0.5} roughness={0.3} />
      </mesh>

      {/* Speaking indicator glow */}
      {isSpeaking && (
        <pointLight position={[0, 0.5, 1]} intensity={0.5} color="#3498db" distance={3} />
      )}
    </group>
  );
}

interface TutorAvatar3DProps {
  isSpeaking: boolean;
  lipSync: ReturnType<typeof useLipSync>;
  className?: string;
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function TutorAvatar3D({ isSpeaking, lipSync, className }: TutorAvatar3DProps) {
  if (!hasWebGL()) return null;

  return (
    <div className={`rounded-2xl overflow-hidden bg-gradient-to-b from-primary/5 to-transparent border border-border/30 ${className || ""}`}>
      <Canvas
        camera={{ position: [0, 0.3, 2.2], fov: 35 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 5]} intensity={0.8} />
        <directionalLight position={[-2, 1, 3]} intensity={0.3} />
        <hemisphereLight intensity={0.3} color="#87CEEB" groundColor="#8B4513" />
        <ProceduralAvatar isSpeaking={isSpeaking} lipSync={lipSync} />
      </Canvas>
    </div>
  );
}
