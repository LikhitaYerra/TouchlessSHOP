import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Box, Sphere } from '@react-three/drei';
import * as THREE from 'three';

const CartItem3D = ({ item, index, totalItems }) => {
  const meshRef = useRef();
  const angle = (index / totalItems) * Math.PI * 2;
  const radius = 2;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime + angle) * 0.2;
    }
  });

  return (
    <group ref={meshRef} position={[x, 0, z]}>
      <Box args={[0.8, 0.8, 0.1]}>
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.5}
          roughness={0.3}
          emissive="#10b981"
          emissiveIntensity={0.2}
        />
      </Box>
      <Sphere args={[0.2, 16, 16]} position={[0, 0.3, 0.1]}>
        <meshStandardMaterial
          color="#6366f1"
          metalness={0.8}
          roughness={0.2}
        />
      </Sphere>
      <Text
        position={[0, -0.2, 0.1]}
        fontSize={0.1}
        color="#1e293b"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.7}
      >
        {item.name}
      </Text>
    </group>
  );
};

const Cart3DScene = ({ cart }) => {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[-5, -5, -5]} intensity={0.5} color="#10b981" />
      
      {cart.length === 0 ? (
        <Text
          position={[0, 0, 0]}
          fontSize={0.3}
          color="#64748b"
          anchorX="center"
          anchorY="middle"
        >
          Cart is Empty
        </Text>
      ) : (
        cart.map((item, index) => (
          <CartItem3D
            key={index}
            item={item}
            index={index}
            totalItems={cart.length}
          />
        ))
      )}
    </>
  );
};

const Cart3D = ({ cart }) => {
  return (
    <div style={{ width: '100%', height: '300px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '15px', overflow: 'hidden' }}>
      <Canvas
        camera={{ position: [0, 3, 5], fov: 50 }}
        gl={{ antialias: true }}
      >
        <Cart3DScene cart={cart} />
      </Canvas>
    </div>
  );
};

export default Cart3D;





