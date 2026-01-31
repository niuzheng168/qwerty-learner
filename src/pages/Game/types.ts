export type EnemyPlane = {
  id: string
  letter: string
  x: number
  y: number
  speed: number
}

export type Bullet = {
  id: string
  targetId: string
  startY: number
  targetX: number
  targetY: number
  progress: number
}

export type GameState = {
  isPlaying: boolean
  isPaused: boolean
  isGameOver: boolean
  score: number
  health: number
  maxHealth: number
  enemies: EnemyPlane[]
  bullets: Bullet[]
  level: number
  spawnInterval: number
  lastSpawnTime: number
}

export const initialGameState: GameState = {
  isPlaying: false,
  isPaused: false,
  isGameOver: false,
  score: 0,
  health: 5,
  maxHealth: 5,
  enemies: [],
  bullets: [],
  level: 1,
  spawnInterval: 2000,
  lastSpawnTime: 0,
}
