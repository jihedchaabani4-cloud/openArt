"use client";

import React, { useState, useEffect, useRef } from "react";
import { Stage, Layer, Image, Rect, Transformer } from "react-konva";
import useImage from "use-image";
import { cn } from "@/shared/lib/utils";

// Konva is automatically handled by react-konva, 
// but we want to ensure only one instance is initialized in the browser.
if (typeof window !== "undefined") {
  // @ts-ignore
  window.Konva = window.Konva || require("konva");
}

/**
 * WorkflowMediaCanvas
 * A Konva-based image viewer that supports a selection rectangle.
 * 
 * @param {string} imageUrl - The URL of the image to display
 * @param {Object} selection - Current selection coordinates { x, y, width, height }
 * @param {Function} onSelectionChange - Callback when selection changes
 */
export function WorkflowMediaCanvas({ 
  imageUrl, 
  selection, 
  onSelectionChange,
  readOnly = false,
  className,
  onLoad,    // Added to handle ImageStatusView integration
  onError,   // Added to handle ImageStatusView integration
  onIntrinsicSize,
}) {
  // Try with anonymous first, if it fails, it might be a CORS issue
  const [image, status] = useImage(imageUrl, "anonymous");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, scale: 1, offsetX: 0, offsetY: 0 });
  const containerRef = useRef(null);
  const shapeRef = useRef(null);
  const trRef = useRef(null);

  // Drawing state
  const [newRect, setNewRect] = useState(null);
  const isDrawing = useRef(false);

  // Fallback for CORS issues
  const [retryWithNoCors, setRetryWithNoCors] = useState(false);
  const [imageNoCors, statusNoCors] = useImage(retryWithNoCors ? imageUrl : null);

  const activeImage = retryWithNoCors ? imageNoCors : image;
  const activeStatus = retryWithNoCors ? statusNoCors : status;

  const prevIntrinsicRef = useRef(null);
  useEffect(() => {
    prevIntrinsicRef.current = null;
  }, [imageUrl]);

  useEffect(() => {
    if (activeStatus !== "loaded" || !activeImage) return;
    const w = activeImage.naturalWidth || activeImage.width;
    const h = activeImage.naturalHeight || activeImage.height;
    if (!w || !h) return;
    const key = `${w}x${h}`;
    if (prevIntrinsicRef.current === key) return;
    prevIntrinsicRef.current = key;
    onIntrinsicSize?.(w, h);
  }, [activeImage, activeStatus, onIntrinsicSize]);

  // Mouse Handlers for Drawing
  const handleMouseDown = (e) => {
    if (readOnly) return;

    // If clicking on the transformer or existing selection, don't start new drawing
    const clickedOnTransformer = e.target.getParent()?.className === 'Transformer';
    const clickedOnSelection = e.target === shapeRef.current;
    
    if (clickedOnTransformer || clickedOnSelection) return;

    // Deselect if clicking elsewhere
    if (selection) {
      onSelectionChange?.(null);
    }

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    
    // Adjust for Layer offset
    const x = pos.x - dimensions.offsetX;
    const y = pos.y - dimensions.offsetY;

    isDrawing.current = true;
    setNewRect({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    if (readOnly || !isDrawing.current) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    
    const x = pos.x - dimensions.offsetX;
    const y = pos.y - dimensions.offsetY;

    setNewRect((prev) => ({
      ...prev,
      width: x - prev.x,
      height: y - prev.y,
    }));
  };

  const handleMouseUp = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    
    if (newRect && Math.abs(newRect.width) > 5 && Math.abs(newRect.height) > 5) {
      // Normalize negative width/height (drawing backwards)
      const finalRect = {
        x: newRect.width < 0 ? newRect.x + newRect.width : newRect.x,
        y: newRect.height < 0 ? newRect.y + newRect.height : newRect.y,
        width: Math.abs(newRect.width),
        height: Math.abs(newRect.height),
      };
      onSelectionChange?.({
        ...finalRect,
        canvasWidth: dimensions.width,
        canvasHeight: dimensions.height,
      });
    }
    setNewRect(null);
  };

  // Sync loading status with parent (ImageStatusView)
  useEffect(() => {
    if (activeStatus === "loaded") {
      onLoad?.();
    } else if (activeStatus === "failed") {
      if (!retryWithNoCors) {
        setRetryWithNoCors(true);
      } else {
        onError?.();
      }
    }
  }, [activeStatus, onLoad, onError, retryWithNoCors]);

  // Handle container resizing and image scaling
  useEffect(() => {
    if (!containerRef.current || !activeImage || activeStatus !== "loaded") return;

    const updateSize = () => {
      const container = containerRef.current;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      
      if (cw === 0 || ch === 0) return;

      const iw = activeImage.width;
      const ih = activeImage.height;
      
      const scale = Math.min(cw / iw, ch / ih);
      
      setDimensions({
        width: iw * scale,
        height: ih * scale,
        scale: scale,
        offsetX: (cw - iw * scale) / 2,
        offsetY: (ch - ih * scale) / 2
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [activeImage, activeStatus]);

  // Handle Transformer attachment
  useEffect(() => {
    if (trRef.current && shapeRef.current && selection) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [selection, activeStatus]);

  if (!imageUrl) return null;

  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;
    
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and update width/height
    node.scaleX(1);
    node.scaleY(1);

    onSelectionChange?.({
      x: node.x(),
      y: node.y(),
      width: Math.max(5, node.width() * scaleX),
      height: Math.max(5, node.height() * scaleY),
      canvasWidth: dimensions.width,
      canvasHeight: dimensions.height,
    });
  };

  const handleDragEnd = (e) => {
    onSelectionChange?.({
      ...selection,
      x: e.target.x(),
      y: e.target.y(),
      canvasWidth: dimensions.width,
      canvasHeight: dimensions.height,
    });
  };

  if (activeStatus === "loading") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black/20 gap-3">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Loading Image...</span>
      </div>
    );
  }

  if (activeStatus === "failed") {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black/20 gap-3 p-8 text-center">
        <div className="text-white/40 text-sm font-medium">Failed to load image</div>
        <div className="text-white/20 text-[10px] max-w-[200px]">This could be due to a CORS policy on the image server.</div>
        <img src={imageUrl} className="max-w-[100px] opacity-20 rounded-lg border border-white/5 mt-2" alt="fallback" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn(
        "w-full h-full relative bg-black/40 overflow-hidden", 
        !readOnly ? "cursor-crosshair" : "cursor-default",
        className
    )}>
      {activeStatus === "loaded" && (
        <Stage
          width={containerRef.current?.clientWidth || 0}
          height={containerRef.current?.clientHeight || 0}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <Layer x={dimensions.offsetX} y={dimensions.offsetY}>
            {/* Main Image */}
            <Image
              image={activeImage}
              width={dimensions.width}
              height={dimensions.height}
              listening={true}
            />

            {/* Existing Selection Rectangle */}
            {selection && !newRect && (
              <>
                <Rect
                  ref={shapeRef}
                  {...selection}
                  fill="rgba(212, 255, 0, 0.15)"
                  stroke="#D4FF00"
                  strokeWidth={2}
                  dash={[5, 5]}
                  draggable={!readOnly}
                  onDragEnd={handleDragEnd}
                  onTransformEnd={handleTransformEnd}
                />
                {!readOnly && (
                  <Transformer
                    ref={trRef}
                    rotateEnabled={false}
                    borderStroke="#D4FF00"
                    anchorStroke="#D4FF00"
                    anchorFill="#D4FF00"
                    anchorSize={8}
                    anchorCornerRadius={2}
                    enabledAnchors={[
                      "top-left",
                      "top-right",
                      "bottom-left",
                      "bottom-right",
                    ]}
                  />
                )}
              </>
            )}

            {/* New Rectangle being drawn */}
            {newRect && (
              <Rect
                x={newRect.width < 0 ? newRect.x + newRect.width : newRect.x}
                y={newRect.height < 0 ? newRect.y + newRect.height : newRect.y}
                width={Math.abs(newRect.width)}
                height={Math.abs(newRect.height)}
                fill="rgba(212, 255, 0, 0.1)"
                stroke="#D4FF00"
                strokeWidth={1}
                dash={[3, 3]}
              />
            )}
          </Layer>
        </Stage>
      )}
    </div>
  );
}
