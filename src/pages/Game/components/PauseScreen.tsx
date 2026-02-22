type Difficulty = 'easy' | 'normal' | 'hard'

type Props = {
  onResume: () => void
  onRestart: () => void
  onBack: () => void
  selectedDifficulty: Difficulty
  onSelectDifficulty: (difficulty: Difficulty) => void
}

export default function PauseScreen({ onResume, onRestart, onBack, selectedDifficulty, onSelectDifficulty }: Props) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative flex flex-col items-center rounded-3xl bg-white/95 p-10 shadow-2xl dark:bg-gray-800/95">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
          <svg className="h-10 w-10 text-indigo-600 dark:text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        </div>
        <h1 className="mb-2 text-4xl font-bold text-gray-800 dark:text-gray-100">游戏暂停</h1>
        <p className="mb-8 text-lg text-gray-500 dark:text-gray-400">按 ESC 或点击继续按钮恢复游戏</p>
        <div className="mb-6 flex flex-col items-center gap-3">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">选择难度</span>
          <div className="flex gap-2">
            {(['easy', 'normal', 'hard'] as Difficulty[]).map((level) => {
              const isActive = selectedDifficulty === level
              const label = level === 'easy' ? '简单' : level === 'normal' ? '普通' : '困难'
              return (
                <button
                  key={level}
                  onClick={() => onSelectDifficulty(level)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-gray-700 dark:text-indigo-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={onResume}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-10 py-4 text-xl font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            继续游戏
          </button>
          <button
            onClick={onRestart}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-indigo-300 bg-white px-10 py-4 text-xl font-bold text-indigo-600 shadow-lg transition-all hover:scale-105 hover:bg-indigo-50 focus:outline-none focus:ring-4 focus:ring-indigo-200 dark:border-indigo-700 dark:bg-gray-700 dark:text-indigo-400 dark:hover:bg-gray-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            重新开始
          </button>
          <button
            onClick={onBack}
            className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-10 py-4 text-xl font-bold text-gray-700 shadow-lg transition-all hover:scale-105 hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            返回主页
          </button>
        </div>
      </div>
    </div>
  )
}
