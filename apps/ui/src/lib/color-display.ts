import type { PaintColor } from '@color-frames/contracts'

export function colorToHex(color: PaintColor) {
  const channels =
    color.a === 1 ? [color.r, color.g, color.b] : [color.r, color.g, color.b, color.a]
  return (
    '#' +
    channels
      .map((value) =>
        Math.round(value * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
      .toUpperCase()
  )
}

export function colorToCss(color: PaintColor) {
  return `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, ${color.a})`
}
