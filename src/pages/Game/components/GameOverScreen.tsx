type Props = {
  score: number
  level: number
  onRestart: () => void
  onBack: () => void
}

export default function GameOverScreen({ score, level, onRestart, onBack }: Props) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative flex flex-col items-center rounded-3xl bg-white p-10 shadow-2xl dark:bg-gray-800">
        <h1 className="mb-4 text-4xl font-bold text-red-500">游戏结束!</h1>
        <div className="mb-6 text-center">
          <p className="text-2xl text-gray-700 dark:text-gray-300">
            最终得分: <span className="font-bold text-indigo-600 dark:text-indigo-400">{score}</span>
          </p>
          <p className="mt-2 text-xl text-gray-600 dark:text-gray-400">
            达到等级: <span className="font-bold text-green-600 dark:text-green-400">{level}</span>
          </p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onRestart}
            className="rounded-xl bg-indigo-600 px-8 py-4 text-xl font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          >
            再玩一次
          </button>
          <button
            onClick={onBack}
            className="rounded-xl border-2 border-gray-300 bg-white px-8 py-4 text-xl font-bold text-gray-700 shadow-lg transition-all hover:scale-105 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  )
}
