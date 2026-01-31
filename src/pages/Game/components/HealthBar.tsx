type Props = {
  health: number
  maxHealth: number
}

export default function HealthBar({ health, maxHealth }: Props) {
  return (
    <div className="flex items-center gap-1">
      <span className="mr-2 text-lg font-medium text-gray-700 dark:text-gray-200">生命值:</span>
      <div className="flex gap-1">
        {Array.from({ length: maxHealth }).map((_, i) => (
          <span
            key={i}
            className={`text-2xl transition-all duration-300 ${i < health ? 'scale-100 text-red-500' : 'scale-75 text-gray-300'}`}
          >
            ♥
          </span>
        ))}
      </div>
    </div>
  )
}
