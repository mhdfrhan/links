"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cropImage } from "@/lib/utils/imageCompression";
import { uploadToCloudinary } from "@/lib/cloudinary/config";

interface ImageCropperProps {
  onCropComplete: (url: string, publicId: string) => void;
  currentImageUrl?: string;
  aspectRatio?: number; // width/height, e.g., 1 for square
  outputSize?: number; // px, e.g., 400
  folder?: string;
}

export function ImageCropper({
  onCropComplete,
  currentImageUrl,
  aspectRatio = 1,
  outputSize = 400,
  folder = "portfolio/profile",
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [uploading, setUploading] = useState(false);
  const [imgDimensions, setImgDimensions] = useState({ w: 0, h: 0, displayW: 0, displayH: 0 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
  };

  const onImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    imgRef.current = img;
    const container = containerRef.current;
    if (!container) return;

    const containerW = container.clientWidth;
    const containerH = 320;
    const scale = Math.min(containerW / img.naturalWidth, containerH / img.naturalHeight);
    const displayW = img.naturalWidth * scale;
    const displayH = img.naturalHeight * scale;

    setImgDimensions({
      w: img.naturalWidth,
      h: img.naturalHeight,
      displayW,
      displayH,
    });

    const initialSize = Math.min(displayW, displayH) * 0.7;
    setCrop({
      x: (displayW - initialSize) / 2,
      y: (displayH - initialSize) / 2,
      size: initialSize,
    });
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - crop.x, y: e.clientY - crop.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    const newX = Math.max(0, Math.min(e.clientX - dragStart.x, imgDimensions.displayW - crop.size));
    const newY = Math.max(0, Math.min(e.clientY - dragStart.y, imgDimensions.displayH - crop.size));
    setCrop((prev) => ({ ...prev, x: newX, y: newY }));
  }, [isDragging, dragStart, imgDimensions, crop.size]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleZoom = (val: number) => {
    setZoom(val);
    const newSize = Math.min(imgDimensions.displayW, imgDimensions.displayH) * 0.7 * val;
    const maxSize = Math.min(imgDimensions.displayW, imgDimensions.displayH);
    const finalSize = Math.min(newSize, maxSize);
    setCrop((prev) => ({
      ...prev,
      size: finalSize,
      x: Math.min(prev.x, imgDimensions.displayW - finalSize),
      y: Math.min(prev.y, imgDimensions.displayH - finalSize),
    }));
  };

  const handleCropAndUpload = async () => {
    if (!imageSrc || !imgRef.current) return;
    setUploading(true);

    try {
      const scaleX = imgDimensions.w / imgDimensions.displayW;
      const scaleY = imgDimensions.h / imgDimensions.displayH;

      const realCrop = {
        x: Math.round(crop.x * scaleX),
        y: Math.round(crop.y * scaleY),
        width: Math.round(crop.size * scaleX),
        height: Math.round(crop.size * scaleY),
      };

      const response = await fetch(imageSrc);
      const blob = await response.blob();

      const croppedBlob = await cropImage(blob, realCrop, { width: outputSize, height: outputSize });
      const result = await uploadToCloudinary(croppedBlob, { folder });

      onCropComplete(result.secure_url, result.public_id);
      setImageSrc(null);
    } catch (err) {
      console.error("Crop & upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-foreground">Foto Profil</label>

      {/* Current photo + change button */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-border bg-muted flex items-center justify-center">
          {currentImageUrl ? (
            <img src={currentImageUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 text-muted-foreground/50">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2.5 rounded-xl text-sm font-medium bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 transition-all"
        >
          {currentImageUrl ? "Ganti Foto" : "Upload Foto"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>

      {/* Crop interface */}
      {imageSrc && (
        <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border">
          <p className="text-sm text-muted-foreground">Atur area crop untuk foto profil:</p>

          <div ref={containerRef} className="relative flex items-center justify-center w-full max-w-md overflow-hidden rounded-xl bg-black/20" style={{ height: 320 }}>
            <div 
              className="relative" 
              style={{ 
                width: imgDimensions.displayW || "100%", 
                height: imgDimensions.displayH || "100%",
              }}
            >
              <img
                src={imageSrc}
                alt="Crop source"
                onLoad={onImgLoad}
                className="block"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
                draggable={false}
              />
              {/* Overlay strictly within image bounds */}
              <div className="absolute inset-0 overflow-hidden">
                <div
                  className="absolute border-2 border-white rounded-full cursor-move shadow-lg"
                  style={{
                    left: crop.x,
                    top: crop.y,
                    width: crop.size,
                    height: crop.size,
                    background: "transparent",
                    boxShadow: `0 0 0 9999px rgba(0,0,0,0.5)`,
                    touchAction: "none",
                  }}
                  onMouseDown={handleMouseDown}
                />
              </div>
            </div>
          </div>

          {/* Zoom slider */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Zoom</span>
              <span className="font-medium text-foreground">{(zoom * 100).toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min={0.3}
              max={1.5}
              step={0.05}
              value={zoom}
              onChange={(e) => handleZoom(Number(e.target.value))}
              className="w-full accent-accent"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setImageSrc(null)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/50 border border-border"
            >
              Batal
            </button>
            <button
              onClick={handleCropAndUpload}
              disabled={uploading}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-70 transition-all"
            >
              {uploading ? "Mengupload..." : "Crop & Upload"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
