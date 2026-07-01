import React, { useEffect, useState, useRef } from 'react'
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group, Transformer } from 'react-konva'
import useImage from 'use-image'
import Konva from 'konva'
import { computeLayout } from '../utils/gridLayouts'
import AvatarNode from './AvatarNode'
import { Plus, Minus } from 'lucide-react'

export default function CanvasPreview({ config, setConfig, stageRef }) {
  const wrapperRef = useRef(null)
  const [autoScale, setAutoScale] = useState(1)
  const [zoomMode, setZoomMode] = useState('fit')
  const [manualZoom, setManualZoom] = useState(1)
  const [selectedId, selectShape] = useState(null)

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
            <Stage
              width={canvasWidth}
              height={canvasHeight}
              ref={stageRef}
              onMouseDown={(e) => {
                if (e.target === e.target.getStage()) {
                  selectShape(null)
                }
              }}
              onTouchStart={(e) => {
                if (e.target === e.target.getStage()) {
                  selectShape(null)
                }
              }}
            >
              <PosterLayer
                config={config}
                setConfig={setConfig}
                layout={layout}
                selectedId={selectedId}
                selectShape={selectShape}
              />
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

function PosterLayer({ config, setConfig, layout, selectedId, selectShape }) {
  const { canvasWidth, canvasHeight, header, avatarSlots, promoY, promoSize, logoY, logoSize } = layout
  const [bgImage] = useImage(config.background.dataUrl || undefined, 'anonymous')
  const [logoImage] = useImage(config.logo.dataUrl || undefined, 'anonymous')
  const bgRef = useRef(null)

  const logoGroupRef = useRef(null)
  const mainCaptionRef = useRef(null)
  const dateRef = useRef(null)
  const secondaryCaptionRef = useRef(null)
  const promoMessageRef = useRef(null)
  const avatarRefs = useRef({})
  const transformerRef = useRef(null)

  useEffect(() => {
    if (bgImage && bgRef.current) {
      bgRef.current.cache()
      bgRef.current.getLayer()?.batchDraw()
    }
  }, [bgImage, config.background.brightness])

  useEffect(() => {
    if (!transformerRef.current) return

    let targetNode = null
    if (selectedId === 'logo') {
      targetNode = logoGroupRef.current
    } else if (selectedId === 'mainCaption') {
      targetNode = mainCaptionRef.current
    } else if (selectedId === 'date') {
      targetNode = dateRef.current
    } else if (selectedId === 'secondaryCaption') {
      targetNode = secondaryCaptionRef.current
    } else if (selectedId === 'promoMessage') {
      targetNode = promoMessageRef.current
    } else if (selectedId && avatarRefs.current[selectedId]) {
      targetNode = avatarRefs.current[selectedId]
    }

    if (targetNode) {
      transformerRef.current.nodes([targetNode])
      transformerRef.current.getLayer()?.batchDraw()
    } else {
      transformerRef.current.nodes([])
    }
  }, [
    selectedId,
    config.logo,
    config.mainCaption,
    config.date,
    config.secondaryCaption,
    config.promoMessage,
    config.family,
    config.friends
  ])

  const updateLogoState = (newFields) => {
    if (!setConfig) return
    setConfig((prev) => ({
      ...prev,
      logo: {
        ...prev.logo,
        ...newFields,
      },
    }))
  }

  const updateCaptionState = (key, newFields) => {
    if (!setConfig) return
    setConfig((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        ...newFields,
      },
    }))
  }

  const updateAvatarPosition = (category, id, newFields) => {
    if (!setConfig) return
    setConfig((prev) => {
      if (category === 'friends') {
        const nextList = prev.friends.list.map((item) =>
          item.id === id ? { ...item, ...newFields } : item
        )
        return {
          ...prev,
          friends: {
            ...prev.friends,
            list: nextList,
          },
        }
      } else {
        const nextGroup = prev.family[category].map((item) =>
          item.id === id ? { ...item, ...newFields } : item
        )
        return {
          ...prev,
          family: {
            ...prev.family,
            [category]: nextGroup,
          },
        }
      }
    })
  }

  const logoScaleX = config.logo.scaleX !== undefined ? config.logo.scaleX : 1
  const logoScaleY = config.logo.scaleY !== undefined ? config.logo.scaleY : 1

  // Calculate dynamic boundaries so that the logo stays fully visible on screen
  const logoHalfWidth = (logoImage ? logoSize : 300) * logoScaleX / 2
  const logoHalfHeight = (logoImage ? logoSize : 24) * logoScaleY / 2

  const logoX = config.logo.x !== undefined 
    ? Math.max(logoHalfWidth, Math.min(canvasWidth - logoHalfWidth, config.logo.x)) 
    : canvasWidth / 2

  const logoYCoord = config.logo.y !== undefined 
    ? Math.max(logoHalfHeight, Math.min(canvasHeight - logoHalfHeight, config.logo.y)) 
    : logoY + logoSize / 2

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
        ref={mainCaptionRef}
        text={config.mainCaption.text}
        x={config.mainCaption.x ?? 0}
        y={Math.min(config.mainCaption.y ?? header.mainY, canvasHeight - 40)}
        scaleX={config.mainCaption.scaleX || 1}
        scaleY={config.mainCaption.scaleY || 1}
        width={canvasWidth}
        align="center"
        fontSize={header.mainSize}
        fontFamily="Inter, Arial, sans-serif"
        fontStyle="700"
        fill="#1A1A1A"
        draggable
        onClick={() => selectShape('mainCaption')}
        onTap={() => selectShape('mainCaption')}
        onDragEnd={(e) => {
          const node = e.target
          updateCaptionState('mainCaption', { x: node.x(), y: node.y() })
        }}
        onTransformEnd={(e) => {
          const node = e.target
          updateCaptionState('mainCaption', {
            x: node.x(),
            y: node.y(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
          })
        }}
      />
      <Text
        ref={dateRef}
        text={config.date.text}
        x={config.date.x ?? 0}
        y={Math.min(config.date.y ?? header.dateY, canvasHeight - 40)}
        scaleX={config.date.scaleX || 1}
        scaleY={config.date.scaleY || 1}
        width={canvasWidth}
        align="center"
        fontSize={header.dateSize}
        fontFamily="Inter, Arial, sans-serif"
        fill="#5A5A5A"
        draggable
        onClick={() => selectShape('date')}
        onTap={() => selectShape('date')}
        onDragEnd={(e) => {
          const node = e.target
          updateCaptionState('date', { x: node.x(), y: node.y() })
        }}
        onTransformEnd={(e) => {
          const node = e.target
          updateCaptionState('date', {
            x: node.x(),
            y: node.y(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
          })
        }}
      />
      <Text
        ref={secondaryCaptionRef}
        text={config.secondaryCaption.text}
        x={config.secondaryCaption.x ?? 0}
        y={Math.min(config.secondaryCaption.y ?? header.subY, canvasHeight - 40)}
        scaleX={config.secondaryCaption.scaleX || 1}
        scaleY={config.secondaryCaption.scaleY || 1}
        width={canvasWidth}
        align="center"
        fontSize={header.subSize}
        fontFamily="Georgia, serif"
        fontStyle="italic"
        fill="#2E2E2E"
        draggable
        onClick={() => selectShape('secondaryCaption')}
        onTap={() => selectShape('secondaryCaption')}
        onDragEnd={(e) => {
          const node = e.target
          updateCaptionState('secondaryCaption', { x: node.x(), y: node.y() })
        }}
        onTransformEnd={(e) => {
          const node = e.target
          updateCaptionState('secondaryCaption', {
            x: node.x(),
            y: node.y(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
          })
        }}
      />

      {/* Avatars — always render every defined slot (placeholder circle if
          no image yet) so it's clear to the user where each role goes */}
      {avatarSlots.map((slot) => {
        const calculatedGridX = slot.x
        const calculatedGridY = slot.y

        const avatarX = slot.customX ?? calculatedGridX
        const avatarY = slot.customY ?? calculatedGridY
        const avatarScaleX = slot.scaleX ?? 1
        const avatarScaleY = slot.scaleY ?? 1

        return (
          <Group
            key={slot.id}
            ref={(node) => {
              if (node) {
                avatarRefs.current[slot.id] = node
              } else {
                delete avatarRefs.current[slot.id]
              }
            }}
            draggable
            x={avatarX}
            y={avatarY}
            scaleX={avatarScaleX}
            scaleY={avatarScaleY}
            onClick={() => selectShape(slot.id)}
            onTap={() => selectShape(slot.id)}
            onDragEnd={(e) => {
              const node = e.target
              updateAvatarPosition(slot.category, slot.id, {
                customX: node.x(),
                customY: node.y(),
              })
            }}
            onTransformEnd={(e) => {
              const node = e.target
              updateAvatarPosition(slot.category, slot.id, {
                customX: node.x(),
                customY: node.y(),
                scaleX: node.scaleX(),
                scaleY: node.scaleY(),
              })
            }}
          >
            <AvatarNode
              x={0}
              y={0}
              size={slot.size}
              label={slot.label}
              dataUrl={slot.dataUrl}
              darken={config.darkenAllAvatars}
              shape={slot.shape || 'circle'}
            />
          </Group>
        )
      })}

      {/* Promo message */}
      <Text
        ref={promoMessageRef}
        text={config.promoMessage.text}
        x={config.promoMessage.x ?? 40}
        y={Math.min(config.promoMessage.y ?? promoY, canvasHeight - 40)}
        scaleX={config.promoMessage.scaleX || 1}
        scaleY={config.promoMessage.scaleY || 1}
        width={canvasWidth - 80}
        align="center"
        fontSize={promoSize}
        fontFamily="Inter, Arial, sans-serif"
        fill="#444444"
        lineHeight={1.4}
        draggable
        onClick={() => selectShape('promoMessage')}
        onTap={() => selectShape('promoMessage')}
        onDragEnd={(e) => {
          const node = e.target
          updateCaptionState('promoMessage', { x: node.x(), y: node.y() })
        }}
        onTransformEnd={(e) => {
          const node = e.target
          updateCaptionState('promoMessage', {
            x: node.x(),
            y: node.y(),
            scaleX: node.scaleX(),
            scaleY: node.scaleY(),
          })
        }}
      />

      {/* Draggable Logo Group */}
      <Group
        ref={logoGroupRef}
        draggable
        x={logoX}
        y={logoYCoord}
        scaleX={logoScaleX}
        scaleY={logoScaleY}
        onClick={() => selectShape('logo')}
        onTap={() => selectShape('logo')}
        onDragEnd={(e) => {
          const node = e.target
          updateLogoState({
            x: node.x(),
            y: node.y(),
          })
        }}
        onTransformEnd={(e) => {
          const node = e.target
          // Read scale values applied by Transformer
          const scaleX = node.scaleX()
          const scaleY = node.scaleY()
          updateLogoState({
            x: node.x(),
            y: node.y(),
            scaleX: scaleX,
            scaleY: scaleY,
          })
        }}
      >
        {logoImage ? (
          <KonvaImage
            image={logoImage}
            x={-logoSize / 2}
            y={-logoSize / 2}
            width={logoSize}
            height={logoSize}
          />
        ) : (
          <Text
            text={config.logo.fallbackText || ''}
            x={-150}
            y={-12}
            width={300}
            align="center"
            fontSize={18}
            fontFamily="Inter, Arial, sans-serif"
            fontStyle="600"
            fill="#1A1A1A"
          />
        )}
      </Group>

      {/* Attach Transformer conditionally */}
      {selectedId && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
              return oldBox
            }
            return newBox
          }}
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
