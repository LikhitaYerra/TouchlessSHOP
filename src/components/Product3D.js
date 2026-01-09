import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';

const Product3D = ({ product, position, rotation, scale = 1 }) => {
  const meshRef = useRef();
  const groupRef = useRef();

  // Animate rotation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      {/* 3D Card */}
      <Box ref={meshRef} args={[2, 2.5, 0.2]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.3}
          roughness={0.4}
          emissive="#667eea"
          emissiveIntensity={0.1}
        />
      </Box>
      
      {/* Product Icon Sphere */}
      <Sphere args={[0.5, 32, 32]} position={[0, 0.5, 0.15]}>
        <meshStandardMaterial
          color="#667eea"
          metalness={0.8}
          roughness={0.2}
          emissive="#8b5cf6"
          emissiveIntensity={0.3}
        />
      </Sphere>

      {/* Product Name Text */}
      <Text
        position={[0, -0.3, 0.15]}
        fontSize={0.2}
        color="#1e293b"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.8}
      >
        {product.name}
      </Text>

      {/* Price Text */}
      <Text
        position={[0, -0.7, 0.15]}
        fontSize={0.25}
        color="#6366f1"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {product.price}
      </Text>

      {/* Glow effect */}
      <pointLight position={[0, 0, 1]} intensity={0.5} color="#667eea" />
    </group>
  );
};

export default Product3D;

