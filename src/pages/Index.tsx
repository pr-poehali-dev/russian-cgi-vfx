import { useState } from 'react';
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

const Index = () => {
  const [selectedTool, setSelectedTool] = useState('select');
  const [playback, setPlayback] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [resolution, setResolution] = useState([1920]);
  const [samples, setSamples] = useState([128]);

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

  return (
    <div className="h-screen w-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] flex flex-col overflow-hidden font-['Roboto']">
      <header className="h-12 bg-[hsl(var(--toolbar-bg))] border-b border-[hsl(var(--border))] flex items-center px-4 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] rounded flex items-center justify-center font-bold">
            С
          </div>
          <span className="text-lg font-semibold">СФЕРА Studio</span>
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
          <Select defaultValue="cpu">
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cpu">CPU Render</SelectItem>
              <SelectItem value="gpu">GPU Render</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90">
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
            <Button variant="ghost" size="sm" className="h-7 px-2">
              <Icon name="Grid3x3" size={14} />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2">
              <Icon name="Box" size={14} />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2">
              <Icon name="Sun" size={14} />
            </Button>
          </div>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 bg-[hsl(var(--viewport-bg))] relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-96 h-96">
                  <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary))]/20 to-[hsl(var(--secondary))]/20 rounded-lg transform rotate-12 blur-xl" />
                  <div className="relative bg-[hsl(var(--card))] rounded-lg p-8 border border-[hsl(var(--border))] backdrop-blur-sm">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] flex items-center justify-center">
                          <Icon name="Box" size={32} className="text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold">3D Viewport</h3>
                          <p className="text-sm text-[hsl(var(--muted-foreground))]">Интерактивная сцена</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[hsl(var(--muted))] rounded p-4 text-center">
                          <Icon name="Cube" size={24} className="mx-auto mb-2 text-[hsl(var(--primary))]" />
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">Объекты: 127</p>
                        </div>
                        <div className="bg-[hsl(var(--muted))] rounded p-4 text-center">
                          <Icon name="Triangle" size={24} className="mx-auto mb-2 text-[hsl(var(--secondary))]" />
                          <p className="text-xs text-[hsl(var(--muted-foreground))]">Полигоны: 2.4M</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1 bg-[hsl(var(--primary))]">
                          <Icon name="Play" size={16} className="mr-2" />
                          Превью
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Icon name="Settings" size={16} className="mr-2" />
                          Настройки
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute top-4 right-4 bg-[hsl(var(--card))]/90 backdrop-blur-sm border border-[hsl(var(--border))] rounded p-2 text-xs space-y-1 font-mono">
                <div>FPS: 60</div>
                <div>Camera: Perspective</div>
                <div>Frame: {currentFrame}</div>
              </div>
            </div>

            <aside className="w-80 bg-[hsl(var(--panel-bg))] border-l border-[hsl(var(--border))] flex flex-col">
              <Tabs defaultValue="properties" className="flex-1 flex flex-col">
                <TabsList className="w-full justify-start rounded-none h-10 bg-[hsl(var(--toolbar-bg))] border-b border-[hsl(var(--border))]">
                  <TabsTrigger value="properties" className="text-xs">Свойства</TabsTrigger>
                  <TabsTrigger value="nodes" className="text-xs">Ноды</TabsTrigger>
                  <TabsTrigger value="assets" className="text-xs">Ассеты</TabsTrigger>
                </TabsList>

                <TabsContent value="properties" className="flex-1 overflow-hidden m-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-6">
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <Icon name="Box" size={16} />
                          Transform
                        </h3>
                        <div className="space-y-2">
                          <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">X</Label>
                              <Input type="number" defaultValue="0.00" className="h-7 text-xs" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Y</Label>
                              <Input type="number" defaultValue="0.00" className="h-7 text-xs" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Z</Label>
                              <Input type="number" defaultValue="0.00" className="h-7 text-xs" />
                            </div>
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <Icon name="Sparkles" size={16} />
                          Material
                        </h3>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Base Color</Label>
                            <div className="flex gap-2">
                              <div className="w-10 h-7 rounded bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] border border-[hsl(var(--border))]" />
                              <Input defaultValue="#0EA5E9" className="h-7 text-xs flex-1" />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label className="text-xs">Metallic</Label>
                              <span className="text-xs text-[hsl(var(--muted-foreground))]">0.50</span>
                            </div>
                            <Slider defaultValue={[50]} max={100} step={1} />
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label className="text-xs">Roughness</Label>
                              <span className="text-xs text-[hsl(var(--muted-foreground))]">0.30</span>
                            </div>
                            <Slider defaultValue={[30]} max={100} step={1} />
                          </div>
                        </div>
                      </div>

                      <Separator />

                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold flex items-center gap-2">
                          <Icon name="Settings" size={16} />
                          Render Settings
                        </h3>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Resolution</Label>
                            <Select defaultValue="1080p">
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="720p">1280 x 720 (HD)</SelectItem>
                                <SelectItem value="1080p">1920 x 1080 (Full HD)</SelectItem>
                                <SelectItem value="2k">2560 x 1440 (2K)</SelectItem>
                                <SelectItem value="4k">3840 x 2160 (4K)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label className="text-xs">Samples</Label>
                              <span className="text-xs text-[hsl(var(--muted-foreground))]">{samples[0]}</span>
                            </div>
                            <Slider 
                              value={samples} 
                              onValueChange={setSamples}
                              min={32} 
                              max={512} 
                              step={32} 
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="nodes" className="flex-1 overflow-hidden m-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-3">
                      {nodeTypes.map((node) => (
                        <div
                          key={node.id}
                          className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded p-3 cursor-move hover:border-[hsl(var(--primary))] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Icon name="Circle" size={12} className="text-[hsl(var(--primary))]" />
                            <div className="flex-1">
                              <div className="text-xs font-medium">{node.name}</div>
                              <div className="text-xs text-[hsl(var(--muted-foreground))]">{node.category}</div>
                            </div>
                            <Icon name="GripVertical" size={16} className="text-[hsl(var(--muted-foreground))]" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="assets" className="flex-1 overflow-hidden m-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 space-y-2">
                      {assets.map((asset) => (
                        <div
                          key={asset.id}
                          className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded p-3 hover:border-[hsl(var(--primary))] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[hsl(var(--muted))] rounded flex items-center justify-center">
                              <Icon name="FileBox" size={20} className="text-[hsl(var(--primary))]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-medium truncate">{asset.name}</div>
                              <div className="text-xs text-[hsl(var(--muted-foreground))]">{asset.size}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </aside>
          </div>

          <div className="h-48 bg-[hsl(var(--timeline-bg))] border-t border-[hsl(var(--border))] flex flex-col">
            <div className="h-10 bg-[hsl(var(--toolbar-bg))] border-b border-[hsl(var(--border))] flex items-center px-4 gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setPlayback(!playback)}
              >
                <Icon name={playback ? 'Pause' : 'Play'} size={16} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Icon name="SkipBack" size={16} />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Icon name="SkipForward" size={16} />
              </Button>
              
              <Separator orientation="vertical" className="h-5 mx-2" />
              
              <div className="flex items-center gap-2 font-mono text-xs">
                <Input 
                  type="number" 
                  value={currentFrame} 
                  onChange={(e) => setCurrentFrame(parseInt(e.target.value) || 0)}
                  className="w-16 h-7 text-center"
                />
                <span className="text-[hsl(var(--muted-foreground))]">/ 250</span>
              </div>

              <Separator orientation="vertical" className="h-5 mx-2" />

              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <Icon name="Plus" size={14} className="mr-1" />
                Keyframe
              </Button>
            </div>

            <div className="flex-1 relative overflow-x-auto overflow-y-hidden">
              <div className="absolute inset-0 p-4">
                <div className="h-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded">
                  <div className="h-full flex">
                    <div className="w-48 border-r border-[hsl(var(--border))] p-2 space-y-1">
                      <div className="text-xs font-medium px-2 py-1 hover:bg-[hsl(var(--muted))] rounded cursor-pointer">
                        <Icon name="Box" size={12} className="inline mr-2" />
                        Object Transform
                      </div>
                      <div className="text-xs font-medium px-2 py-1 hover:bg-[hsl(var(--muted))] rounded cursor-pointer">
                        <Icon name="Camera" size={12} className="inline mr-2" />
                        Camera Position
                      </div>
                      <div className="text-xs font-medium px-2 py-1 hover:bg-[hsl(var(--muted))] rounded cursor-pointer">
                        <Icon name="Lightbulb" size={12} className="inline mr-2" />
                        Light Intensity
                      </div>
                    </div>
                    
                    <div className="flex-1 relative overflow-hidden">
                      <div className="absolute inset-0" style={{ 
                        backgroundImage: 'repeating-linear-gradient(90deg, hsl(var(--border)) 0, hsl(var(--border)) 1px, transparent 1px, transparent 40px)',
                        backgroundSize: '40px 100%'
                      }}>
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-[hsl(var(--primary))] transition-all"
                          style={{ left: `${(currentFrame / 250) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
