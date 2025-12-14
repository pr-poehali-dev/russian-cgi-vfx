import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LuminaGraphixEngine, LuminaObject } from '@/engine/LuminaGraphix';
import { LuminaCompositor, CompositorNode } from '@/engine/LuminaCompositor';
import { LuminaAnimator, AnimationClip } from '@/engine/LuminaAnimator';

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<LuminaGraphixEngine | null>(null);
  const compositorRef = useRef<LuminaCompositor | null>(null);
  const animatorRef = useRef<LuminaAnimator | null>(null);
  const animationFrameRef = useRef<number>();

  const [selectedTool, setSelectedTool] = useState('select');
  const [playback, setPlayback] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [resolution, setResolution] = useState([1920]);
  const [samples, setSamples] = useState([128]);
  const [sceneObjects, setSceneObjects] = useState<LuminaObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new LuminaGraphixEngine(canvasRef.current);
    const compositor = new LuminaCompositor(
      engine.getRenderer(),
      engine.getRenderer().domElement.parentElement as any,
      engine.getCamera(),
      window.innerWidth,
      window.innerHeight
    );
    const animator = new LuminaAnimator();

    engineRef.current = engine;
    compositorRef.current = compositor;
    animatorRef.current = animator;

    const demoObject1: LuminaObject = {
      id: 'cube1',
      name: 'Cube 1',
      type: 'mesh',
      geometry: {
        type: 'box',
        parameters: { width: 1, height: 1, depth: 1 }
      },
      material: {
        type: 'standard',
        color: '#8b5cf6',
        metalness: 0.7,
        roughness: 0.3,
        emissive: '#000000',
        emissiveIntensity: 0,
        transparent: false,
        opacity: 1
      },
      transform: {
        position: [-2, 0.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      },
      animations: [],
      children: [],
      visible: true
    };

    const demoObject2: LuminaObject = {
      id: 'sphere1',
      name: 'Sphere 1',
      type: 'mesh',
      geometry: {
        type: 'sphere',
        parameters: { radius: 0.6, widthSegments: 32, heightSegments: 32 }
      },
      material: {
        type: 'standard',
        color: '#06b6d4',
        metalness: 0.9,
        roughness: 0.1,
        emissive: '#06b6d4',
        emissiveIntensity: 0.2,
        transparent: false,
        opacity: 1
      },
      transform: {
        position: [0, 0.6, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      },
      animations: [],
      children: [],
      visible: true
    };

    const demoObject3: LuminaObject = {
      id: 'cone1',
      name: 'Cone 1',
      type: 'mesh',
      geometry: {
        type: 'cone',
        parameters: { radius: 0.5, height: 1.5, radialSegments: 32 }
      },
      material: {
        type: 'standard',
        color: '#f59e0b',
        metalness: 0.5,
        roughness: 0.5,
        emissive: '#000000',
        emissiveIntensity: 0,
        transparent: false,
        opacity: 1
      },
      transform: {
        position: [2, 0.75, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      },
      animations: [],
      children: [],
      visible: true
    };

    engine.addObject(demoObject1);
    engine.addObject(demoObject2);
    engine.addObject(demoObject3);

    engine.addLight({
      id: 'mainLight',
      name: 'Main Light',
      type: 'directional',
      color: '#ffffff',
      intensity: 1.5,
      position: [5, 8, 5],
      castShadow: true
    });

    engine.addLight({
      id: 'fillLight',
      name: 'Fill Light',
      type: 'point',
      color: '#0ea5e9',
      intensity: 0.8,
      position: [-5, 3, -5],
      castShadow: false
    });

    engine.addParticleSystem({
      id: 'particles1',
      name: 'Magic Particles',
      count: 1000,
      emissionRate: 50,
      lifetime: 3,
      position: [0, 2, 0],
      velocity: [0, 2, 0],
      gravity: [0, -0.5, 0],
      color: '#8b5cf6',
      size: 0.05,
      enabled: true
    });

    const bloomNode: CompositorNode = {
      id: 'bloom1',
      type: 'bloom',
      name: 'Bloom Effect',
      enabled: true,
      parameters: {
        strength: 1.2,
        radius: 0.5,
        threshold: 0.8
      },
      inputs: ['scene'],
      outputs: ['bloomed']
    };

    compositor.addNode(bloomNode);

    setSceneObjects([demoObject1, demoObject2, demoObject3]);

    const handleResize = () => {
      if (!canvasRef.current) return;
      const width = canvasRef.current.parentElement?.clientWidth || window.innerWidth;
      const height = canvasRef.current.parentElement?.clientHeight || window.innerHeight;
      engine.setSize(width, height);
      compositor.setSize(width, height);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    let lastTime = performance.now();
    const animate = () => {
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (playback) {
        setCurrentFrame(prev => prev + 1);
      }

      animator.update(deltaTime);
      engine.render();
      compositor.render(deltaTime);

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      engine.dispose();
      compositor.dispose();
      animator.dispose();
    };
  }, [playback]);

  const tools = [
    { id: 'select', icon: 'MousePointer', label: 'Выбрать' },
    { id: 'move', icon: 'Move', label: 'Переместить' },
    { id: 'rotate', icon: 'RotateCw', label: 'Вращать' },
    { id: 'scale', icon: 'Maximize2', label: 'Масштаб' },
    { id: 'camera', icon: 'Camera', label: 'Камера' },
    { id: 'light', icon: 'Lightbulb', label: 'Свет' },
  ];

  const renderModes = [
    { id: 'solid', label: 'Solid' },
    { id: 'material', label: 'Material' },
    { id: 'rendered', label: 'Rendered' },
  ];

  const assets = [
    { id: 1, name: 'Scene_001.blend', type: 'scene', size: '24 MB' },
    { id: 2, name: 'Character_Rig.fbx', type: 'model', size: '8.5 MB' },
    { id: 3, name: 'Explosion_VFX.mp4', type: 'video', size: '156 MB' },
    { id: 4, name: 'Sky_HDRI.exr', type: 'texture', size: '45 MB' },
  ];

  const nodeTypes = [
    { id: 'input', name: 'Image Input', category: 'Input' },
    { id: 'blur', name: 'Blur', category: 'Filter' },
    { id: 'colorCorrect', name: 'Color Correct', category: 'Color' },
    { id: 'composite', name: 'Composite', category: 'Output' },
  ];

  const addObject = (type: 'cube' | 'sphere' | 'cylinder' | 'cone') => {
    if (!engineRef.current) return;

    const newObj: LuminaObject = {
      id: `${type}_${Date.now()}`,
      name: `${type} ${sceneObjects.length + 1}`,
      type: 'mesh',
      geometry: {
        type,
        parameters: type === 'sphere' ? { radius: 0.5 } : { width: 1, height: 1, depth: 1 }
      },
      material: {
        type: 'standard',
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        metalness: 0.5,
        roughness: 0.5,
        emissive: '#000000',
        emissiveIntensity: 0,
        transparent: false,
        opacity: 1
      },
      transform: {
        position: [Math.random() * 4 - 2, 1, Math.random() * 4 - 2],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      },
      animations: [],
      children: [],
      visible: true
    };

    engineRef.current.addObject(newObj);
    setSceneObjects(prev => [...prev, newObj]);
  };

  const handleRender = () => {
    alert('Рендер запущен! LuminaGraphix обрабатывает сцену...');
  };

  return (
    <div className="h-screen w-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex flex-col overflow-hidden font-['Roboto']">
      <header className="h-12 bg-[hsl(var(--toolbar-bg))] border-b border-[hsl(var(--border))] flex items-center px-4 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] rounded flex items-center justify-center font-bold">
            L
          </div>
          <span className="text-lg font-semibold">LuminaGraphix Studio</span>
        </div>
        
        <Separator orientation="vertical" className="h-6" />
        
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Icon name="File" size={16} className="mr-1" />
            Файл
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Icon name="Edit" size={16} className="mr-1" />
            Правка
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Icon name="Layers" size={16} className="mr-1" />
            Объекты
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Icon name="Sparkles" size={16} className="mr-1" />
            Рендер
          </Button>
          <Button variant="ghost" size="sm" className="h-8 px-2">
            <Icon name="Palette" size={16} className="mr-1" />
            Композитинг
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Select defaultValue="gpu">
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cpu">CPU Render</SelectItem>
              <SelectItem value="gpu">GPU Render</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90" onClick={handleRender}>
            <Icon name="Zap" size={16} className="mr-1" />
            Рендер
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-14 bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--border))] flex flex-col items-center py-4 gap-2">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={selectedTool === tool.id ? 'default' : 'ghost'}
              size="icon"
              className="w-10 h-10"
              onClick={() => setSelectedTool(tool.id)}
            >
              <Icon name={tool.icon} size={20} />
            </Button>
          ))}
        </aside>

        <div className="flex-1 flex flex-col">
          <div className="h-10 bg-[hsl(var(--toolbar-bg))] border-b border-[hsl(var(--border))] flex items-center px-4 gap-2">
            {renderModes.map((mode) => (
              <Button key={mode.id} variant="ghost" size="sm" className="h-7 px-3 text-xs">
                {mode.label}
              </Button>
            ))}
            <Separator orientation="vertical" className="h-5 mx-2" />
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => addObject('cube')}>
              <Icon name="Box" size={14} />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => addObject('sphere')}>
              <Icon name="Circle" size={14} />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => addObject('cylinder')}>
              <Icon name="Cylinder" size={14} />
            </Button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 bg-[hsl(var(--viewport-bg))] relative overflow-hidden">
              <canvas 
                ref={canvasRef}
                className="w-full h-full"
                style={{ display: 'block' }}
              />

              <div className="absolute top-4 right-4 bg-[hsl(var(--card))]/90 backdrop-blur-sm border border-[hsl(var(--border))] rounded p-2 text-xs space-y-1 font-mono">
                <div>FPS: 60</div>
                <div>Camera: Perspective</div>
                <div>Frame: {currentFrame}</div>
                <div>Objects: {sceneObjects.length}</div>
                <div className="text-[hsl(var(--primary))]">Engine: LuminaGraphix</div>
              </div>

              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[hsl(var(--card))]/90 backdrop-blur-sm border border-[hsl(var(--border))] rounded-lg px-3 py-2 flex items-center gap-3">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 w-7 p-0"
                  onClick={() => setPlayback(!playback)}
                >
                  <Icon name={playback ? 'Pause' : 'Play'} size={16} />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                  <Icon name="SkipBack" size={16} />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                  <Icon name="SkipForward" size={16} />
                </Button>
                <Separator orientation="vertical" className="h-5" />
                <div className="w-32 h-5 bg-[hsl(var(--muted))] rounded-sm relative overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-[hsl(var(--primary))]" 
                    style={{ width: `${(currentFrame % 250) / 250 * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono">{currentFrame} / 250</span>
              </div>
            </div>

            <aside className="w-80 bg-[hsl(var(--sidebar-background))] border-l border-[hsl(var(--border))] flex flex-col">
              <Tabs defaultValue="scene" className="flex-1 flex flex-col">
                <TabsList className="w-full grid grid-cols-4 h-10 bg-[hsl(var(--toolbar-bg))] rounded-none border-b">
                  <TabsTrigger value="scene" className="text-xs">Сцена</TabsTrigger>
                  <TabsTrigger value="properties" className="text-xs">Свойства</TabsTrigger>
                  <TabsTrigger value="materials" className="text-xs">Материалы</TabsTrigger>
                  <TabsTrigger value="render" className="text-xs">Рендер</TabsTrigger>
                </TabsList>

                <TabsContent value="scene" className="flex-1 overflow-hidden m-0 p-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold">Объекты сцены</h3>
                        <Button size="sm" variant="ghost" className="h-6 px-2">
                          <Icon name="Plus" size={14} />
                        </Button>
                      </div>
                      {sceneObjects.map((obj) => (
                        <div 
                          key={obj.id}
                          className="flex items-center gap-2 p-2 rounded hover:bg-[hsl(var(--muted))] cursor-pointer"
                          onClick={() => setSelectedObjectId(obj.id)}
                        >
                          <Icon name="Box" size={16} className="text-[hsl(var(--muted-foreground))]" />
                          <span className="text-sm flex-1">{obj.name}</span>
                          <Icon name="Eye" size={14} className="text-[hsl(var(--muted-foreground))]" />
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="properties" className="flex-1 overflow-hidden m-0 p-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                      <div>
                        <Label className="text-xs">Position</Label>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <Input type="number" placeholder="X" className="h-8 text-xs" defaultValue="0" />
                          <Input type="number" placeholder="Y" className="h-8 text-xs" defaultValue="0" />
                          <Input type="number" placeholder="Z" className="h-8 text-xs" defaultValue="0" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Rotation</Label>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <Input type="number" placeholder="X" className="h-8 text-xs" defaultValue="0" />
                          <Input type="number" placeholder="Y" className="h-8 text-xs" defaultValue="0" />
                          <Input type="number" placeholder="Z" className="h-8 text-xs" defaultValue="0" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Scale</Label>
                        <div className="grid grid-cols-3 gap-2 mt-1">
                          <Input type="number" placeholder="X" className="h-8 text-xs" defaultValue="1" />
                          <Input type="number" placeholder="Y" className="h-8 text-xs" defaultValue="1" />
                          <Input type="number" placeholder="Z" className="h-8 text-xs" defaultValue="1" />
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="materials" className="flex-1 overflow-hidden m-0 p-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                      <div>
                        <Label className="text-xs">Base Color</Label>
                        <Input type="color" className="h-8 mt-1" defaultValue="#8b5cf6" />
                      </div>
                      <div>
                        <Label className="text-xs">Metalness: {samples[0] / 256}</Label>
                        <Slider value={samples} onValueChange={setSamples} max={256} step={1} className="mt-2" />
                      </div>
                      <div>
                        <Label className="text-xs">Roughness: {samples[0] / 256}</Label>
                        <Slider value={samples} onValueChange={setSamples} max={256} step={1} className="mt-2" />
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="render" className="flex-1 overflow-hidden m-0 p-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-4">
                      <div>
                        <Label className="text-xs">Resolution: {resolution[0]}p</Label>
                        <Slider value={resolution} onValueChange={setResolution} min={720} max={4320} step={1} className="mt-2" />
                      </div>
                      <div>
                        <Label className="text-xs">Samples: {samples[0]}</Label>
                        <Slider value={samples} onValueChange={setSamples} min={1} max={512} step={1} className="mt-2" />
                      </div>
                      <Button className="w-full" onClick={handleRender}>
                        <Icon name="Zap" size={16} className="mr-2" />
                        Начать рендер
                      </Button>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
