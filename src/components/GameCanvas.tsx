import { useEffect, useRef } from 'react'
import type { Shape } from '../types'

interface Props {
  shapes: Shape[]
  width: number
  height: number
  onCanvasClick: (x: number, y: number) => void
}

export function GameCanvas({ shapes, width, height, onCanvasClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    for (const shape of shapes) {
      const progress = shape.riskValue   // 0 = fresh, 1 = expiring
      const t = Date.now() / 1000

      ctx.save()
      ctx.globalAlpha = shape.opacity

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
        // Regular shapes: blue → teal, grow more saturated
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

        // Inner glow ring for large shapes
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

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect()
    onCanvasClick(e.clientX - rect.left, e.clientY - rect.top)
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      style={{
        cursor: 'crosshair',
        display: 'block',
        background: '#050a10',
        borderRadius: 8,
      }}
    />
  )
}
