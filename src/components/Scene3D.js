import React, { Suspense, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import Product3D from './Product3D';

const Scene3D = ({ product, isVisible }) => {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  if (!product || !isVisible) {
    return (
      <div className="scene-3d-container">
        <div className="scene-3d-placeholder">
          <p>Select a product to view in 3D</p>
        </div>
      </div>
    );
  }

  return (
    <div className="scene-3d-container">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        }}
        dpr={[1, 2]}
        style={{ 
          width: '100%', 
          height: '100%',
          display: 'block'
        }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor('#000000', 0);
          setIsLoading(false);
          console.log('3D Canvas created successfully', { gl, scene });
        }}
        onError={(error) => {
          console.error('Canvas error:', error);
          setError('Failed to initialize 3D view');
        }}
      >
        <Suspense fallback={
          <Html center>
            <div className="scene-3d-loading">
              <div className="spinner-3d"></div>
              <p>Loading 3D View...</p>
            </div>
          </Html>
        }>
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />
          <directionalLight position={[-5, -5, -5]} intensity={0.6} />
          <pointLight position={[0, 5, 0]} intensity={0.8} color="#667eea" />
          <pointLight position={[0, -5, 0]} intensity={0.4} color="#f093fb" />
          
          {/* Environment for better lighting */}
          <Environment preset="sunset" />
          
          {/* 3D Product */}
          <Product3D
            product={product}
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={1}
          />
          
          {/* Camera Controls */}
          <OrbitControls
            enableZoom={true}
            enablePan={false}
            enableRotate={true}
            minDistance={2}
            maxDistance={10}
            autoRotate={true}
            autoRotateSpeed={1}
            dampingFactor={0.05}
            enableDamping={true}
          />
        </Suspense>
      </Canvas>
      {isLoading && (
        <div className="scene-3d-loading-overlay">
          <div className="spinner-3d"></div>
          <p>Initializing 3D View...</p>
        </div>
      )}
      {error && (
        <div className="scene-3d-error">
          <p>⚠️ {error}</p>
          <button onClick={() => { setError(null); setIsLoading(true); }}>Retry</button>
        </div>
      )}
    </div>
  );
};

export default Scene3D;
