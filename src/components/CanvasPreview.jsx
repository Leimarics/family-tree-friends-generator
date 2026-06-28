import React, { useEffect, useState, useRef } from 'react'
import { Stage, Layer, Rect, Text, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import Konva from 'konva'
import { computeLayout } from '../utils/gridLayouts'
import AvatarNode from './AvatarNode'
import { Plus, Minus } from 'lucide-react'

export default function CanvasPreview({ config, stageRef }) {
  const wrapperRef = useRef(null)
  const [autoScale, setAutoScale] = useState(1)
  const [zoomMode, setZoomMode] = useState('fit')
  const [manualZoom, setManualZoom] = useState(1)

  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 })

  const layout = computeLayout(config)
  const { canvasWidth, canvasHeight } = layout

  // Keep the on-screen preview scaled to fit its container using ResizeObserver.
  // Stage itself always renders at full native resolution for crisp exports.
  useEffect(() => {
    if (!wrapperRef.current) return

    const handleResize = (entries) => {
      for (let entry of entries) {
        const { width: containerWidth, height: containerHeight } = entry.contentRect
        // Leave a tiny margin of 4px on each side (8px total)
        const scaleX = (containerWidth - 8) / canvasWidth
        const scaleY = (containerHeight - 8) / canvasHeight
        const nextScale = Math.min(scaleX, scaleY)
        setAutoScale(Math.max(0.1, nextScale))
      }
    }

    const observer = new ResizeObserver(handleResize)
    observer.observe(wrapperRef.current)

    // Initial scale calculation
    const initialWidth = wrapperRef.current.clientWidth
    const initialHeight = wrapperRef.current.clientHeight
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const padX = isMobile ? 16 + 8 : 32 + 8
    const padY = isMobile ? 16 + 8 : 32 + 8
    const initScaleX = (initialWidth - padX) / canvasWidth
    const initScaleY = (initialHeight - padY) / canvasHeight
    setAutoScale(Math.max(0.1, Math.min(initScaleX, initScaleY)))

    return () => {
      observer.disconnect()
    }
  }, [canvasWidth, canvasHeight])

  // Mobile touch gesture zoom listener (passive: false is required to override default browser pinch zoom)
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    let startDist = 0
    let startScale = 1
    let lastTouchTime = 0

    const onTouchStart = (e) => {
      // 1. Handle pinch to zoom (2 fingers)
      if (e.touches.length === 2) {
        e.preventDefault()
        startDist = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        )
        startScale = zoomMode === 'fit' ? autoScale : manualZoom
      }
      // 2. Handle double tap zoom (1 finger)
      else if (e.touches.length === 1) {
        const now = Date.now()
        if (now - lastTouchTime < 300) {
          e.preventDefault()
          setZoomMode((prevMode) => {
            if (prevMode === 'fit') {
              setManualZoom(1.0)
              return 'manual'
            } else {
              return 'fit'
            }
          })
        }
        lastTouchTime = now
      }
    }

    const onTouchMove = (e) => {
      if (e.touches.length === 2 && startDist > 0) {
        e.preventDefault()
        const dist = Math.hypot(
          e.touches[0].pageX - e.touches[1].pageX,
          e.touches[0].pageY - e.touches[1].pageY
        )
        const ratio = dist / startDist
        // Amplify the zoom sensitivity by 3x
        const adjustedRatio = 1.0 + (ratio - 1.0) * 3.0
        let newScale = startScale * adjustedRatio
        newScale = Math.min(2.0, Math.max(0.1, newScale))
        setZoomMode('manual')
        setManualZoom(Number(newScale.toFixed(2)))
      }
    }

    const onTouchEnd = () => {
      startDist = 0
    }

    wrapper.addEventListener('touchstart', onTouchStart, { passive: false })
    wrapper.addEventListener('touchmove', onTouchMove, { passive: false })
    wrapper.addEventListener('touchend', onTouchEnd)

    return () => {
      wrapper.removeEventListener('touchstart', onTouchStart)
      wrapper.removeEventListener('touchmove', onTouchMove)
      wrapper.removeEventListener('touchend', onTouchEnd)
    }
  }, [autoScale, manualZoom, zoomMode])

  const scale = zoomMode === 'fit' ? autoScale : manualZoom

  const handleMouseDown = (e) => {
    if (e.button !== 0) return // Only drag with left mouse button
    setIsDragging(true)
    setDragStart({
      x: e.pageX,
      y: e.pageY,
      scrollLeft: wrapperRef.current.scrollLeft,
      scrollTop: wrapperRef.current.scrollTop,
    })
  }

  const handleMouseUpOrLeave = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    e.preventDefault()
    const walkX = e.pageX - dragStart.x
    const walkY = e.pageY - dragStart.y
    wrapperRef.current.scrollLeft = dragStart.scrollLeft - walkX
    wrapperRef.current.scrollTop = dragStart.scrollTop - walkY
  }

  const handleDoubleClick = () => {
    if (zoomMode === 'fit') {
      setZoomMode('manual')
      setManualZoom(1.0) // Zoom to 100%
    } else {
      setZoomMode('fit')
    }
  }

  return (
    <div className="w-full h-full relative flex flex-col">
      <div
        ref={wrapperRef}
        onDoubleClick={handleDoubleClick}
        className={`w-full h-full flex-1 flex overflow-auto bg-[#0F1115] rounded-xl border border-line p-2 md:p-4 select-none transition-all ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
      >
        <div
          style={{
            width: canvasWidth * scale,
            height: canvasHeight * scale,
            position: 'relative',
            margin: 'auto',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: canvasWidth,
              height: canvasHeight,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              boxShadow: '0 10px 40px rgba(0,0,0,0.45)',
            }}
          >
            <Stage width={canvasWidth} height={canvasHeight} ref={stageRef}>
              <PosterLayer config={config} layout={layout} />
            </Stage>
          </div>
        </div>
      </div>

      {/* Floating Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-3 bg-panel/90 backdrop-blur border border-line px-3 py-2 rounded-full shadow-xl">
        <button
          onClick={() => {
            setZoomMode('manual')
            setManualZoom((prev) => Math.max(0.1, Number((prev - 0.1).toFixed(2))))
          }}
          className="text-gray-400 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <Minus size={16} />
        </button>

        <button
          onClick={() => {
            setZoomMode('fit')
          }}
          className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
            zoomMode === 'fit'
              ? 'bg-accent text-white'
              : 'bg-panel2 text-gray-300 hover:text-white border border-line'
          }`}
        >
          Fit
        </button>

        <input
          type="range"
          min="0.1"
          max="2.0"
          step="0.05"
          value={scale}
          onChange={(e) => {
            setZoomMode('manual')
            setManualZoom(parseFloat(e.target.value))
          }}
          className="w-16 md:w-24 accent-accent cursor-pointer h-1 bg-line rounded-lg appearance-none"
        />

        <span className="text-[10px] md:text-xs font-semibold text-gray-300 min-w-[36px] text-right">
          {Math.round(scale * 100)}%
        </span>

        <button
          onClick={() => {
            setZoomMode('manual')
            setManualZoom((prev) => Math.min(2.0, Number((prev + 0.1).toFixed(2))))
          }}
          className="text-gray-400 hover:text-white transition-colors"
          title="Zoom In"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}

function PosterLayer({ config, layout }) {
  const { canvasWidth, canvasHeight, header, avatarSlots, promoY, promoSize, logoY, logoSize } = layout
  const [bgImage] = useImage(config.background.dataUrl || undefined, 'anonymous')
  const [logoImage] = useImage(config.logo.dataUrl || undefined, 'anonymous')
  const bgRef = useRef(null)

  useEffect(() => {
    if (bgImage && bgRef.current) {
      bgRef.current.cache()
      bgRef.current.getLayer()?.batchDraw()
    }
  }, [bgImage, config.background.brightness])

  return (
    <Layer>
      {/* Base fill so transparent PNGs / no-background-uploaded states still export clean */}
      <Rect width={canvasWidth} height={canvasHeight} fill="#FFFFFF" />

      {bgImage && (
        <KonvaImage
          ref={bgRef}
          image={bgImage}
          width={canvasWidth}
          height={canvasHeight}
          opacity={config.background.opacity}
          filters={config.background.brightness !== 0 ? [Konva.Filters.Brighten] : []}
          brightness={config.background.brightness / 100}
        />
      )}

      {/* Header text block */}
      <Text
        text={config.mainCaption}
        x={0}
        y={header.mainY}
        width={canvasWidth}
        align="center"
        fontSize={header.mainSize}
        fontFamily="Inter, Arial, sans-serif"
        fontStyle="700"
        fill="#1A1A1A"
      />
      <Text
        text={config.date}
        x={0}
        y={header.dateY}
        width={canvasWidth}
        align="center"
        fontSize={header.dateSize}
        fontFamily="Inter, Arial, sans-serif"
        fill="#5A5A5A"
      />
      <Text
        text={config.secondaryCaption}
        x={0}
        y={header.subY}
        width={canvasWidth}
        align="center"
        fontSize={header.subSize}
        fontFamily="Georgia, serif"
        fontStyle="italic"
        fill="#2E2E2E"
      />

      {/* Avatars — always render every defined slot (placeholder circle if
          no image yet) so it's clear to the user where each role goes */}
      {avatarSlots.map((slot) => (
        <AvatarNode
          key={slot.id}
          x={slot.x}
          y={slot.y}
          size={slot.size}
          label={slot.label}
          dataUrl={slot.dataUrl}
          darken={config.darkenAllAvatars}
        />
      ))}

      {/* Promo message */}
      <Text
        text={config.promoMessage}
        x={40}
        y={promoY}
        width={canvasWidth - 80}
        align="center"
        fontSize={promoSize}
        fontFamily="Inter, Arial, sans-serif"
        fill="#444444"
        lineHeight={1.4}
      />

      {/* Logo */}
      {logoImage ? (
        <KonvaImage
          image={logoImage}
          x={canvasWidth / 2 - logoSize / 2}
          y={logoY}
          width={logoSize}
          height={logoSize}
        />
      ) : (
        <Text
          text={config.logo.fallbackText || ''}
          x={0}
          y={logoY + logoSize / 3}
          width={canvasWidth}
          align="center"
          fontSize={18}
          fontFamily="Inter, Arial, sans-serif"
          fontStyle="600"
          fill="#1A1A1A"
        />
      )}

      {/* Optional photo-frame border, drawn last so it sits on top */}
      {config.frame.enabled && (
        <Rect
          x={config.frame.width / 2}
          y={config.frame.width / 2}
          width={canvasWidth - config.frame.width}
          height={canvasHeight - config.frame.width}
          stroke={config.frame.color}
          strokeWidth={config.frame.width}
          listening={false}
        />
      )}
    </Layer>
  )
}
