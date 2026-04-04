import { useEffect, useRef } from 'react'
import type { Shape } from '../types'

// canvas component for rendering game shapes
interface Props {
  shapes: Shape[]
  width: number          // internal canvas resolution
  height: number
  displayW: number       // CSS display size (scaled)
  displayH: number
  scale: number          // displayW / width — used to map touch coords back
  onCanvasClick: (x: number, y: number) => void
}

// render shapes with dynamic coloring based on age
export function GameCanvas({ shapes, width, height, displayW, displayH, scale, onCanvasClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // clear canvas
    ctx.clearRect(0, 0, width, height)

    // draw each shape
    for (const shape of shapes) {
      const progress = shape.riskValue   // 0 = fresh, 1 = expiring
      const t = Date.now() / 1000

      ctx.save()
      ctx.globalAlpha = shape.opacity

      // draw decoys with pulsing effect
      if (shape.isDecoy) {
        // Decoys: deeper blue color, pulsating to draw attention
        const hue = 200 - progress * 30
        const saturation = 60 + progress * 20
        const lightness = 55 - progress * 10

        // subtle pulse
        const pulse = 0.9 + 0.1 * Math.sin(t * 4 + shape.pulsePhase)

        // almost identical color, slightly "off"
        ctx.fillStyle = `hsla(${hue}, ${saturation * 0.9}%, ${lightness + 2}%, ${0.22 * pulse})`
        ctx.strokeStyle = `hsla(${hue}, ${saturation * 0.85}%, ${lightness + 18}%, ${0.85 * pulse})`

        // dashed outline (main differentiator)
        ctx.setLineDash([3, 3])
        ctx.lineWidth = 1.5

        ctx.beginPath()
        ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        ctx.setLineDash([])
      } else {
        // draw regular shapes with smooth color gradient
        const hue = 200 - progress * 30
        const saturation = 60 + progress * 20
        const lightness = 55 - progress * 10
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.2)`
        ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness + 20}%, 0.9)`
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // add glow for large shapes to make them stand out
        if (shape.radius > 35) {
          ctx.strokeStyle = `hsla(${hue}, ${saturation}%, 80%, 0.3)`
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.arc(shape.x, shape.y, shape.radius * 0.7, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      ctx.restore()
    }
  }, [shapes, width, height])

  // Shared coordinate extraction — divides by scale to get internal coords
  function coordsFromEvent(clientX: number, clientY: number) {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    }
  }

  // handle click position relative to canvas
  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const { x, y } = coordsFromEvent(e.clientX, e.clientY)
    onCanvasClick(x, y)
  }

  function handleTouch(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault() // stop scroll/zoom hijacking the tap
    const touch = e.changedTouches[0]
    const { x, y } = coordsFromEvent(touch.clientX, touch.clientY)
    onCanvasClick(x, y)
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      onTouchEnd={handleTouch}
      style={{
        cursor: 'crosshair',
        display: 'block',
        background: '#050a10',
        borderRadius: 8,
        width: displayW,
        height: displayH,
        touchAction: 'none', // prevent browser handling touch as scroll
      }}
    />
  )
}
