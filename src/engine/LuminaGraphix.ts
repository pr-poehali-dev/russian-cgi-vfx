import * as THREE from 'three';

export interface LuminaScene {
  id: string;
  name: string;
  objects: LuminaObject[];
  lights: LuminaLight[];
  cameras: LuminaCamera[];
  effects: LuminaEffect[];
  particles: ParticleSystem[];
}

export interface LuminaObject {
  id: string;
  name: string;
  type: 'mesh' | 'group' | 'empty';
  geometry?: LuminaGeometry;
  material?: LuminaMaterial;
  transform: Transform3D;
  animations: Animation[];
  children: LuminaObject[];
  visible: boolean;
}

export interface LuminaGeometry {
  type: 'box' | 'sphere' | 'cylinder' | 'cone' | 'plane' | 'torus' | 'custom';
  parameters: Record<string, any>;
  vertices?: Float32Array;
  normals?: Float32Array;
  uvs?: Float32Array;
}

export interface LuminaMaterial {
  type: 'standard' | 'physical' | 'toon' | 'shader';
  color: string;
  metalness: number;
  roughness: number;
  emissive: string;
  emissiveIntensity: number;
  transparent: boolean;
  opacity: number;
  shaderCode?: string;
}

export interface Transform3D {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface LuminaLight {
  id: string;
  name: string;
  type: 'directional' | 'point' | 'spot' | 'ambient' | 'hemisphere';
  color: string;
  intensity: number;
  position: [number, number, number];
  castShadow: boolean;
}

export interface LuminaCamera {
  id: string;
  name: string;
  type: 'perspective' | 'orthographic';
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  near: number;
  far: number;
  active: boolean;
}

export interface LuminaEffect {
  id: string;
  name: string;
  type: 'bloom' | 'blur' | 'colorCorrection' | 'dof' | 'motion' | 'chromatic' | 'vignette';
  enabled: boolean;
  parameters: Record<string, any>;
}

export interface ParticleSystem {
  id: string;
  name: string;
  count: number;
  emissionRate: number;
  lifetime: number;
  position: [number, number, number];
  velocity: [number, number, number];
  gravity: [number, number, number];
  color: string;
  size: number;
  enabled: boolean;
}

export interface Animation {
  id: string;
  name: string;
  property: string;
  keyframes: Keyframe[];
  duration: number;
  loop: boolean;
  playing: boolean;
}

export interface Keyframe {
  time: number;
  value: any;
  interpolation: 'linear' | 'bezier' | 'step';
}

export class LuminaGraphixEngine {
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private activeCamera: THREE.Camera;
  private luminaScene: LuminaScene;
  private objectMap: Map<string, THREE.Object3D>;
  private animationMixers: Map<string, THREE.AnimationMixer>;
  private particleSystems: Map<string, THREE.Points>;
  private clock: THREE.Clock;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();
    this.renderer = new THREE.WebGLRenderer({ 
      canvas, 
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance'
    });
    
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    
    this.activeCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    this.activeCamera.position.set(8, 6, 8);
    this.activeCamera.lookAt(0, 0, 0);
    
    this.objectMap = new Map();
    this.animationMixers = new Map();
    this.particleSystems = new Map();
    this.clock = new THREE.Clock();
    
    this.luminaScene = {
      id: 'main',
      name: 'Main Scene',
      objects: [],
      lights: [],
      cameras: [],
      effects: [],
      particles: []
    };
  }

  public addObject(luminaObj: LuminaObject): THREE.Object3D {
    const obj = this.createThreeObject(luminaObj);
    this.scene.add(obj);
    this.objectMap.set(luminaObj.id, obj);
    this.luminaScene.objects.push(luminaObj);
    return obj;
  }

  public updateObject(id: string, updates: Partial<LuminaObject>): void {
    const obj = this.objectMap.get(id);
    if (!obj) return;

    if (updates.transform) {
      obj.position.set(...updates.transform.position);
      obj.rotation.set(...updates.transform.rotation);
      obj.scale.set(...updates.transform.scale);
    }

    if (updates.visible !== undefined) {
      obj.visible = updates.visible;
    }

    const luminaObj = this.luminaScene.objects.find(o => o.id === id);
    if (luminaObj) {
      Object.assign(luminaObj, updates);
    }
  }

  public removeObject(id: string): void {
    const obj = this.objectMap.get(id);
    if (obj) {
      this.scene.remove(obj);
      this.objectMap.delete(id);
    }
    this.luminaScene.objects = this.luminaScene.objects.filter(o => o.id !== id);
  }

  public addLight(light: LuminaLight): THREE.Light {
    const threeLight = this.createThreeLight(light);
    this.scene.add(threeLight);
    this.luminaScene.lights.push(light);
    return threeLight;
  }

  public addParticleSystem(particles: ParticleSystem): THREE.Points {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particles.count * 3);
    const velocities = new Float32Array(particles.count * 3);
    
    for (let i = 0; i < particles.count; i++) {
      positions[i * 3] = particles.position[0] + (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = particles.position[1] + (Math.random() - 0.5) * 2;
      positions[i * 3 + 2] = particles.position[2] + (Math.random() - 0.5) * 2;
      
      velocities[i * 3] = particles.velocity[0] + (Math.random() - 0.5);
      velocities[i * 3 + 1] = particles.velocity[1] + (Math.random() - 0.5);
      velocities[i * 3 + 2] = particles.velocity[2] + (Math.random() - 0.5);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    
    const material = new THREE.PointsMaterial({
      color: particles.color,
      size: particles.size,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const points = new THREE.Points(geometry, material);
    this.scene.add(points);
    this.particleSystems.set(particles.id, points);
    this.luminaScene.particles.push(particles);
    
    return points;
  }

  public createAnimation(objectId: string, animation: Animation): void {
    const obj = this.objectMap.get(objectId);
    if (!obj) return;

    const mixer = new THREE.AnimationMixer(obj);
    const times: number[] = [];
    const values: number[] = [];

    animation.keyframes.forEach(kf => {
      times.push(kf.time);
      if (Array.isArray(kf.value)) {
        values.push(...kf.value);
      } else {
        values.push(kf.value);
      }
    });

    const track = new THREE.VectorKeyframeTrack(
      `.${animation.property}`,
      times,
      values
    );

    const clip = new THREE.AnimationClip(animation.name, animation.duration, [track]);
    const action = mixer.clipAction(clip);
    
    action.loop = animation.loop ? THREE.LoopRepeat : THREE.LoopOnce;
    
    if (animation.playing) {
      action.play();
    }

    this.animationMixers.set(animation.id, mixer);
  }

  public render(): void {
    const delta = this.clock.getDelta();
    
    this.animationMixers.forEach(mixer => mixer.update(delta));
    
    this.particleSystems.forEach((points, id) => {
      const particles = this.luminaScene.particles.find(p => p.id === id);
      if (!particles || !particles.enabled) return;

      const positions = points.geometry.attributes.position.array as Float32Array;
      const velocities = points.geometry.attributes.velocity.array as Float32Array;
      
      for (let i = 0; i < positions.length; i += 3) {
        velocities[i + 1] += particles.gravity[1] * delta;
        
        positions[i] += velocities[i] * delta;
        positions[i + 1] += velocities[i + 1] * delta;
        positions[i + 2] += velocities[i + 2] * delta;
        
        if (positions[i + 1] < 0) {
          positions[i] = particles.position[0] + (Math.random() - 0.5) * 2;
          positions[i + 1] = particles.position[1];
          positions[i + 2] = particles.position[2] + (Math.random() - 0.5) * 2;
          
          velocities[i] = particles.velocity[0] + (Math.random() - 0.5);
          velocities[i + 1] = particles.velocity[1] + (Math.random() - 0.5);
          velocities[i + 2] = particles.velocity[2] + (Math.random() - 0.5);
        }
      }
      
      points.geometry.attributes.position.needsUpdate = true;
    });
    
    this.renderer.render(this.scene, this.activeCamera);
  }

  public setSize(width: number, height: number): void {
    this.renderer.setSize(width, height);
    if (this.activeCamera instanceof THREE.PerspectiveCamera) {
      this.activeCamera.aspect = width / height;
      this.activeCamera.updateProjectionMatrix();
    }
  }

  public getScene(): LuminaScene {
    return this.luminaScene;
  }

  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  public getCamera(): THREE.Camera {
    return this.activeCamera;
  }

  private createThreeObject(luminaObj: LuminaObject): THREE.Object3D {
    if (!luminaObj.geometry || !luminaObj.material) {
      return new THREE.Group();
    }

    const geometry = this.createGeometry(luminaObj.geometry);
    const material = this.createMaterial(luminaObj.material);
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.set(...luminaObj.transform.position);
    mesh.rotation.set(...luminaObj.transform.rotation);
    mesh.scale.set(...luminaObj.transform.scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.visible = luminaObj.visible;
    
    return mesh;
  }

  private createGeometry(geo: LuminaGeometry): THREE.BufferGeometry {
    switch (geo.type) {
      case 'box':
        return new THREE.BoxGeometry(
          geo.parameters.width || 1,
          geo.parameters.height || 1,
          geo.parameters.depth || 1
        );
      case 'sphere':
        return new THREE.SphereGeometry(
          geo.parameters.radius || 1,
          geo.parameters.widthSegments || 32,
          geo.parameters.heightSegments || 32
        );
      case 'cylinder':
        return new THREE.CylinderGeometry(
          geo.parameters.radiusTop || 1,
          geo.parameters.radiusBottom || 1,
          geo.parameters.height || 2,
          geo.parameters.radialSegments || 32
        );
      case 'cone':
        return new THREE.ConeGeometry(
          geo.parameters.radius || 1,
          geo.parameters.height || 2,
          geo.parameters.radialSegments || 32
        );
      case 'plane':
        return new THREE.PlaneGeometry(
          geo.parameters.width || 1,
          geo.parameters.height || 1
        );
      case 'torus':
        return new THREE.TorusGeometry(
          geo.parameters.radius || 1,
          geo.parameters.tube || 0.4,
          geo.parameters.radialSegments || 16,
          geo.parameters.tubularSegments || 100
        );
      default:
        return new THREE.BoxGeometry(1, 1, 1);
    }
  }

  private createMaterial(mat: LuminaMaterial): THREE.Material {
    if (mat.type === 'shader' && mat.shaderCode) {
      return new THREE.ShaderMaterial({
        vertexShader: mat.shaderCode,
        fragmentShader: mat.shaderCode
      });
    }

    return new THREE.MeshStandardMaterial({
      color: mat.color,
      metalness: mat.metalness,
      roughness: mat.roughness,
      emissive: mat.emissive,
      emissiveIntensity: mat.emissiveIntensity,
      transparent: mat.transparent,
      opacity: mat.opacity
    });
  }

  private createThreeLight(light: LuminaLight): THREE.Light {
    switch (light.type) {
      case 'directional': {
        const dirLight = new THREE.DirectionalLight(light.color, light.intensity);
        dirLight.position.set(...light.position);
        dirLight.castShadow = light.castShadow;
        return dirLight;
      }
      case 'point': {
        const pointLight = new THREE.PointLight(light.color, light.intensity);
        pointLight.position.set(...light.position);
        pointLight.castShadow = light.castShadow;
        return pointLight;
      }
      case 'spot': {
        const spotLight = new THREE.SpotLight(light.color, light.intensity);
        spotLight.position.set(...light.position);
        spotLight.castShadow = light.castShadow;
        return spotLight;
      }
      case 'ambient':
        return new THREE.AmbientLight(light.color, light.intensity);
      case 'hemisphere':
        return new THREE.HemisphereLight(light.color, '#ffffff', light.intensity);
      default:
        return new THREE.AmbientLight('#ffffff', 0.5);
    }
  }

  public dispose(): void {
    this.renderer.dispose();
    this.objectMap.clear();
    this.animationMixers.clear();
    this.particleSystems.clear();
  }
}

export default LuminaGraphixEngine;
