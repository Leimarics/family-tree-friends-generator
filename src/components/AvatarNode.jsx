import React, { useEffect, useRef } from 'react'
import { Group, Image as KonvaImage, Text, Circle } from 'react-konva'
import useImage from 'use-image'
import Konva from 'konva'

/**
 * Renders one avatar: center-cropped to a square (so non-square uploads
 * don't squish), clipped to a circle, with an optional darken filter and a
 * label underneath.
 *
 * Note on the circle: Konva's plain Image node has no native corner-radius,
 * so we clip a Group instead -- that's the reliable way to get a circular
 * avatar that still exports cleanly to PNG/JPEG.
 */
export default function AvatarNode({ x, y, size, label, dataUrl, darken, darkenAmount = -45 }) {
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
      imgRef.current.cache()
      imgRef.current.getLayer()?.batchDraw()
    }
  }, [image, darken, darkenAmount])

  return (
    <Group x={x} y={y}>
      {image ? (
        <Group
          clipFunc={(ctx) => {
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2, false)
          }}
        >
          <KonvaImage
            ref={imgRef}
            image={image}
            crop={crop}
            width={size}
            height={size}
            filters={darken ? [Konva.Filters.Brighten, Konva.Filters.Contrast] : []}
            brightness={darken ? darkenAmount / 100 : 0}
            contrast={darken ? 15 : 0}
          />
        </Group>
      ) : (
        // Empty-slot placeholder so the layout still reads clearly before
        // an avatar is uploaded.
        <Circle
          x={size / 2}
          y={size / 2}
          radius={size / 2}
          fill="#E2E5EA"
          stroke="#B8BEC8"
          strokeWidth={2}
          dash={[8, 6]}
        />
      )}

      {/* Thin white ring so avatars read as deliberate portraits, not floating cutouts */}
      <Circle
        x={size / 2}
        y={size / 2}
        radius={size / 2}
        stroke="#ffffff"
        strokeWidth={Math.max(3, size * 0.025)}
        shadowColor="black"
        shadowBlur={10}
        shadowOpacity={0.25}
        listening={false}
      />

      {label ? (
        <Text
          text={label}
          x={-20}
          y={size + 8}
          width={size + 40}
          align="center"
          fontSize={Math.max(14, size * 0.13)}
          fontFamily="Inter, Arial, sans-serif"
          fill="#2A2A2A"
        />
      ) : null}
    </Group>
  )
}
