type Props = {
  score: number
  level: number
}

export default function ScoreDisplay({ score, level }: Props) {
  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-2">
        <span className="text-lg font-medium text-gray-700 dark:text-gray-200">得分:</span>
        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{score}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-lg font-medium text-gray-700 dark:text-gray-200">等级:</span>
        <span className="text-2xl font-bold text-green-600 dark:text-green-400">{level}</span>
      </div>
    </div>
  )
}
