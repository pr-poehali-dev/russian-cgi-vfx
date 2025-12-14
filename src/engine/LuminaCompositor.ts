import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';

export interface CompositorNode {
  id: string;
  type: 'input' | 'output' | 'blur' | 'bloom' | 'colorCorrection' | 'chromatic' | 'vignette' | 'sharpen' | 'noise';
  name: string;
  enabled: boolean;
  parameters: Record<string, any>;
  inputs: string[];
  outputs: string[];
}

export interface NodeConnection {
  from: string;
  fromOutput: string;
  to: string;
  toInput: string;
}

const ColorCorrectionShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'brightness': { value: 0 },
    'contrast': { value: 1 },
    'saturation': { value: 1 },
    'hue': { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float brightness;
    uniform float contrast;
    uniform float saturation;
    uniform float hue;
    varying vec2 vUv;

    vec3 rgb2hsv(vec3 c) {
      vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
      vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
      vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
      float d = q.x - min(q.w, q.y);
      float e = 1.0e-10;
      return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
    }

    vec3 hsv2rgb(vec3 c) {
      vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
      vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
      return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      
      color.rgb += brightness;
      color.rgb = (color.rgb - 0.5) * contrast + 0.5;
      
      vec3 hsv = rgb2hsv(color.rgb);
      hsv.x += hue;
      hsv.y *= saturation;
      color.rgb = hsv2rgb(hsv);
      
      gl_FragColor = color;
    }
  `
};

const ChromaticAberrationShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'amount': { value: 0.005 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    varying vec2 vUv;

    void main() {
      vec2 direction = vUv - vec2(0.5);
      
      float r = texture2D(tDiffuse, vUv + direction * amount).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - direction * amount).b;
      
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `
};

const VignetteShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'intensity': { value: 0.5 },
    'smoothness': { value: 0.5 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float intensity;
    uniform float smoothness;
    varying vec2 vUv;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      vec2 center = vUv - vec2(0.5);
      float dist = length(center);
      float vignette = smoothstep(1.0 - smoothness, 1.0, dist * intensity);
      color.rgb *= 1.0 - vignette;
      gl_FragColor = color;
    }
  `
};

const NoiseShader = {
  uniforms: {
    'tDiffuse': { value: null },
    'amount': { value: 0.1 },
    'time': { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float amount;
    uniform float time;
    varying vec2 vUv;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233)) + time) * 43758.5453123);
    }

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);
      float noise = random(vUv) * amount;
      color.rgb += noise;
      gl_FragColor = color;
    }
  `
};

export class LuminaCompositor {
  private composer: EffectComposer;
  private nodes: CompositorNode[] = [];
  private connections: NodeConnection[] = [];
  private passes: Map<string, any> = new Map();

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    width: number,
    height: number
  ) {
    this.composer = new EffectComposer(renderer);
    this.composer.setSize(width, height);
    
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);
  }

  public addNode(node: CompositorNode): void {
    this.nodes.push(node);
    
    if (node.enabled) {
      this.createPass(node);
    }
  }

  public updateNode(id: string, updates: Partial<CompositorNode>): void {
    const node = this.nodes.find(n => n.id === id);
    if (!node) return;

    Object.assign(node, updates);
    
    if (updates.enabled !== undefined) {
      if (updates.enabled) {
        this.createPass(node);
      } else {
        this.removePass(id);
      }
    } else if (updates.parameters) {
      this.updatePassParameters(id, updates.parameters);
    }
  }

  public removeNode(id: string): void {
    this.nodes = this.nodes.filter(n => n.id !== id);
    this.removePass(id);
  }

  public connect(connection: NodeConnection): void {
    this.connections.push(connection);
    this.rebuildPipeline();
  }

  public disconnect(fromId: string, toId: string): void {
    this.connections = this.connections.filter(
      c => !(c.from === fromId && c.to === toId)
    );
    this.rebuildPipeline();
  }

  public render(deltaTime?: number): void {
    if (deltaTime) {
      this.passes.forEach((pass) => {
        if (pass.uniforms?.time) {
          pass.uniforms.time.value += deltaTime;
        }
      });
    }
    
    this.composer.render();
  }

  public setSize(width: number, height: number): void {
    this.composer.setSize(width, height);
  }

  public getNodes(): CompositorNode[] {
    return this.nodes;
  }

  public getConnections(): NodeConnection[] {
    return this.connections;
  }

  private createPass(node: CompositorNode): void {
    let pass: any;

    switch (node.type) {
      case 'bloom': {
        const params = node.parameters;
        pass = new UnrealBloomPass(
          new THREE.Vector2(window.innerWidth, window.innerHeight),
          params.strength || 1.5,
          params.radius || 0.4,
          params.threshold || 0.85
        );
        break;
      }

      case 'colorCorrection': {
        const shader = { ...ColorCorrectionShader };
        shader.uniforms = {
          'tDiffuse': { value: null },
          'brightness': { value: node.parameters.brightness || 0 },
          'contrast': { value: node.parameters.contrast || 1 },
          'saturation': { value: node.parameters.saturation || 1 },
          'hue': { value: node.parameters.hue || 0 }
        };
        pass = new ShaderPass(shader);
        break;
      }

      case 'chromatic': {
        const shader = { ...ChromaticAberrationShader };
        shader.uniforms = {
          'tDiffuse': { value: null },
          'amount': { value: node.parameters.amount || 0.005 }
        };
        pass = new ShaderPass(shader);
        break;
      }

      case 'vignette': {
        const shader = { ...VignetteShader };
        shader.uniforms = {
          'tDiffuse': { value: null },
          'intensity': { value: node.parameters.intensity || 0.5 },
          'smoothness': { value: node.parameters.smoothness || 0.5 }
        };
        pass = new ShaderPass(shader);
        break;
      }

      case 'noise': {
        const shader = { ...NoiseShader };
        shader.uniforms = {
          'tDiffuse': { value: null },
          'amount': { value: node.parameters.amount || 0.1 },
          'time': { value: 0 }
        };
        pass = new ShaderPass(shader);
        break;
      }

      default:
        return;
    }

    if (pass) {
      this.passes.set(node.id, pass);
      this.composer.addPass(pass);
    }
  }

  private removePass(id: string): void {
    const pass = this.passes.get(id);
    if (pass) {
      this.composer.removePass(pass);
      this.passes.delete(id);
    }
  }

  private updatePassParameters(id: string, parameters: Record<string, any>): void {
    const pass = this.passes.get(id);
    if (!pass || !pass.uniforms) return;

    Object.keys(parameters).forEach(key => {
      if (pass.uniforms[key]) {
        pass.uniforms[key].value = parameters[key];
      }
    });
  }

  private rebuildPipeline(): void {
    this.composer.passes.forEach((pass, index) => {
      if (index > 0) {
        this.composer.removePass(pass);
      }
    });

    const sortedNodes = this.topologicalSort();
    sortedNodes.forEach(node => {
      if (node.enabled && node.type !== 'input' && node.type !== 'output') {
        this.createPass(node);
      }
    });
  }

  private topologicalSort(): CompositorNode[] {
    const sorted: CompositorNode[] = [];
    const visited = new Set<string>();

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      const node = this.nodes.find(n => n.id === nodeId);
      if (!node) return;

      const incomingConnections = this.connections.filter(c => c.to === nodeId);
      incomingConnections.forEach(conn => visit(conn.from));

      sorted.push(node);
    };

    this.nodes.forEach(node => visit(node.id));
    return sorted;
  }

  public dispose(): void {
    this.passes.clear();
    this.nodes = [];
    this.connections = [];
  }
}

export default LuminaCompositor;
