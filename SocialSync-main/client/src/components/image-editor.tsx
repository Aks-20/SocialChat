import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RotateCw, 
  RotateCcw, 
  FlipHorizontal, 
  FlipVertical,
  Crop,
  Palette,
  Sliders,
  Download,
  Undo,
  Redo,
  Square,
  Circle,
  Move,
  ZoomIn,
  ZoomOut,
  Save
} from 'lucide-react';

interface ImageEditorProps {
  imageFile: File;
  onSave: (editedFile: File) => void;
  onCancel: () => void;
}

interface EditState {
  rotation: number;
  scaleX: number;
  scaleY: number;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  blur: number;
  zoom: number;
  cropX: number;
  cropY: number;
  cropWidth: number;
  cropHeight: number;
  isCropping: boolean;
}

const DEFAULT_STATE: EditState = {
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hue: 0,
  blur: 0,
  zoom: 1,
  cropX: 0,
  cropY: 0,
  cropWidth: 100,
  cropHeight: 100,
  isCropping: false,
};

export default function ImageEditor({ imageFile, onSave, onCancel }: ImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [editState, setEditState] = useState<EditState>(DEFAULT_STATE);
  const [history, setHistory] = useState<EditState[]>([DEFAULT_STATE]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [activeTab, setActiveTab] = useState('resize');

  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const addToHistory = useCallback((newState: EditState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setEditState(newState);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setEditState(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setEditState(history[historyIndex + 1]);
    }
  };

  const updateState = (updates: Partial<EditState>) => {
    const newState = { ...editState, ...updates };
    addToHistory(newState);
  };

  const drawImage = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size based on zoom and original dimensions
    const displayWidth = originalDimensions.width * editState.zoom;
    const displayHeight = originalDimensions.height * editState.zoom;
    
    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context for transformations
    ctx.save();

    // Apply transformations
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((editState.rotation * Math.PI) / 180);
    ctx.scale(editState.scaleX, editState.scaleY);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // Apply filters
    const filters = [
      `brightness(${editState.brightness}%)`,
      `contrast(${editState.contrast}%)`,
      `saturate(${editState.saturation}%)`,
      `hue-rotate(${editState.hue}deg)`,
      `blur(${editState.blur}px)`
    ];
    ctx.filter = filters.join(' ');

    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw crop overlay if cropping
    if (editState.isCropping) {
      ctx.restore();
      ctx.save();
      
      // Semi-transparent overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Clear crop area
      const cropX = (editState.cropX / 100) * canvas.width;
      const cropY = (editState.cropY / 100) * canvas.height;
      const cropW = (editState.cropWidth / 100) * canvas.width;
      const cropH = (editState.cropHeight / 100) * canvas.height;
      
      ctx.clearRect(cropX, cropY, cropW, cropH);
      
      // Crop border
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(cropX, cropY, cropW, cropH);
    }

    ctx.restore();
  }, [editState, originalDimensions]);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      drawImage();
    }
  }, [drawImage]);

  const handleImageLoad = () => {
    if (imgRef.current) {
      setOriginalDimensions({
        width: imgRef.current.naturalWidth,
        height: imgRef.current.naturalHeight
      });
      drawImage();
    }
  };

  const applyCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cropX = (editState.cropX / 100) * canvas.width;
    const cropY = (editState.cropY / 100) * canvas.height;
    const cropW = (editState.cropWidth / 100) * canvas.width;
    const cropH = (editState.cropHeight / 100) * canvas.height;

    const imageData = ctx.getImageData(cropX, cropY, cropW, cropH);
    
    canvas.width = cropW;
    canvas.height = cropH;
    
    ctx.putImageData(imageData, 0, 0);
    
    updateState({
      ...editState,
      isCropping: false,
      cropX: 0,
      cropY: 0,
      cropWidth: 100,
      cropHeight: 100
    });
  };

  const exportImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], imageFile.name, { type: imageFile.type });
        onSave(file);
      }
    }, imageFile.type, 0.9);
  };

  const resetImage = () => {
    setEditState(DEFAULT_STATE);
    setHistory([DEFAULT_STATE]);
    setHistoryIndex(0);
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh] bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">Edit Image</h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={resetImage}>
            Reset
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={exportImage} className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Controls */}
        <div className="w-80 bg-white border-r overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 m-2">
              <TabsTrigger value="resize">Resize</TabsTrigger>
              <TabsTrigger value="adjust">Adjust</TabsTrigger>
              <TabsTrigger value="effects">Effects</TabsTrigger>
            </TabsList>

            <TabsContent value="resize" className="p-4 space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Rotation</label>
                <div className="flex items-center space-x-2 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateState({ rotation: editState.rotation - 90 })}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateState({ rotation: editState.rotation + 90 })}
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                  <Badge variant="secondary">{editState.rotation}°</Badge>
                </div>
                <Slider
                  value={[editState.rotation]}
                  onValueChange={([value]) => updateState({ rotation: value })}
                  max={360}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Flip</label>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateState({ scaleX: editState.scaleX * -1 })}
                  >
                    <FlipHorizontal className="w-4 h-4 mr-1" />
                    Horizontal
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateState({ scaleY: editState.scaleY * -1 })}
                  >
                    <FlipVertical className="w-4 h-4 mr-1" />
                    Vertical
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Zoom: {editState.zoom.toFixed(1)}x</label>
                <div className="flex items-center space-x-2 mb-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateState({ zoom: Math.max(0.1, editState.zoom - 0.1) })}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateState({ zoom: Math.min(5, editState.zoom + 0.1) })}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
                <Slider
                  value={[editState.zoom]}
                  onValueChange={([value]) => updateState({ zoom: value })}
                  max={3}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Crop</label>
                  <Button
                    variant={editState.isCropping ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateState({ isCropping: !editState.isCropping })}
                  >
                    <Crop className="w-4 h-4 mr-1" />
                    {editState.isCropping ? 'Apply' : 'Enable'}
                  </Button>
                </div>
                {editState.isCropping && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600">X Position: {editState.cropX}%</label>
                      <Slider
                        value={[editState.cropX]}
                        onValueChange={([value]) => updateState({ cropX: value })}
                        max={100 - editState.cropWidth}
                        min={0}
                        step={1}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Y Position: {editState.cropY}%</label>
                      <Slider
                        value={[editState.cropY]}
                        onValueChange={([value]) => updateState({ cropY: value })}
                        max={100 - editState.cropHeight}
                        min={0}
                        step={1}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Width: {editState.cropWidth}%</label>
                      <Slider
                        value={[editState.cropWidth]}
                        onValueChange={([value]) => updateState({ cropWidth: value })}
                        max={100 - editState.cropX}
                        min={10}
                        step={1}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-600">Height: {editState.cropHeight}%</label>
                      <Slider
                        value={[editState.cropHeight]}
                        onValueChange={([value]) => updateState({ cropHeight: value })}
                        max={100 - editState.cropY}
                        min={10}
                        step={1}
                      />
                    </div>
                    <Button
                      onClick={applyCrop}
                      className="w-full"
                      variant="outline"
                    >
                      Apply Crop
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="adjust" className="p-4 space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Brightness: {editState.brightness}%</label>
                <Slider
                  value={[editState.brightness]}
                  onValueChange={([value]) => updateState({ brightness: value })}
                  max={200}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Contrast: {editState.contrast}%</label>
                <Slider
                  value={[editState.contrast]}
                  onValueChange={([value]) => updateState({ contrast: value })}
                  max={200}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Saturation: {editState.saturation}%</label>
                <Slider
                  value={[editState.saturation]}
                  onValueChange={([value]) => updateState({ saturation: value })}
                  max={200}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Hue: {editState.hue}°</label>
                <Slider
                  value={[editState.hue]}
                  onValueChange={([value]) => updateState({ hue: value })}
                  max={360}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>
            </TabsContent>

            <TabsContent value="effects" className="p-4 space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Blur: {editState.blur}px</label>
                <Slider
                  value={[editState.blur]}
                  onValueChange={([value]) => updateState({ blur: value })}
                  max={20}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Quick Presets</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateState({
                      brightness: 110,
                      contrast: 120,
                      saturation: 130
                    })}
                  >
                    Vibrant
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateState({
                      brightness: 90,
                      contrast: 110,
                      saturation: 80
                    })}
                  >
                    Vintage
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateState({
                      brightness: 100,
                      contrast: 100,
                      saturation: 0
                    })}
                  >
                    B&W
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateState({
                      brightness: 120,
                      contrast: 90,
                      saturation: 110
                    })}
                  >
                    Soft
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-100">
          <div className="relative">
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Original"
              className="hidden"
              onLoad={handleImageLoad}
            />
            <canvas
              ref={canvasRef}
              className="max-w-full max-h-full border border-gray-300 bg-white shadow-lg"
              style={{ maxHeight: '60vh' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}