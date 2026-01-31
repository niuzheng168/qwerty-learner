import BulletComponent from './components/Bullet'
import EnemyPlaneComponent from './components/EnemyPlane'
import GameOverScreen from './components/GameOverScreen'
import HealthBar from './components/HealthBar'
import PauseScreen from './components/PauseScreen'
import PlayerPlane from './components/PlayerPlane'
import ScoreDisplay from './components/ScoreDisplay'
import StartScreen from './components/StartScreen'
import type { Bullet, EnemyPlane } from './types'
import { initialGameState } from './types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LEVEL_THRESHOLD = 10
const MIN_SPAWN_INTERVAL = 800
const SPAWN_DECREASE_RATE = 80
const BASE_SPEED = 0.06
const SPEED_INCREASE_RATE = 0.008
const BULLET_SPEED = 0.02

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function getRandomLetter(): string {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)]
}

export default function GamePage() {
  const navigate = useNavigate()

  // UI state that needs React rendering
  const [uiState, setUiState] = useState({
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    score: 0,
    health: 5,
    level: 1,
  })

  // Render trigger
  const [renderTick, setRenderTick] = useState(0)

  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight })

  // Mutable game state in refs (no re-renders on change)
  const enemiesRef = useRef<EnemyPlane[]>([])
  const bulletsRef = useRef<Bullet[]>([])
  const lastSpawnTimeRef = useRef(0)
  const spawnIntervalRef = useRef(2000)
  const animationFrameRef = useRef<number>()
  const lastFrameTimeRef = useRef(0)
  const isPlayingRef = useRef(false)
  const isPausedRef = useRef(false)
  const isGameOverRef = useRef(false)
  const scoreRef = useRef(0)
  const healthRef = useRef(5)
  const levelRef = useRef(1)

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Main game loop
  const gameLoop = useCallback(
    (timestamp: number) => {
      if (!isPlayingRef.current || isPausedRef.current || isGameOverRef.current) {
        lastFrameTimeRef.current = timestamp
        animationFrameRef.current = requestAnimationFrame(gameLoop)
        return
      }

      const deltaTime = lastFrameTimeRef.current ? timestamp - lastFrameTimeRef.current : 16
      lastFrameTimeRef.current = timestamp

      // Cap deltaTime to prevent huge jumps
      const cappedDelta = Math.min(deltaTime, 50)

      // Spawn enemies
      if (timestamp - lastSpawnTimeRef.current > spawnIntervalRef.current) {
        const speed = BASE_SPEED + (levelRef.current - 1) * SPEED_INCREASE_RATE
        enemiesRef.current.push({
          id: generateId(),
          letter: getRandomLetter(),
          x: 80 + Math.random() * (dimensions.width - 160),
          y: -60,
          speed,
        })
        lastSpawnTimeRef.current = timestamp
      }

      // Update enemies
      let healthLost = 0
      const bottomLimit = dimensions.height - 140

      for (let i = enemiesRef.current.length - 1; i >= 0; i--) {
        enemiesRef.current[i].y += enemiesRef.current[i].speed * cappedDelta
        if (enemiesRef.current[i].y > bottomLimit) {
          enemiesRef.current.splice(i, 1)
          healthLost++
        }
      }

      // Update bullets
      for (let i = bulletsRef.current.length - 1; i >= 0; i--) {
        bulletsRef.current[i].progress += (BULLET_SPEED * cappedDelta) / 16
        if (bulletsRef.current[i].progress >= 1) {
          bulletsRef.current.splice(i, 1)
        }
      }

      // Handle health loss
      if (healthLost > 0) {
        healthRef.current = Math.max(0, healthRef.current - healthLost)
        if (healthRef.current <= 0) {
          isGameOverRef.current = true
          isPlayingRef.current = false
          setUiState((prev) => ({
            ...prev,
            health: 0,
            isGameOver: true,
            isPlaying: false,
          }))
        } else {
          setUiState((prev) => ({ ...prev, health: healthRef.current }))
        }
      }

      // Trigger render
      setRenderTick((t) => t + 1)

      animationFrameRef.current = requestAnimationFrame(gameLoop)
    },
    [dimensions],
  )

  // Start/stop game loop
  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(gameLoop)
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [gameLoop])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC for pause
      if (e.key === 'Escape') {
        e.preventDefault()
        if (isGameOverRef.current || !isPlayingRef.current) return
        isPausedRef.current = !isPausedRef.current
        setUiState((prev) => ({ ...prev, isPaused: isPausedRef.current }))
        return
      }

      // Letter keys
      if (!/^[a-zA-Z]$/.test(e.key) || e.altKey || e.ctrlKey || e.metaKey) return
      if (isPausedRef.current || isGameOverRef.current) return

      const key = e.key.toUpperCase()

      // Start game on first key press
      if (!isPlayingRef.current) {
        isPlayingRef.current = true
        lastSpawnTimeRef.current = performance.now()
        lastFrameTimeRef.current = performance.now()
        setUiState((prev) => ({ ...prev, isPlaying: true }))
        return
      }

      // Find and shoot enemy
      let targetIndex = -1
      let maxY = -Infinity
      for (let i = 0; i < enemiesRef.current.length; i++) {
        if (enemiesRef.current[i].letter === key && enemiesRef.current[i].y > maxY) {
          maxY = enemiesRef.current[i].y
          targetIndex = i
        }
      }

      if (targetIndex >= 0) {
        const target = enemiesRef.current[targetIndex]

        // Add bullet
        bulletsRef.current.push({
          id: generateId(),
          targetId: target.id,
          startY: dimensions.height - 100,
          targetX: target.x,
          targetY: target.y,
          progress: 0,
        })

        // Remove enemy
        enemiesRef.current.splice(targetIndex, 1)

        // Update score
        scoreRef.current += 1
        const newLevel = Math.floor(scoreRef.current / LEVEL_THRESHOLD) + 1
        if (newLevel !== levelRef.current) {
          levelRef.current = newLevel
          spawnIntervalRef.current = Math.max(MIN_SPAWN_INTERVAL, 2000 - (newLevel - 1) * SPAWN_DECREASE_RATE)
        }

        setUiState((prev) => ({
          ...prev,
          score: scoreRef.current,
          level: levelRef.current,
        }))
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [dimensions.height])

  const handleStart = useCallback(() => {
    enemiesRef.current = []
    bulletsRef.current = []
    scoreRef.current = 0
    healthRef.current = 5
    levelRef.current = 1
    spawnIntervalRef.current = 2000
    isPlayingRef.current = true
    isPausedRef.current = false
    isGameOverRef.current = false
    lastSpawnTimeRef.current = performance.now()
    lastFrameTimeRef.current = performance.now()

    setUiState({
      isPlaying: true,
      isPaused: false,
      isGameOver: false,
      score: 0,
      health: 5,
      level: 1,
    })
  }, [])

  const handleBack = useCallback(() => {
    navigate('/gallery')
  }, [navigate])

  const handlePause = useCallback(() => {
    isPausedRef.current = true
    setUiState((prev) => ({ ...prev, isPaused: true }))
  }, [])

  const handleResume = useCallback(() => {
    isPausedRef.current = false
    lastFrameTimeRef.current = performance.now()
    setUiState((prev) => ({ ...prev, isPaused: false }))
  }, [])

  return (
    <div className="fixed inset-0 flex flex-col bg-gradient-to-b from-sky-300 via-sky-400 to-sky-500 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900">
      {/* Header bar */}
      <div className="z-10 flex w-full items-center justify-between bg-white/80 px-6 py-3 shadow-md backdrop-blur-sm dark:bg-gray-800/80">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            ← 返回
          </button>
          {uiState.isPlaying && !uiState.isGameOver && (
            <button
              onClick={handlePause}
              className="flex items-center gap-2 rounded-lg bg-indigo-100 px-4 py-2 font-medium text-indigo-700 transition-colors hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:hover:bg-indigo-800"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
              暂停
            </button>
          )}
        </div>
        <ScoreDisplay score={uiState.score} level={uiState.level} />
        <HealthBar health={uiState.health} maxHealth={5} />
      </div>

      {/* Game area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Clouds */}
        <div className="absolute left-[5%] top-[10%] h-16 w-32 rounded-full bg-white/30 blur-sm dark:bg-white/10" />
        <div className="absolute right-[10%] top-[20%] h-12 w-24 rounded-full bg-white/30 blur-sm dark:bg-white/10" />
        <div className="absolute left-[30%] top-[5%] h-10 w-20 rounded-full bg-white/30 blur-sm dark:bg-white/10" />
        <div className="absolute right-[25%] top-[35%] h-14 w-28 rounded-full bg-white/30 blur-sm dark:bg-white/10" />
        <div className="absolute left-[60%] top-[15%] h-12 w-24 rounded-full bg-white/30 blur-sm dark:bg-white/10" />

        {/* Enemy planes */}
        {enemiesRef.current.map((enemy) => (
          <EnemyPlaneComponent key={enemy.id} enemy={enemy} containerHeight={dimensions.height - 60} />
        ))}

        {/* Bullets */}
        {bulletsRef.current.map((bullet) => (
          <BulletComponent key={bullet.id} bullet={bullet} playerX={dimensions.width / 2} />
        ))}

        {/* Player plane */}
        <PlayerPlane />

        {/* Start screen */}
        {!uiState.isPlaying && !uiState.isGameOver && <StartScreen onStart={handleStart} />}

        {/* Pause screen */}
        {uiState.isPaused && !uiState.isGameOver && <PauseScreen onResume={handleResume} onRestart={handleStart} onBack={handleBack} />}

        {/* Game over screen */}
        {uiState.isGameOver && <GameOverScreen score={uiState.score} level={uiState.level} onRestart={handleStart} onBack={handleBack} />}
      </div>

      {/* Footer hint */}
      <div className="z-10 bg-white/80 py-2 text-center backdrop-blur-sm dark:bg-gray-800/80">
        <p className="text-sm text-gray-600 dark:text-gray-300">提示: 快速按下键盘上对应的字母来击落敌机! 按 ESC 暂停游戏</p>
      </div>
    </div>
  )
}
