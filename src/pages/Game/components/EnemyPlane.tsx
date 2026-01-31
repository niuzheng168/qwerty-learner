import type { EnemyPlane as EnemyPlaneType } from '../types'
import { memo } from 'react'

type Props = {
  enemy: EnemyPlaneType
  containerHeight: number
}

function EnemyPlane({ enemy, containerHeight }: Props) {
  const dangerLevel = enemy.y / containerHeight

  const getColors = () => {
    if (dangerLevel > 0.7) {
      return { main: '#DC2626', light: '#FCA5A5' }
    }
    if (dangerLevel > 0.4) {
      return { main: '#D97706', light: '#FCD34D' }
    }
    return { main: '#059669', light: '#6EE7B7' }
  }

  const colors = getColors()

  return (
    <div
      className="absolute"
      style={{
        left: enemy.x,
        top: enemy.y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="relative">
        <svg width="80" height="80" viewBox="0 0 100 100">
          {/* Simple plane shape */}
          <ellipse cx="50" cy="50" rx="14" ry="32" fill={colors.main} />
          <ellipse cx="50" cy="50" rx="7" ry="26" fill={colors.light} opacity="0.4" />

          {/* Wings */}
          <polygon points="50,40 10,55 10,60 50,50" fill={colors.main} opacity="0.9" />
          <polygon points="50,40 90,55 90,60 50,50" fill={colors.main} opacity="0.9" />

          {/* Tail */}
          <polygon points="50,78 38,90 38,85 50,75" fill={colors.main} opacity="0.8" />
          <polygon points="50,78 62,90 62,85 50,75" fill={colors.main} opacity="0.8" />

          {/* Cockpit */}
          <ellipse cx="50" cy="25" rx="7" ry="10" fill="#1F2937" />
          <ellipse cx="50" cy="26" rx="4" ry="6" fill="#60A5FA" opacity="0.6" />
        </svg>

        {/* Letter */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: '8px' }}>
          <span
            className="text-3xl font-black text-white"
            style={{
              textShadow: '2px 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.5)',
            }}
          >
            {enemy.letter}
          </span>
        </div>
      </div>
    </div>
  )
}

export default memo(EnemyPlane)
