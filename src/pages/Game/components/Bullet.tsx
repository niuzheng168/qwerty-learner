import type { Bullet as BulletType } from '../types'
import { memo } from 'react'

type Props = {
  bullet: BulletType
  playerX: number
}

function Bullet({ bullet, playerX }: Props) {
  const currentX = playerX + (bullet.targetX - playerX) * bullet.progress
  const currentY = bullet.startY + (bullet.targetY - bullet.startY) * bullet.progress

  return (
    <>
      {/* Trail */}
      <div
        className="absolute rounded-full bg-yellow-300/40"
        style={{
          left: playerX + (bullet.targetX - playerX) * Math.max(0, bullet.progress - 0.2),
          top: bullet.startY + (bullet.targetY - bullet.startY) * Math.max(0, bullet.progress - 0.2),
          width: 6,
          height: 6,
          transform: 'translate(-50%, -50%)',
        }}
      />
      <div
        className="absolute rounded-full bg-yellow-400/60"
        style={{
          left: playerX + (bullet.targetX - playerX) * Math.max(0, bullet.progress - 0.1),
          top: bullet.startY + (bullet.targetY - bullet.startY) * Math.max(0, bullet.progress - 0.1),
          width: 8,
          height: 8,
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Main bullet */}
      <div
        className="absolute rounded-full bg-gradient-to-b from-yellow-200 via-yellow-400 to-orange-500"
        style={{
          left: currentX,
          top: currentY,
          width: 12,
          height: 18,
          transform: 'translate(-50%, -50%)',
          boxShadow: '0 0 8px #FCD34D, 0 0 16px #F59E0B',
        }}
      />

      {/* Glow center */}
      <div
        className="absolute rounded-full bg-white"
        style={{
          left: currentX,
          top: currentY - 2,
          width: 6,
          height: 8,
          transform: 'translate(-50%, -50%)',
          opacity: 0.8,
        }}
      />
    </>
  )
}

export default memo(Bullet)
