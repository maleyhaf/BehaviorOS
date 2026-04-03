import { useState, useEffect } from 'react'

export function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight })

  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return size
}

// Given a fixed internal canvas size, return the CSS display size
// that fits within the available space while preserving aspect ratio
export function fitCanvas(
  internalW: number,
  internalH: number,
  availableW: number,
  availableH: number
): { displayW: number; displayH: number; scale: number } {
  const scaleX = availableW / internalW
  const scaleY = availableH / internalH
  const scale = Math.min(scaleX, scaleY, 1) // never upscale
  return {
    displayW: Math.floor(internalW * scale),
    displayH: Math.floor(internalH * scale),
    scale,
  }
}