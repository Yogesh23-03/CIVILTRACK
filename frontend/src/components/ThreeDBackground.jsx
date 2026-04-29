import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  Sphere, 
  Box, 
  Torus, 
  OrbitControls, 
  Stars,
  Sparkles,
  Float
} from '@react-three/drei';
import * as THREE from 'three';

// Simple Floating City Component
const SimpleCity = () => {
  const groupRef = useRef();
  const colors = ['#667eea', '#764ba2', '#f59e0b', '#10b981', '#3b82f6'];
  
  // This is the animation frame - CORRECT import
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
    }
  });

  // Generate buildings
  const buildings = [];
  for (let i = 0; i < 30; i++) {
    const x = (Math.random() - 0.5) * 15;
    const z = (Math.random() - 0.5) * 15;
    const height = Math.random() * 2 + 0.5;
    buildings.push(
      <Box 
        key={i}
        position={[x, height / 2 - 0.8, z]}
        args={[0.3, height, 0.3]}
      >
        <meshStandardMaterial 
          color={colors[Math.floor(Math.random() * colors.length)]}
          metalness={0.8}
          roughness={0.2}
          emissive={colors[Math.floor(Math.random() * colors.length)]}
          emissiveIntensity={0.2}
          transparent
          opacity={0.7}
        />
      </Box>
    );
  }

  return (
    <group ref={groupRef} position={[0, -2, 0]}>
      {/* Ground */}
      <Box position={[0, -1, 0]} args={[20, 0.1, 20]}>
        <meshStandardMaterial color="#1a1a2e" metalness={0.5} roughness={0.3} transparent opacity={0.3} />
      </Box>
      
      {buildings}
      
      {/* Center element */}
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <Torus position={[0, 1, 0]} args={[1, 0.05, 32, 100]} rotation={[Math.PI / 2, 0, 0]}>
          <meshStandardMaterial color="#667eea" metalness={0.9} emissive="#667eea" emissiveIntensity={0.3} />
        </Torus>
      </Float>
      
      <Float speed={1.5}>
        <Sphere position={[0, 1.8, 0]} args={[0.3, 32, 32]}>
          <meshStandardMaterial color="#764ba2" metalness={0.8} emissive="#764ba2" emissiveIntensity={0.3} />
        </Sphere>
      </Float>
    </group>
  );
};

// Floating Particles Component
const FloatingParticles = () => {
  const particlesRef = useRef();
  const count = 500;
  
  // Generate random positions
  const positions = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i*3] = (Math.random() - 0.5) * 30;
      pos[i*3+1] = (Math.random() - 0.5) * 15;
      pos[i*3+2] = (Math.random() - 0.5) * 20 - 10;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (particlesRef.current) {
      particlesRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#667eea" size={0.05} transparent opacity={0.4} />
    </points>
  );
};

// Main 3D Background Component
const ThreeDBackground = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 0,
      pointerEvents: 'none',
      opacity: 0.5
    }}>
      <Canvas
        camera={{ position: [0, 2, 12], fov: 50 }}
        style={{
          width: '100%',
          height: '100%',
          background: 'transparent'
        }}
      >
        {/* Lights */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <directionalLight position={[5, 10, 5]} intensity={0.5} />
        <pointLight position={[-5, 3, 5]} intensity={0.5} color="#764ba2" />
        
        {/* Stars Background */}
        <Stars radius={100} depth={50} count={1500} factor={4} saturation={0} fade speed={0.5} />
        
        {/* 3D Elements */}
        <SimpleCity />
        <FloatingParticles />
        <Sparkles count={150} scale={15} size={0.08} speed={0.3} color="#667eea" opacity={0.3} />
        
        {/* Auto-rotate camera slowly */}
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          autoRotate 
          autoRotateSpeed={0.3}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
};

export default ThreeDBackground;