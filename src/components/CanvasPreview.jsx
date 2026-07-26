import React, { useEffect, useLayoutEffect, useState, useRef } from 'react'
import { Stage, Layer, Rect, Text, Image as KonvaImage, Group, Transformer } from 'react-konva'
import useImage from 'use-image'
import Konva from 'konva'
import { computeLayout } from '../utils/gridLayouts'
import AvatarNode from './AvatarNode'
import { Plus, Minus } from 'lucide-react'

export default function CanvasPreview({ config, setConfig, stageRef, selectedId, selectShape, croppingId, setCroppingId }) {
  const wrapperRef = useRef(null)
  const [autoScale, setAutoScale] = useState(1)
  const [zoomMode, setZoomMode] = useState('fit')
  const [manualZoom, setManualZoom] = useState(1)

  const handleSelectShape = (id) => {
    selectShape(id)
    if (id !== croppingId && setCroppingId) {
      setCroppingId(null)
    }
  }

  const checkDeselect = (e) => {
    const target = e.target

    if (target.findAncestor('Transformer', true)) {
      return
    }
    if (target.getParent()?.className === 'Transformer') {
      return
    }

    const clickedOnEmpty = target === target.getStage() || target.name() === 'background'
    if (clickedOnEmpty) {
      handleSelectShape(null)
    }
  }

  const handleStageDblClick = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage() || e.target.name() === 'background'
    if (clickedOnEmpty) {
      setZoomMode((prevMode) => {
        if (prevMode === 'fit') {
          setManualZoom(1.0)
          return 'manual'
        } else {
          return 'fit'
        }
      })
    }
  }

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
              onMouseDown={checkDeselect}
              onTouchStart={checkDeselect}
              onDblClick={handleStageDblClick}
              onDblTap={handleStageDblClick}
            >
              <PosterLayer
                config={config}
                setConfig={setConfig}
                layout={layout}
                selectedId={selectedId}
                selectShape={handleSelectShape}
                croppingId={croppingId}
                setCroppingId={setCroppingId}
                scale={scale}
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

function PosterLayer({ config, setConfig, layout, selectedId, selectShape, croppingId, setCroppingId, scale = 1 }) {
  const { canvasWidth, canvasHeight, header, avatarSlots, promoY, promoSize, logoY, logoSize } = layout
  const [bgImage] = useImage(config.background.dataUrl || undefined, 'anonymous')
  const [logoImage] = useImage(config.logo.dataUrl || undefined, 'anonymous')
  const bgRef = useRef(null)

  const logoGroupRef = useRef(null)
  const mottoRef = useRef(null)
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

  // Auto-center text captions around their X position by setting offsetX = width / 2
  useLayoutEffect(() => {
    const captionRefs = [
      mainCaptionRef.current,
      dateRef.current,
      secondaryCaptionRef.current,
      promoMessageRef.current,
      mottoRef.current,
      ...Object.values(avatarRefs.current),
    ]
    captionRefs.forEach((node) => {
      if (node) {
        node.offsetX(node.width() / 2)
      }
    })
  })

  useEffect(() => {
    if (!transformerRef.current) return

    let targetNode = null
    if (selectedId === 'logo' && config.logo.enabled !== false) {
      targetNode = logoGroupRef.current
    } else if (selectedId === 'motto' && config.motto.enabled !== false) {
      targetNode = mottoRef.current
    } else if (selectedId === 'mainCaption' && config.mainCaption.enabled !== false) {
      targetNode = mainCaptionRef.current
    } else if (selectedId === 'date' && config.date.enabled !== false) {
      targetNode = dateRef.current
    } else if (selectedId === 'secondaryCaption' && config.secondaryCaption.enabled !== false) {
      targetNode = secondaryCaptionRef.current
    } else if (selectedId === 'promoMessage' && config.promoMessage.enabled !== false) {
      targetNode = promoMessageRef.current
    } else if (selectedId && avatarRefs.current[selectedId] && croppingId !== selectedId) {
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
    croppingId,
    config.logo,
    config.motto,
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
    : logoY + logoSize / 2 - (config.motto.enabled !== false ? 15 : 0)

  const mottoX = config.motto.x !== undefined
    ? config.motto.x
    : canvasWidth / 2

  const mottoYCoord = config.motto.y !== undefined
    ? config.motto.y
    : logoYCoord + (logoImage ? logoSize / 2 + 15 : 30)

  const dynamicTouchTolerance = Math.max(40, 40 / (scale || 1))
  const dynamicAnchorSize = Math.max(12, 18 / (scale || 1))

  return (
    <Layer>
      {/* Base fill so transparent PNGs / no-background-uploaded states still export clean */}
      <Rect name="background" width={canvasWidth} height={canvasHeight} fill="#FFFFFF" />

      {bgImage && (
        <KonvaImage
          ref={bgRef}
          name="background"
          image={bgImage}
          width={canvasWidth}
          height={canvasHeight}
          opacity={config.background.opacity}
          filters={config.background.brightness !== 0 ? [Konva.Filters.Brighten] : []}
          brightness={config.background.brightness / 100}
        />
      )}

      {/* Header text block */}
      {config.mainCaption.enabled !== false && (
        <Text
          ref={(node) => {
            mainCaptionRef.current = node
            if (node) node.offsetX(node.width() / 2)
          }}
          text={config.mainCaption.text}
          x={config.mainCaption.x ?? (canvasWidth / 2)}
          y={Math.min(config.mainCaption.y ?? header.mainY, canvasHeight - 40)}
          scaleX={config.mainCaption.scaleX || 1}
          scaleY={config.mainCaption.scaleY || 1}
          align="center"
          fontSize={config.mainCaption.fontSize || 40}
          fontFamily={config.mainCaption.fontFamily || 'Arial'}
          fontStyle={config.mainCaption.fontStyle || 'bold'}
          fill={config.mainCaption.fill || '#1A1A1A'}
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
      )}
      {config.date.enabled !== false && (
        <Text
          ref={(node) => {
            dateRef.current = node
            if (node) node.offsetX(node.width() / 2)
          }}
          text={config.date.text}
          x={config.date.x ?? (canvasWidth / 2)}
          y={Math.min(config.date.y ?? header.dateY, canvasHeight - 40)}
          scaleX={config.date.scaleX || 1}
          scaleY={config.date.scaleY || 1}
          align="center"
          fontSize={config.date.fontSize || 20}
          fontFamily={config.date.fontFamily || 'Arial'}
          fontStyle={config.date.fontStyle || 'normal'}
          fill={config.date.fill || '#5A5A5A'}
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
      )}
      {config.secondaryCaption.enabled !== false && (
        <Text
          ref={(node) => {
            secondaryCaptionRef.current = node
            if (node) node.offsetX(node.width() / 2)
          }}
          text={config.secondaryCaption.text}
          x={config.secondaryCaption.x ?? (canvasWidth / 2)}
          y={Math.min(config.secondaryCaption.y ?? header.subY, canvasHeight - 40)}
          scaleX={config.secondaryCaption.scaleX || 1}
          scaleY={config.secondaryCaption.scaleY || 1}
          align="center"
          fontSize={config.secondaryCaption.fontSize || 30}
          fontFamily={config.secondaryCaption.fontFamily || 'Arial'}
          fontStyle={config.secondaryCaption.fontStyle || 'italic'}
          fill={config.secondaryCaption.fill || '#2E2E2E'}
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
      )}

      {/* Avatars — always render every defined slot (placeholder circle if
          no image yet) so it's clear to the user where each role goes */}
      {avatarSlots.map((slot) => {
        const calculatedGridX = slot.x
        const calculatedGridY = slot.y

        const avatarX = slot.customX ?? calculatedGridX
        const avatarY = slot.customY ?? calculatedGridY
        const avatarScaleX = slot.scaleX ?? 1
        const avatarScaleY = slot.scaleY ?? 1

        const circleX = (slot.circleX !== undefined && slot.circleX !== null) ? slot.circleX : 0
        const circleY = (slot.circleY !== undefined && slot.circleY !== null) ? slot.circleY : 0
        const shapeBottomY = slot.shape === 'oval' ? (slot.size * 0.9) : slot.size
        const labelX = (slot.labelX !== undefined && slot.labelX !== null) ? slot.labelX : slot.size / 2
        const labelY = (slot.labelY !== undefined && slot.labelY !== null) ? slot.labelY : (shapeBottomY + 8)

        return (
          <Group
            key={slot.id}
            x={avatarX}
            y={avatarY}
            scaleX={avatarScaleX}
            scaleY={avatarScaleY}
          >
            {/* Draggable Circle Node */}
            {slot.circleEnabled !== false && (
              <Group
                ref={(node) => {
                  if (node) {
                    avatarRefs.current[slot.id] = node
                  } else {
                    delete avatarRefs.current[slot.id]
                  }
                }}
                x={circleX}
                y={circleY}
                scaleX={slot.circleScaleX ?? 1}
                scaleY={slot.circleScaleY ?? 1}
                draggable={croppingId !== slot.id}
                onClick={() => selectShape(slot.id)}
                onTap={() => selectShape(slot.id)}
                onDblClick={() => {
                  if (slot.dataUrl && setCroppingId) {
                    setCroppingId(croppingId === slot.id ? null : slot.id)
                  }
                }}
                onDblTap={() => {
                  if (slot.dataUrl && setCroppingId) {
                    setCroppingId(croppingId === slot.id ? null : slot.id)
                  }
                }}
                onDragEnd={(e) => {
                  const node = e.target
                  updateAvatarPosition(slot.category, slot.id, {
                    circleX: node.x(),
                    circleY: node.y(),
                  })
                }}
                onTransformEnd={(e) => {
                  const node = e.target
                  updateAvatarPosition(slot.category, slot.id, {
                    circleX: node.x(),
                    circleY: node.y(),
                    circleScaleX: node.scaleX(),
                    circleScaleY: node.scaleY(),
                  })
                }}
              >
                <AvatarNode
                  x={0}
                  y={0}
                  size={slot.size}
                  dataUrl={slot.dataUrl}
                  opacity={slot.opacity !== undefined ? slot.opacity : 100}
                  brightness={slot.brightness !== undefined ? slot.brightness : 0}
                  stroke={slot.stroke || '#000000'}
                  fillEnabled={slot.fillEnabled !== false}
                  shape={slot.shape || 'circle'}
                  photoX={slot.photoX !== undefined ? slot.photoX : 0}
                  photoY={slot.photoY !== undefined ? slot.photoY : 0}
                  isCropping={croppingId === slot.id}
                  onPhotoDragEnd={(newPos) => {
                    updateAvatarPosition(slot.category, slot.id, newPos)
                  }}
                />
              </Group>
            )}

            {/* Draggable Label Node */}
            {slot.labelEnabled !== false && slot.label && (
              <Text
                ref={(node) => {
                  if (node) {
                    avatarRefs.current[slot.id + '-label'] = node
                    node.offsetX(node.width() / 2)
                  } else {
                    delete avatarRefs.current[slot.id + '-label']
                  }
                }}
                x={labelX}
                y={labelY}
                scaleX={slot.labelScaleX ?? 1}
                scaleY={slot.labelScaleY ?? 1}
                text={slot.label}
                align="center"
                fontSize={slot.fontSize || 16}
                fontFamily={slot.fontFamily || 'Arial'}
                fontStyle={slot.fontStyle || 'normal'}
                fill={slot.fill || '#2A2A2A'}
                draggable
                onClick={() => selectShape(slot.id + '-label')}
                onTap={() => selectShape(slot.id + '-label')}
                onDragEnd={(e) => {
                  const node = e.target
                  updateAvatarPosition(slot.category, slot.id, {
                    labelX: node.x(),
                    labelY: node.y(),
                  })
                }}
                onTransformEnd={(e) => {
                  const node = e.target
                  node.offsetX(node.width() / 2)
                  updateAvatarPosition(slot.category, slot.id, {
                    labelX: node.x(),
                    labelY: node.y(),
                    labelScaleX: node.scaleX(),
                    labelScaleY: node.scaleY(),
                  })
                }}
              />
            )}
          </Group>
        )
      })}

      {/* Promo message */}
      {config.promoMessage.enabled !== false && (
        <Text
          ref={(node) => {
            promoMessageRef.current = node
            if (node) node.offsetX(node.width() / 2)
          }}
          text={config.promoMessage.text}
          x={config.promoMessage.x ?? (canvasWidth / 2)}
          y={Math.min(config.promoMessage.y ?? promoY, canvasHeight - 40)}
          scaleX={config.promoMessage.scaleX || 1}
          scaleY={config.promoMessage.scaleY || 1}
          align="center"
          fontSize={config.promoMessage.fontSize || 20}
          fontFamily={config.promoMessage.fontFamily || 'Arial'}
          fontStyle={config.promoMessage.fontStyle || 'normal'}
          fill={config.promoMessage.fill || '#444444'}
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
      )}

      {/* Draggable Logo Group */}
      {config.logo.enabled !== false && (
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
              ref={(node) => {
                if (node) node.offsetX(node.width() / 2)
              }}
              text="Your Logo"
              x={0}
              y={-12}
              align="center"
              fontSize={18}
              fontFamily="Inter, Arial, sans-serif"
              fontStyle="600"
              fill="#1A1A1A"
              opacity={0.4}
            />
          )}
        </Group>
      )}

      {/* Draggable Motto Text */}
      {config.motto.enabled !== false && (
        <Text
          ref={(node) => {
            mottoRef.current = node
            if (node) node.offsetX(node.width() / 2)
          }}
          text={config.motto.text}
          x={mottoX}
          y={mottoYCoord}
          scaleX={config.motto.scaleX ?? 1}
          scaleY={config.motto.scaleY ?? 1}
          fontSize={config.motto.fontSize ?? 18}
          fontFamily={config.motto.fontFamily ?? 'Arial'}
          fontStyle={config.motto.fontStyle ?? 'normal'}
          fill={config.motto.fill ?? '#1A1A1A'}
          align="center"
          draggable
          onClick={() => selectShape('motto')}
          onTap={() => selectShape('motto')}
          onDragEnd={(e) => {
            const node = e.target
            updateCaptionState('motto', {
              x: node.x(),
              y: node.y(),
            })
          }}
          onTransformEnd={(e) => {
            const node = e.target
            updateCaptionState('motto', {
              x: node.x(),
              y: node.y(),
              scaleX: node.scaleX(),
              scaleY: node.scaleY(),
            })
          }}
        />
      )}

      {/* Attach Transformer conditionally */}
      {selectedId && (
        <Transformer
          ref={transformerRef}
          anchorSize={dynamicAnchorSize}
          anchorCornerRadius={4}
          touchAnchorTolerance={dynamicTouchTolerance}
          enabledAnchors={[
            'top-left',
            'top-center',
            'top-right',
            'middle-right',
            'bottom-right',
            'bottom-center',
            'bottom-left',
            'middle-left',
          ]}
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
