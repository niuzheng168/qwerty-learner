import { GalleryContext } from '.'
import enFlag from '@/assets/flags/en.png'
// import codeFlag from '@/assets/flags/code.png'
// import deFlag from '@/assets/flags/de.png'
// import idFlag from '@/assets/flags/id.png'
// import jpFlag from '@/assets/flags/ja.png'
// import kkFlag from '@/assets/flags/kk.png'
import zhFlag from '@/assets/flags/zh.png'
import type { LanguageCategoryType } from '@/typings'
import { RadioGroup } from '@headlessui/react'
import { useCallback, useContext } from 'react'
import { useNavigate } from 'react-router-dom'

export type LanguageTabOption = {
  id: LanguageCategoryType | 'game'
  name: string
  flag: string
  isGame?: boolean
}

const options: LanguageTabOption[] = [
  { id: 'en', name: '英语', flag: enFlag },
  { id: 'zh', name: '中文', flag: zhFlag },
  { id: 'game', name: 'Game', flag: '', isGame: true },
  // { id: 'ja', name: '日语', flag: jpFlag },
  // { id: 'de', name: '德语', flag: deFlag },
  // { id: 'kk', name: '哈萨克语', flag: kkFlag },
  // { id: 'id', name: '印尼语', flag: idFlag },
  // { id: 'code', name: 'Code', flag: codeFlag },
]

export function LanguageTabSwitcher() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const { state, setState } = useContext(GalleryContext)!
  const navigate = useNavigate()

  const onChangeTab = useCallback(
    (tab: string) => {
      if (tab === 'game') {
        navigate('/game')
        return
      }
      setState((draft) => {
        draft.currentLanguageTab = tab as LanguageCategoryType
      })
    },
    [setState, navigate],
  )

  return (
    <RadioGroup value={state.currentLanguageTab} onChange={onChangeTab}>
      <div className="flex items-center space-x-4">
        {options.map((option) => (
          <RadioGroup.Option key={option.id} value={option.id} className="cursor-pointer">
            {({ checked }) => (
              <div
                className={`flex items-center border-b-2 px-2 pb-1 ${
                  checked && !option.isGame ? 'border-indigo-500' : 'border-transparent'
                }`}
              >
                {option.isGame ? <span className="mr-1.5 text-xl">🎮</span> : <img src={option.flag} className="mr-1.5 h-7 w-7" />}
                <p className={`text-lg font-medium text-gray-700 dark:text-gray-200`}>{option.name}</p>
              </div>
            )}
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  )
}
