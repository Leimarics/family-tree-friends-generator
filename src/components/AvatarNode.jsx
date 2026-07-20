import React, { useEffect, useRef } from 'react'
import { Group, Image as KonvaImage, Text, Circle, Rect, Ellipse } from 'react-konva'
import useImage from 'use-image'
import Konva from 'konva'

/**
 * Renders one avatar: center-cropped to a square (so non-square uploads
 * don't squish), clipped to the chosen shape, with an optional darken filter and a
 * label underneath.
 *
 * Note on the shape clip: Konva's plain Image node has no native corner-radius,
 * so we clip a Group instead -- that's the reliable way to get custom avatar
 * shapes that still export cleanly to PNG/JPEG.
 */
export default function AvatarNode({ x, y, size, label, dataUrl, opacity = 100, brightness = 0, fontFamily = 'Arial', fontSize = 16, fill = '#2A2A2A', fontStyle = 'normal', stroke = '#000000', fillEnabled = true, shape = 'circle', photoX = 0, photoY = 0, isCropping = false, onPhotoDragEnd }) {
  const [image] = useImage(dataUrl || undefined, 'anonymous')
  const imgRef = useRef(null)

  // Center-crop to a square based on the image's natural dimensions, so a
  // tall or wide photo doesn't get stretched into an oval.
  const crop = (() => {
    if (!image) return undefined
    const side = Math.min(image.width, image.height)
    return {
      x: (image.width - side) / 2,
      y: (image.height - side) / 2,
      width: side,
      height: side,
    }
  })()

  // Filters require the node to be re-cached whenever the image or filter
  // settings change, otherwise Konva just ignores them silently.
  useEffect(() => {
    if (image && imgRef.current) {
      imgRef.current.clearCache()
      imgRef.current.cache()
      imgRef.current.getLayer()?.batchDraw()
    }
  }, [image, opacity, brightness, photoX, photoY])

  const clipFunc = (ctx) => {
    if (shape === 'square') {
      ctx.rect(0, 0, size, size)
    } else if (shape === 'rounded') {
      const r = Math.max(4, size * 0.125)
      ctx.beginPath()
      ctx.moveTo(r, 0)
      ctx.lineTo(size - r, 0)
      ctx.quadraticCurveTo(size, 0, size, r)
      ctx.lineTo(size, size - r)
      ctx.quadraticCurveTo(size, size, size - r, size)
      ctx.lineTo(r, size)
      ctx.quadraticCurveTo(0, size, 0, size - r)
      ctx.lineTo(0, r)
      ctx.quadraticCurveTo(0, 0, r, 0)
      ctx.closePath()
    } else if (shape === 'oval') {
      ctx.ellipse(size / 2, size / 2, size / 2, size / 2.5, 0, 0, Math.PI * 2)
    } else {
      // circle
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, false)
    }
  }

  const renderPlaceholder = () => {
    const placeholderFill = fillEnabled ? '#E2E5EA' : 'transparent'
    const placeholderStroke = fillEnabled ? '#B8BEC8' : stroke
    const placeholderStrokeWidth = fillEnabled ? 2 : 2
    const placeholderDash = fillEnabled ? [8, 6] : null

    if (shape === 'square') {
      return (
        <Rect
          x={0}
          y={0}
          width={size}
          height={size}
          fill={placeholderFill}
          stroke={placeholderStroke}
          strokeWidth={placeholderStrokeWidth}
          dash={placeholderDash}
        />
      )
    }
    if (shape === 'rounded') {
      const r = Math.max(4, size * 0.125)
      return (
        <Rect
          x={0}
          y={0}
          width={size}
          height={size}
          cornerRadius={r}
          fill={placeholderFill}
          stroke={placeholderStroke}
          strokeWidth={placeholderStrokeWidth}
          dash={placeholderDash}
        />
      )
    }
    if (shape === 'oval') {
      return (
        <Ellipse
          x={size / 2}
          y={size / 2}
          radiusX={size / 2}
          radiusY={size / 2.5}
          fill={placeholderFill}
          stroke={placeholderStroke}
          strokeWidth={placeholderStrokeWidth}
          dash={placeholderDash}
        />
      )
    }
    return (
      <Circle
        x={size / 2}
        y={size / 2}
        radius={size / 2}
        fill={placeholderFill}
        stroke={placeholderStroke}
        strokeWidth={placeholderStrokeWidth}
        dash={placeholderDash}
      />
    )
  }

  const renderBorderRing = () => {
    if (isCropping) {
      if (shape === 'square') {
        return (
          <Rect
            x={0}
            y={0}
            width={size}
            height={size}
            stroke="#3D7BFF"
            strokeWidth={3}
            dash={[4, 4]}
            listening={false}
          />
        )
      }
      if (shape === 'rounded') {
        const r = Math.max(4, size * 0.125)
        return (
          <Rect
            x={0}
            y={0}
            width={size}
            height={size}
            cornerRadius={r}
            stroke="#3D7BFF"
            strokeWidth={3}
            dash={[4, 4]}
            listening={false}
          />
        )
      }
      if (shape === 'oval') {
        return (
          <Ellipse
            x={size / 2}
            y={size / 2}
            radiusX={size / 2}
            radiusY={size / 2.5}
            stroke="#3D7BFF"
            strokeWidth={3}
            dash={[4, 4]}
            listening={false}
          />
        )
      }
      return (
        <Circle
          x={size / 2}
          y={size / 2}
          radius={size / 2}
          stroke="#3D7BFF"
          strokeWidth={3}
          dash={[4, 4]}
          listening={false}
        />
      )
    }

    const ringStroke = stroke
    const ringStrokeWidth = fillEnabled ? Math.max(3, size * 0.025) : 2

    if (shape === 'square') {
      return (
        <Rect
          x={0}
          y={0}
          width={size}
          height={size}
          stroke={ringStroke}
          strokeWidth={ringStrokeWidth}
          shadowColor="black"
          shadowBlur={10}
          shadowOpacity={0.25}
          listening={false}
        />
      )
    }
    if (shape === 'rounded') {
      const r = Math.max(4, size * 0.125)
      return (
        <Rect
          x={0}
          y={0}
          width={size}
          height={size}
          cornerRadius={r}
          stroke={ringStroke}
          strokeWidth={ringStrokeWidth}
          shadowColor="black"
          shadowBlur={10}
          shadowOpacity={0.25}
          listening={false}
        />
      )
    }
    if (shape === 'oval') {
      return (
        <Ellipse
          x={size / 2}
          y={size / 2}
          radiusX={size / 2}
          radiusY={size / 2.5}
          stroke={ringStroke}
          strokeWidth={ringStrokeWidth}
          shadowColor="black"
          shadowBlur={10}
          shadowOpacity={0.25}
          listening={false}
        />
      )
    }
    return (
      <Circle
        x={size / 2}
        y={size / 2}
        radius={size / 2}
        stroke={ringStroke}
        strokeWidth={ringStrokeWidth}
        shadowColor="black"
        shadowBlur={10}
        shadowOpacity={0.25}
        listening={false}
      />
    )
  }

  const shapeBottomY = shape === 'oval' ? (size * 0.9) : size
  const labelY = shapeBottomY + 8

  return (
    <Group x={x} y={y}>
      {image ? (
        <Group clipFunc={clipFunc}>
          <KonvaImage
            ref={imgRef}
            image={image}
            crop={crop}
            x={photoX}
            y={photoY}
            width={size}
            height={size}
            opacity={opacity / 100}
            filters={brightness !== 0 ? [Konva.Filters.Brighten] : []}
            brightness={brightness / 100}
            draggable={isCropping}
            onDragStart={(e) => {
              e.cancelBubble = true
            }}
            onDragEnd={(e) => {
              e.cancelBubble = true
              if (onPhotoDragEnd) {
                onPhotoDragEnd({
                  photoX: e.target.x(),
                  photoY: e.target.y(),
                })
              }
            }}
          />
        </Group>
      ) : (
        renderPlaceholder()
      )}

      {renderBorderRing()}

      {label ? (
        <Text
          text={label}
          x={-20}
          y={labelY}
          width={size + 40}
          align="center"
          fontSize={fontSize}
          fontFamily={fontFamily}
          fontStyle={fontStyle}
          fill={fill || '#2A2A2A'}
        />
      ) : null}
    </Group>
  )
}
