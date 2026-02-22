import BulletComponent from './components/Bullet'
import EnemyPlaneComponent from './components/EnemyPlane'
import GameOverScreen from './components/GameOverScreen'
import HealthBar from './components/HealthBar'
import PauseScreen from './components/PauseScreen'
import PlayerPlane from './components/PlayerPlane'
import ScoreDisplay from './components/ScoreDisplay'
import StartScreen from './components/StartScreen'
import type { Bullet, EnemyPlane } from './types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
const LEVEL_THRESHOLD = 10
const MIN_SPAWN_INTERVAL = 800
const SPAWN_DECREASE_RATE = 80
const BASE_SPEED = 0.08
const SPEED_INCREASE_RATE = 0.01
const BULLET_SPEED = 0.025

type Difficulty = 'easy' | 'normal' | 'hard'

const DIFFICULTY_SETTINGS: Record<Difficulty, { label: string; speedMultiplier: number; baseSpawnInterval: number; spawnBatch: number }> = {
  easy: { label: '简单', speedMultiplier: 0.85, baseSpawnInterval: 2400, spawnBatch: 1 },
  normal: { label: '普通', speedMultiplier: 1, baseSpawnInterval: 2000, spawnBatch: 1 },
  hard: { label: '困难', speedMultiplier: 1.6, baseSpawnInterval: 1400, spawnBatch: 2 },
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function getRandomLetter(): string {
  return LETTERS[Math.floor(Math.random() * LETTERS.length)]
}

export default function GamePage() {
  const navigate = useNavigate()

  // Game entities as state (for React rendering)
  const [enemies, setEnemies] = useState<EnemyPlane[]>([])
  const [bullets, setBullets] = useState<Bullet[]>([])

  // UI state
  const [uiState, setUiState] = useState({
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    score: 0,
    health: 5,
    level: 1,
  })

  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight })
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')

  // Refs for values needed in animation loop (to avoid stale closures)
  const uiStateRef = useRef(uiState)
  uiStateRef.current = uiState
  const dimensionsRef = useRef(dimensions)
  dimensionsRef.current = dimensions
  const enemiesRef = useRef(enemies)
  enemiesRef.current = enemies
  const bulletsRef = useRef(bullets)
  bulletsRef.current = bullets
  const difficultyRef = useRef(difficulty)
  difficultyRef.current = difficulty

  const lastSpawnTimeRef = useRef(0)
  const spawnIntervalRef = useRef(2000)
  const animationFrameRef = useRef<number | null>(null)
  const lastFrameTimeRef = useRef(0)

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Main game loop
  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      animationFrameRef.current = requestAnimationFrame(gameLoop)

      const state = uiStateRef.current
      if (!state.isPlaying || state.isPaused || state.isGameOver) {
        lastFrameTimeRef.current = timestamp
        return
      }

      const deltaTime = lastFrameTimeRef.current ? timestamp - lastFrameTimeRef.current : 16
      lastFrameTimeRef.current = timestamp
      const cappedDelta = Math.min(deltaTime, 50)

      const dims = dimensionsRef.current
      const currentEnemies = enemiesRef.current
      const currentBullets = bulletsRef.current
      let healthLost = 0

      let enemiesAfterSpawn = currentEnemies

      const difficultySettings = DIFFICULTY_SETTINGS[difficultyRef.current]

      // Spawn enemies
      if (timestamp - lastSpawnTimeRef.current > spawnIntervalRef.current) {
        const speed = (BASE_SPEED + (state.level - 1) * SPEED_INCREASE_RATE) * difficultySettings.speedMultiplier
        const batch = difficultySettings.spawnBatch + Math.floor((state.level - 1) / 5)
        const spawned: EnemyPlane[] = Array.from({ length: batch }).map(() => ({
          id: generateId(),
          letter: getRandomLetter(),
          x: 80 + Math.random() * (dims.width - 160),
          y: -60 - Math.random() * 80,
          speed,
        }))
        enemiesAfterSpawn = [...currentEnemies, ...spawned]
        lastSpawnTimeRef.current = timestamp
      }

      // Update enemy positions
      const levelSpeedMultiplier = (1 + (state.level - 1) * SPEED_INCREASE_RATE) * difficultySettings.speedMultiplier
      const bottomLimit = dims.height - 160
      const updatedEnemies: EnemyPlane[] = []
      for (const enemy of enemiesAfterSpawn) {
        const nextY = enemy.y + enemy.speed * levelSpeedMultiplier * cappedDelta
        if (nextY > bottomLimit) {
          healthLost++
          continue
        }
        updatedEnemies.push({ ...enemy, y: nextY })
      }

      // Update bullets
      const updatedBullets: Bullet[] = []
      for (const bullet of currentBullets) {
        const nextProgress = bullet.progress + (BULLET_SPEED * cappedDelta) / 16
        if (nextProgress < 1) {
          updatedBullets.push({ ...bullet, progress: nextProgress })
        }
      }

      // Update state
      setEnemies(updatedEnemies)
      setBullets(updatedBullets)

      // Handle health loss
      if (healthLost > 0) {
        setUiState((prev) => {
          const newHealth = Math.max(0, prev.health - healthLost)
          if (newHealth <= 0) {
            return { ...prev, health: 0, isGameOver: true, isPlaying: false }
          }
          return { ...prev, health: newHealth }
        })
      }
    }

    animationFrameRef.current = requestAnimationFrame(gameLoop)
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = uiStateRef.current

      // ESC for pause
      if (e.key === 'Escape') {
        e.preventDefault()
        if (state.isGameOver || !state.isPlaying) return
        setUiState((prev) => ({ ...prev, isPaused: !prev.isPaused }))
        return
      }

      // Letter keys
      if (!/^[a-zA-Z]$/.test(e.key) || e.altKey || e.ctrlKey || e.metaKey) return
      if (state.isPaused || state.isGameOver) return

      const key = e.key.toUpperCase()

      // Start game on first key press
      if (!state.isPlaying) {
        const difficultySettings = DIFFICULTY_SETTINGS[difficultyRef.current]
        spawnIntervalRef.current = Math.max(
          MIN_SPAWN_INTERVAL,
          difficultySettings.baseSpawnInterval - (state.level - 1) * SPAWN_DECREASE_RATE,
        )
        lastSpawnTimeRef.current = performance.now()
        lastFrameTimeRef.current = performance.now()
        setUiState((prev) => ({ ...prev, isPlaying: true }))
        return
      }

      // Find enemy with matching letter (closest to bottom)
      const currentEnemies = enemiesRef.current
      let targetIndex = -1
      let maxY = -Infinity
      for (let i = 0; i < currentEnemies.length; i++) {
        if (currentEnemies[i].letter === key && currentEnemies[i].y > maxY) {
          maxY = currentEnemies[i].y
          targetIndex = i
        }
      }

      if (targetIndex >= 0) {
        const target = currentEnemies[targetIndex]
        const dims = dimensionsRef.current

        // Add bullet and remove enemy
        setBullets((prev) => [
          ...prev,
          {
            id: generateId(),
            targetId: target.id,
            startY: dims.height - 120,
            targetX: target.x,
            targetY: target.y,
            progress: 0,
          },
        ])

        setEnemies((prev) => prev.filter((_, i) => i !== targetIndex))

        // Update score
        setUiState((prev) => {
          const newScore = prev.score + 1
          const newLevel = Math.floor(newScore / LEVEL_THRESHOLD) + 1
          if (newLevel !== prev.level) {
            const difficultySettings = DIFFICULTY_SETTINGS[difficultyRef.current]
            spawnIntervalRef.current = Math.max(
              MIN_SPAWN_INTERVAL,
              difficultySettings.baseSpawnInterval - (newLevel - 1) * SPAWN_DECREASE_RATE,
            )
          }
          return { ...prev, score: newScore, level: newLevel }
        })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleStart = useCallback(() => {
    setEnemies([])
    setBullets([])
    const difficultySettings = DIFFICULTY_SETTINGS[difficultyRef.current]
    spawnIntervalRef.current = Math.max(MIN_SPAWN_INTERVAL, difficultySettings.baseSpawnInterval)
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
    setUiState((prev) => ({ ...prev, isPaused: true }))
  }, [])

  const handleResume = useCallback(() => {
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
        {enemies.map((enemy) => (
          <EnemyPlaneComponent key={enemy.id} enemy={enemy} containerHeight={dimensions.height - 60} />
        ))}

        {/* Bullets */}
        {bullets.map((bullet) => (
          <BulletComponent key={bullet.id} bullet={bullet} playerX={dimensions.width / 2} />
        ))}

        {/* Player plane */}
        <PlayerPlane />

        {/* Start screen */}
        {!uiState.isPlaying && !uiState.isGameOver && (
          <StartScreen onStart={handleStart} selectedDifficulty={difficulty} onSelectDifficulty={setDifficulty} />
        )}

        {/* Pause screen */}
        {uiState.isPaused && !uiState.isGameOver && (
          <PauseScreen
            onResume={handleResume}
            onRestart={handleStart}
            onBack={handleBack}
            selectedDifficulty={difficulty}
            onSelectDifficulty={setDifficulty}
          />
        )}

        {/* Game over screen */}
        {uiState.isGameOver && (
          <GameOverScreen
            score={uiState.score}
            level={uiState.level}
            onRestart={handleStart}
            onBack={handleBack}
            selectedDifficulty={difficulty}
            onSelectDifficulty={setDifficulty}
          />
        )}
      </div>

      {/* Footer hint */}
      <div className="z-10 bg-white/80 py-2 text-center backdrop-blur-sm dark:bg-gray-800/80">
        <p className="text-sm text-gray-600 dark:text-gray-300">提示: 快速按下键盘上对应的字母来击落敌机! 按 ESC 暂停游戏</p>
      </div>
    </div>
  )
}
