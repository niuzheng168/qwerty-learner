import type { LetterState } from './Letter'
import style from './index.module.css'
import { EXPLICIT_SPACE } from '@/constants'
import { fontSizeConfigAtom } from '@/store'
import { isKanji } from '@/utils/kana'
import { useAtomValue } from 'jotai'
import { useMemo } from 'react'

type NotationProps = {
  notation: string
  pinyinOnly?: boolean
  letterStates?: LetterState[]
  getLetterVisible?: (index: number) => boolean
  hasWrong?: boolean
}

type NotationInfo = {
  word: string
  phonetic?: string
}

// Check if a character is a punctuation mark (Chinese or English)
const isPunctuation = (char: string): boolean => {
  const punctuationPattern = /[，。、；：？！""''（）《》【】…—,.;:?!'"()[\]]/
  return punctuationPattern.test(char)
}

// Group notation info into lines, breaking after punctuation
const groupIntoLines = (infos: NotationInfo[]): NotationInfo[][] => {
  const lines: NotationInfo[][] = []
  let currentLine: NotationInfo[] = []

  for (const info of infos) {
    currentLine.push(info)
    // Break after punctuation (the punctuation stays at the end of current line)
    if (isPunctuation(info.word)) {
      lines.push(currentLine)
      currentLine = []
    }
  }

  // Don't forget remaining items
  if (currentLine.length > 0) {
    lines.push(currentLine)
  }

  return lines
}

export default function Notation({ notation, pinyinOnly = false, letterStates = [], getLetterVisible, hasWrong = false }: NotationProps) {
  const infos: NotationInfo[] = useMemo(() => getNotationInfo(notation), [notation])
  const lines = useMemo(() => groupIntoLines(infos), [infos])
  const fontSizeConfig = useAtomValue(fontSizeConfigAtom)

  // For Chinese (pinyinOnly mode): show pinyin aligned with characters
  if (pinyinOnly) {
    // Calculate character index offset for each position
    let charIndex = 0

    // State color classes
    const stateClassNameMap: Record<LetterState, string> = {
      normal: 'text-gray-600 dark:text-gray-50',
      correct: 'text-green-600 dark:text-green-400',
      wrong: 'text-red-600 dark:text-red-400',
    }

    return (
      <div className={`mx-auto mb-2 flex max-w-4xl flex-col items-center ${hasWrong ? style.wrong : ''}`}>
        {lines.map((lineInfos, lineIndex) => {
          return (
            <div key={lineIndex} className="flex flex-wrap justify-center">
              {lineInfos.map(({ word, phonetic }, index) => {
                const isPunct = isPunctuation(word)
                // For multi-character words, we need to render each char separately
                const chars = word.split('')

                return (
                  <div key={`${lineIndex}-${index}`} className={`flex ${isPunct ? '' : ''}`}>
                    {chars.map((char, charOffset) => {
                      const currentCharIndex = charIndex
                      charIndex++

                      const isPunctChar = isPunctuation(char)
                      const state = letterStates[currentCharIndex] || 'normal'
                      const visible = getLetterVisible ? getLetterVisible(currentCharIndex) : true

                      // Calculate pinyin for this specific character
                      // If word has multiple chars but only one phonetic, distribute it
                      let charPinyin = ''
                      if (!isPunctChar && phonetic) {
                        if (chars.length === 1) {
                          charPinyin = phonetic
                        } else {
                          // For multi-char words with single phonetic, only show on first char
                          // This handles edge cases in the notation format
                          charPinyin = charOffset === 0 ? phonetic : ''
                        }
                      }

                      return (
                        <div
                          key={`${lineIndex}-${index}-${charOffset}`}
                          className={`flex flex-col items-center ${isPunctChar ? 'mx-0' : 'mx-0.5'}`}
                        >
                          <span
                            className="text-center font-mono text-lg text-gray-500 dark:text-gray-400"
                            style={{ minHeight: '1.5rem', minWidth: '1em' }}
                          >
                            {isPunctChar ? '' : charPinyin}
                          </span>
                          <span
                            className={`m-0 p-0 font-mono font-normal ${stateClassNameMap[state]} duration-0 dark:text-opacity-80`}
                            style={{ fontSize: fontSizeConfig.foreignFont.toString() + 'px' }}
                          >
                            {visible ? (char === ' ' ? EXPLICIT_SPACE : char) : '_'}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="mx-auto flex h-20 items-end">
      <ruby className="mb-1 p-0 font-mono text-5xl text-gray-800 dark:text-opacity-80">
        {infos.map(({ word, phonetic }) => {
          const hasPhonetic = phonetic && phonetic.length > 0
          const isEmptyPhonetic = hasPhonetic && phonetic.trim().length == 0
          return (
            <>
              {word}
              {hasPhonetic && isEmptyPhonetic ? (
                <>
                  <rt>{phonetic}</rt>
                </>
              ) : (
                <>
                  <rp>{'('}</rp>
                  <rt>{phonetic}</rt>
                  <rp>{')'}</rp>
                </>
              )}
            </>
          )
        })}
      </ruby>
    </div>
  )
}

const getNotationInfo = (notation: string): NotationInfo[] => {
  const re = /(.+?)\((.+?)\)/g
  let match
  let start = 0
  const ret = []
  while ((match = re.exec(notation))) {
    const [fullMatch, , phonetic] = match
    let word = match[1]
    if (match.index > start) {
      ret.push({ word: notation.substring(start, match.index), phonetic: '' })
    }
    let kanjiStart = 0
    for (let i = 0; i < word.length; i++) {
      if (!isKanji(word[i])) {
        kanjiStart += 1
      } else if (kanjiStart > 0) {
        ret.push({
          word: word.substring(0, i),
          phonetic: ' ',
        })
        word = word.substring(i)
        break
      }
    }
    ret.push({
      word,
      phonetic,
    })
    start = match.index + fullMatch.length
  }
  if (start < notation.length) {
    ret.push({
      word: notation.substring(start),
      phonetic: '',
    })
  }
  return ret
}
