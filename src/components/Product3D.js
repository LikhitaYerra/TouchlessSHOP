import React, { useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, Text, Box } from '@react-three/drei';
import * as THREE from 'three';

// 3D Product Card with Image
const ProductCard3D = ({ product, position, scale }) => {
  const groupRef = useRef();
  const meshRef = useRef();
  const textureRef = useRef(null);
  
  // Load texture
  React.useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      product.image,
      (texture) => {
        textureRef.current = texture;
      },
      undefined,
      (error) => {
        console.warn('Failed to load texture:', error);
      }
    );
  }, [product.image]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Main product card */}
      <Box ref={meshRef} args={[2, 2.5, 0.1]} position={[0, 0, 0]}>
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.3}
          roughness={0.4}
        />
      </Box>
      
      {/* Product image plane */}
      {textureRef.current && (
        <mesh position={[0, 0, 0.06]}>
          <planeGeometry args={[1.8, 2.3]} />
          <meshStandardMaterial
            map={textureRef.current}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
      
      {/* Product name */}
      <Text
        position={[0, -1.4, 0.1]}
        fontSize={0.15}
        color="#1e293b"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.6}
      >
        {product.name}
      </Text>

      {/* Price */}
      <Text
        position={[0, -1.7, 0.1]}
        fontSize={0.2}
        color="#3b82f6"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {product.price}
      </Text>
      
      {/* Glow effect */}
      <pointLight position={[0, 0, 1]} intensity={0.5} color="#3b82f6" />
    </group>
  );
};

// Fallback 3D model loader
const Model = ({ url, position, scale }) => {
  const modelRef = useRef();
  
  // Hooks must be called unconditionally at the top level
  // useGLTF will handle errors internally via Suspense
  const gltf = useGLTF(url);
  
  // useFrame must be called unconditionally
  useFrame((state) => {
    if (modelRef.current && gltf?.scene) {
      modelRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }
  });
  
  // Handle missing scene
  if (!gltf?.scene) {
    return null;
  }
  
  return (
    <primitive
      ref={modelRef}
      object={gltf.scene.clone()}
      position={position}
      scale={scale || [1.5, 1.5, 1.5]}
    />
  );
};

const Product3D = ({ product, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  const groupRef = useRef();

  // Animate rotation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  // Always render ProductCard3D for now (more reliable than GLTF loading)
  // Check if product has a 3D model URL
  if (product?.model3D && false) { // Temporarily disable GLTF loading
    return (
      <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
        <Suspense fallback={
          <group>
            <Box args={[1, 1, 1]}>
              <meshStandardMaterial color="#3b82f6" wireframe />
            </Box>
            <Text
              position={[0, -1.5, 0]}
              fontSize={0.2}
              color="#3b82f6"
              anchorX="center"
              anchorY="middle"
            >
              Loading 3D Model...
            </Text>
          </group>
        }>
          <Model url={product.model3D} position={[0, 0, 0]} scale={[1.5, 1.5, 1.5]} />
        </Suspense>
      </group>
    );
  }

  // Always use product image on 3D card for better UX (fallback)
  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <Suspense fallback={
        <group>
          <Box args={[1, 1, 1]}>
            <meshStandardMaterial color="#3b82f6" wireframe />
          </Box>
          <Text
            position={[0, -1.5, 0]}
            fontSize={0.2}
            color="#3b82f6"
            anchorX="center"
            anchorY="middle"
          >
            Loading 3D View...
          </Text>
        </group>
      }>
        <ProductCard3D product={product} position={[0, 0, 0]} scale={[1, 1, 1]} />
      </Suspense>
      
      {/* Glow effect */}
      <pointLight position={[0, 0, 1]} intensity={0.5} color="#3b82f6" />
    </group>
  );
};

export default Product3D;
