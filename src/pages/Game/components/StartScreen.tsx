type Difficulty = 'easy' | 'normal' | 'hard'

type Props = {
  onStart: () => void
  selectedDifficulty: Difficulty
  onSelectDifficulty: (difficulty: Difficulty) => void
}

export default function StartScreen({ onStart, selectedDifficulty, onSelectDifficulty }: Props) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative flex flex-col items-center rounded-3xl bg-white p-10 shadow-2xl dark:bg-gray-800">
        <h1 className="mb-4 text-4xl font-bold text-indigo-600 dark:text-indigo-400">打字飞机大战</h1>
        <p className="mb-2 text-lg text-gray-600 dark:text-gray-300">按下键盘上的字母击落敌机!</p>
        <div className="mb-5 flex flex-col items-center gap-3">
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
        <div className="mb-6 text-gray-500 dark:text-gray-400">
          <p>• 敌机从上方飞来，每架都有一个字母</p>
          <p>• 按对应的键可以击落敌机并得分</p>
          <p>• 敌机到达底部会损失生命值</p>
          <p>• 生命值归零时游戏结束</p>
        </div>
        <button
          onClick={onStart}
          className="rounded-xl bg-indigo-600 px-8 py-4 text-xl font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-300"
        >
          开始游戏
        </button>
        <p className="mt-4 text-sm text-gray-400">或按任意字母键开始</p>
      </div>
    </div>
  )
}
