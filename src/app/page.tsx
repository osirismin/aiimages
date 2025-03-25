'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Image from 'next/image';
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

interface ImageSize {
  width: number;
  height: number;
  label: string;
  ratio?: string;
}

const PRESET_SIZES: ImageSize[] = [
  { width: 1024, height: 1024, label: '1:1', ratio: '1:1' },
  { width: 1024, height: 683, label: '3:2', ratio: '3:2' },
  { width: 1024, height: 1536, label: '2:3', ratio: '2:3' },
  { width: 1024, height: 576, label: '16:9', ratio: '16:9' },
  { width: 1024, height: 1820, label: '9:16', ratio: '9:16' },
];

const STYLE_PROMPTS = {
  realistic: '写实风格，真实照片效果',
  anime: '动漫风格，二次元插画效果',
  oil: '油画风格，厚重笔触效果',
  watercolor: '水彩风格，清新淡雅效果'
};

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState('realistic');
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [customWidth, setCustomWidth] = useState('1024');
  const [customHeight, setCustomHeight] = useState('1024');
  const [showSizeInputs, setShowSizeInputs] = useState(false);
  const [selectedSize, setSelectedSize] = useState<ImageSize>(PRESET_SIZES[0]);
  
  // 新增参数状态
  const [seed, setSeed] = useState('100');
  const [steps, setSteps] = useState('30');
  const [cfgScale, setCfgScale] = useState('7.5');
  const [sampler, setSampler] = useState('euler_a');

  const handleSizeChange = (value: string) => {
    if (value === 'custom') {
      setShowSizeInputs(true);
      setSelectedSize({ width: parseInt(customWidth), height: parseInt(customHeight), label: '自定义' });
    } else {
      setShowSizeInputs(true);
      const size = PRESET_SIZES.find(s => s.ratio === value) || PRESET_SIZES[0];
      setSelectedSize(size);
      setCustomWidth(size.width.toString());
      setCustomHeight(size.height.toString());
    }
  };

  const handleWidthChange = (value: string) => {
    const width = parseInt(value);
    setCustomWidth(value);
    
    if (selectedSize.ratio) {
      // 根据比例计算高度
      const [ratioWidth, ratioHeight] = selectedSize.ratio.split(':').map(Number);
      const height = Math.round((width * ratioHeight) / ratioWidth);
      setCustomHeight(height.toString());
      setSelectedSize({ ...selectedSize, width, height });
    } else {
      setSelectedSize({ ...selectedSize, width, height: parseInt(customHeight) });
    }
  };

  const handleHeightChange = (value: string) => {
    const height = parseInt(value);
    setCustomHeight(value);
    
    if (selectedSize.ratio) {
      // 根据比例计算宽度
      const [ratioWidth, ratioHeight] = selectedSize.ratio.split(':').map(Number);
      const width = Math.round((height * ratioWidth) / ratioHeight);
      setCustomWidth(width.toString());
      setSelectedSize({ ...selectedSize, width, height });
    } else {
      setSelectedSize({ ...selectedSize, width: parseInt(customWidth), height });
    }
  };

  const generateImage = async () => {
    if (!prompt) return;
    
    setLoading(true);
    try {
      // 将风格提示词添加到用户提示词中
      const fullPrompt = `${prompt}，${STYLE_PROMPTS[style as keyof typeof STYLE_PROMPTS]}`;
      const encodedPrompt = encodeURIComponent(fullPrompt);
      
      // 构建 URL 参数
      const params = new URLSearchParams({
        width: selectedSize.width.toString(),
        height: selectedSize.height.toString(),
        model: 'flux',
        nologo: 'true',
        seed: seed,
        steps: steps,
        cfg_scale: cfgScale,
        sampler: sampler
      });
      
      const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?${params}`;
      setImageUrl(url);
      
      // 添加到历史记录
      const newImage: GeneratedImage = {
        id: Date.now().toString(),
        url,
        prompt: fullPrompt,
        timestamp: Date.now()
      };
      setHistory(prev => [newImage, ...prev].slice(0, 10));
      
      // 更新随机种子
      setSeed((parseInt(seed) + 1).toString());
    } catch (error) {
      console.error('Error generating image:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = async () => {
    if (!imageUrl) return;
    
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('服务器响应异常');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      
      // 生成更智能的文件名
      const cleanPrompt = prompt
        .substring(0, 30)
        .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')
        .replace(/_+/g, '_');
      const filename = `AI_${cleanPrompt}_${Date.now()}.png`;
      
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
      // 这里可以添加错误提示UI
    }
  };

  return (
    <main className="container mx-auto p-4 min-h-screen">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-center">AI 图片生成器</h1>
        
        <Card className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="prompt" className="text-sm font-medium">
                描述你想要的图片
              </label>
              <Textarea
                id="prompt"
                placeholder="例如：一只可爱的猫咪在阳光下玩耍"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">图片比例</label>
                <Select 
                  value={selectedSize.ratio || 'custom'} 
                  onValueChange={handleSizeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择比例" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">自定义</SelectItem>
                    {PRESET_SIZES.map((size) => (
                      <SelectItem key={size.ratio} value={size.ratio || 'custom'}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showSizeInputs && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="width">宽度</Label>
                    <Input
                      id="width"
                      type="number"
                      value={customWidth}
                      onChange={(e) => handleWidthChange(e.target.value)}
                      min="64"
                      max="1024"
                      step="64"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height">高度</Label>
                    <Input
                      id="height"
                      type="number"
                      value={customHeight}
                      onChange={(e) => handleHeightChange(e.target.value)}
                      min="64"
                      max="1024"
                      step="64"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">图片风格</label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="选择风格" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realistic">写实风格</SelectItem>
                  <SelectItem value="anime">动漫风格</SelectItem>
                  <SelectItem value="oil">油画风格</SelectItem>
                  <SelectItem value="watercolor">水彩风格</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="seed">随机种子</Label>
                <Input
                  id="seed"
                  type="number"
                  value={seed}
                  onChange={(e) => setSeed(e.target.value)}
                  min="0"
                  max="999999"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="steps">采样步数</Label>
                <Input
                  id="steps"
                  type="number"
                  value={steps}
                  onChange={(e) => setSteps(e.target.value)}
                  min="1"
                  max="150"
                  step="1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cfgScale">CFG Scale</Label>
                <Input
                  id="cfgScale"
                  type="number"
                  value={cfgScale}
                  onChange={(e) => setCfgScale(e.target.value)}
                  min="1"
                  max="20"
                  step="0.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sampler">采样器</Label>
                <Select value={sampler} onValueChange={setSampler}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择采样器" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="euler_a">Euler Ancestral</SelectItem>
                    <SelectItem value="euler">Euler</SelectItem>
                    <SelectItem value="lms">LMS</SelectItem>
                    <SelectItem value="heun">Heun</SelectItem>
                    <SelectItem value="dpm2">DPM2</SelectItem>
                    <SelectItem value="dpm2_a">DPM2 Ancestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={generateImage} 
              disabled={loading || !prompt}
              className="w-full"
            >
              {loading ? '生成中...' : '生成图片'}
            </Button>
          </div>
        </Card>

        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="current">当前图片</TabsTrigger>
            <TabsTrigger value="history">历史记录</TabsTrigger>
          </TabsList>
          
          <TabsContent value="current">
            {imageUrl && (
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">生成的图片</h2>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={downloadImage}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="relative w-full overflow-hidden rounded-lg" style={{ aspectRatio: `${selectedSize.width}/${selectedSize.height}` }}>
                    {loading ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all duration-300">
                        <div className="flex flex-col items-center gap-4">
                          <LoadingSpinner className="w-16 h-16" />
                          <p className="text-white text-lg font-medium">正在生成图片...</p>
                          <p className="text-white/80 text-sm">这可能需要一些时间，请耐心等待</p>
                        </div>
                      </div>
                    ) : null}
                    <Image
                      src={imageUrl}
                      alt={prompt}
                      fill
                      className="object-cover transition-opacity duration-300"
                      unoptimized
                    />
                  </div>
                </div>
              </Card>
            )}
            {loading && !imageUrl && (
              <Card className="p-6">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-center">正在生成图片</h2>
                  <div className="flex flex-col items-center justify-center space-y-6 py-8">
                    <LoadingSpinner className="w-20 h-20" />
                    <div className="text-center space-y-2">
                      <p className="text-lg font-medium">请稍候，正在处理您的请求...</p>
                      <p className="text-sm text-gray-500">生成高质量的图片需要一些时间</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="history">
            <div className="grid grid-cols-1 gap-4">
              {history.map((image) => (
                <Card key={image.id} className="p-4">
                  <div className="flex gap-4">
                    <div className="relative w-24 h-24 overflow-hidden rounded-lg">
                      <Image
                        src={image.url}
                        alt={image.prompt}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm text-gray-500">
                        {new Date(image.timestamp).toLocaleString()}
                      </p>
                      <p className="text-sm">{image.prompt}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.open(image.url, '_blank')}>
                          查看
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setImageUrl(image.url)}>
                          重新使用
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
              {history.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  暂无历史记录
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
} 