import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Sphere, Cylinder, Cone } from '@react-three/drei';
import * as THREE from 'three';

interface SceneObject {
  id: string;
  type: 'cube' | 'sphere' | 'cylinder' | 'cone' | 'light' | 'camera';
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  selected: boolean;
}

interface Viewport3DProps {
  objects: SceneObject[];
  onObjectSelect: (id: string) => void;
  selectedTool: string;
  renderMode: string;
}

const SceneObject = ({ obj, onSelect }: { obj: SceneObject; onSelect: () => void }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const handleClick = (e: any) => {
    e.stopPropagation();
    onSelect();
  };

  const material = (
    <meshStandardMaterial 
      color={obj.selected ? '#8b5cf6' : obj.color} 
      metalness={0.5} 
      roughness={0.3}
      emissive={obj.selected ? '#8b5cf6' : '#000000'}
      emissiveIntensity={obj.selected ? 0.2 : 0}
    />
  );

  if (obj.type === 'cube') {
    return (
      <Box 
        ref={meshRef}
        position={obj.position} 
        rotation={obj.rotation} 
        scale={obj.scale}
        onClick={handleClick}
      >
        {material}
      </Box>
    );
  }

  if (obj.type === 'sphere') {
    return (
      <Sphere 
        ref={meshRef}
        position={obj.position} 
        rotation={obj.rotation} 
        scale={obj.scale}
        onClick={handleClick}
      >
        {material}
      </Sphere>
    );
  }

  if (obj.type === 'cylinder') {
    return (
      <Cylinder 
        ref={meshRef}
        position={obj.position} 
        rotation={obj.rotation} 
        scale={obj.scale}
        onClick={handleClick}
      >
        {material}
      </Cylinder>
    );
  }

  if (obj.type === 'cone') {
    return (
      <Cone 
        ref={meshRef}
        position={obj.position} 
        rotation={obj.rotation} 
        scale={obj.scale}
        onClick={handleClick}
      >
        {material}
      </Cone>
    );
  }

  return null;
};

const AnimatedLight = () => {
  const lightRef = useRef<THREE.DirectionalLight>(null);
  
  useFrame(({ clock }) => {
    if (lightRef.current) {
      const time = clock.getElapsedTime();
      lightRef.current.position.x = Math.sin(time * 0.5) * 5;
      lightRef.current.position.z = Math.cos(time * 0.5) * 5;
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight 
        ref={lightRef}
        position={[5, 5, 5]} 
        intensity={1} 
        castShadow
      />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#0ea5e9" />
    </>
  );
};

const Scene = ({ objects, onObjectSelect, renderMode }: Omit<Viewport3DProps, 'selectedTool'>) => {
  const { scene } = useThree();
  
  useEffect(() => {
    scene.background = new THREE.Color(0x0a0a0a);
  }, [scene]);

  return (
    <>
      <AnimatedLight />
      <Grid 
        args={[20, 20]} 
        cellSize={1} 
        cellThickness={0.5} 
        cellColor="#2d2d2d" 
        sectionSize={5} 
        sectionThickness={1} 
        sectionColor="#3d3d3d"
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid
      />
      
      {objects.map((obj) => (
        <SceneObject 
          key={obj.id} 
          obj={obj} 
          onSelect={() => onObjectSelect(obj.id)} 
        />
      ))}

      <OrbitControls 
        makeDefault 
        maxPolarAngle={Math.PI / 2}
        enableDamping
        dampingFactor={0.05}
      />
    </>
  );
};

const Viewport3D = ({ objects, onObjectSelect, selectedTool, renderMode }: Viewport3DProps) => {
  return (
    <div className="w-full h-full">
      <Canvas 
        camera={{ position: [8, 6, 8], fov: 50 }}
        shadows
        gl={{ antialias: true, alpha: false }}
      >
        <Scene 
          objects={objects} 
          onObjectSelect={onObjectSelect}
          renderMode={renderMode}
        />
      </Canvas>
    </div>
  );
};

export default Viewport3D;
