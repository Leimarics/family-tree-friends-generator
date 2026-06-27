import React, { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Text, Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import Konva from 'konva'
import { Download } from 'lucide-react'
import { computeLayout } from '../utils/gridLayouts'
import AvatarNode from './AvatarNode'

export default function CanvasPreview({ config }) {
  const stageRef = useRef(null)
  const wrapperRef = useRef(null)
  const [scale, setScale] = useState(1)
  const [exportFormat, setExportFormat] = useState('png')
  const [isExporting, setIsExporting] = useState(false)

  const layout = computeLayout(config)
  const { canvasWidth, canvasHeight } = layout

  // Keep the on-screen preview scaled to fit its container, while the
  // Stage itself always renders at full native resolution -- this is what
  // keeps exports crisp regardless of how small the preview looks on screen.
  useEffect(() => {
    function recalc() {
      if (!wrapperRef.current) return
      const available = wrapperRef.current.clientWidth - 32
      const next = Math.min(1, available / canvasWidth)
      setScale(next > 0 ? next : 1)
    }
    recalc()
    window.addEventListener('resize', recalc)
    return () => window.removeEventListener('resize', recalc)
  }, [canvasWidth])

  const handleExport = () => {
    setIsExporting(true)
    // Defer one tick so any pending filter caching settles before capture.
    requestAnimationFrame(() => {
      const uri = stageRef.current.toDataURL({
        pixelRatio: 3,
        mimeType: exportFormat === 'jpeg' ? 'image/jpeg' : 'image/png',
        quality: 0.95,
      })
      const link = document.createElement('a')
      const safeName = (config.secondaryCaption || config.template || 'poster').replace(/[^a-z0-9]+/gi, '-')
      link.download = `${safeName}-${Date.now()}.${exportFormat === 'jpeg' ? 'jpg' : 'png'}`
      link.href = uri
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setIsExporting(false)
    })
  }

  return (
    <div className="flex flex-col items-center w-full h-full">
      <div className="flex items-center gap-3 mb-4 flex-wrap justify-center">
        <select
          value={exportFormat}
          onChange={(e) => setExportFormat(e.target.value)}
          className="bg-panel2 border border-line text-sm rounded-md px-3 py-2 text-gray-200"
        >
          <option value="png">PNG (best quality)</option>
          <option value="jpeg">JPEG (smaller file)</option>
        </select>
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 bg-accent hover:bg-accentDim transition-colors text-white px-5 py-2 rounded-md font-medium shadow-lg shadow-accent/20 disabled:opacity-60"
        >
          <Download size={18} />
          {isExporting ? 'Preparing…' : 'Export & Download'}
        </button>
      </div>

      <div
        ref={wrapperRef}
        className="w-full flex-1 flex items-center justify-center overflow-auto bg-[#0F1115] rounded-xl border border-line p-4"
      >
        <div
          style={{
            width: canvasWidth * scale,
            height: canvasHeight * scale,
          }}
        >
          <div
            style={{
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
