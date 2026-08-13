import React from 'react'
import { generateCode128SvgBars } from '../../lib/code128'

interface BarcodeWidgetProps {
  value: string
  height?: number
  moduleWidth?: number
  className?: string
}

export function BarcodeWidget({ value, height = 55, moduleWidth = 1.8, className = '' }: BarcodeWidgetProps) {
  const { bars, totalWidth } = generateCode128SvgBars(value, height, moduleWidth)

  return (
    <div className={`flex justify-center items-center overflow-hidden ${className}`}>
      <svg
        viewBox={`0 0 ${totalWidth} ${height}`}
        className="w-full max-w-[340px] h-auto object-contain select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <rect width={totalWidth} height={height} fill="#ffffff" />
        {bars.map((bar, idx) => (
          <rect key={idx} x={bar.x} y={0} width={bar.width} height={height} fill="#000000" />
        ))}
      </svg>
    </div>
  )
}
