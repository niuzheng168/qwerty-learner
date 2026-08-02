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

// Minimum visible character count per line. Short lines are merged with the next
// line so e.g. "他姓张。什么张？" doesn't get split across two stanzas.
const LINE_MERGE_THRESHOLD = 10

const lineCharCount = (line: NotationInfo[]): number => line.reduce((sum, info) => sum + info.word.length, 0)

// Merge consecutive lines while the running length stays below the threshold.
const mergeShortLines = (lines: NotationInfo[][], threshold = LINE_MERGE_THRESHOLD): NotationInfo[][] => {
  if (lines.length <= 1) return lines
  const merged: NotationInfo[][] = []
  let buffer: NotationInfo[] = []

  for (const line of lines) {
    buffer = buffer.concat(line)
    if (lineCharCount(buffer) >= threshold) {
      merged.push(buffer)
      buffer = []
    }
  }
  if (buffer.length > 0) {
    // Trailing short fragment: append to the previous line so we don't leave a stub.
    if (merged.length > 0) {
      merged[merged.length - 1] = merged[merged.length - 1].concat(buffer)
    } else {
      merged.push(buffer)
    }
  }
  return merged
}

export default function Notation({ notation, pinyinOnly = false, letterStates = [], getLetterVisible, hasWrong = false }: NotationProps) {
  const infos: NotationInfo[] = useMemo(() => getNotationInfo(notation), [notation])
  const lines = useMemo(() => mergeShortLines(groupIntoLines(infos)), [infos])
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

    // Group each non-punctuation NotationInfo with any immediately-following
    // punctuation so a "。" never wraps onto its own visual line, breaking
    // away from the character it belongs to.
    const groupIntoUnits = (lineInfos: NotationInfo[]): NotationInfo[][] => {
      const units: NotationInfo[][] = []
      let current: NotationInfo[] = []
      for (const info of lineInfos) {
        if (isPunctuation(info.word) && current.length > 0) {
          current.push(info)
        } else {
          if (current.length) units.push(current)
          current = [info]
        }
      }
      if (current.length) units.push(current)
      return units
    }

    return (
      <div
        className={`mx-auto mb-2 flex max-w-4xl flex-col items-center overflow-y-auto ${hasWrong ? style.wrong : ''}`}
        style={{ maxHeight: 'calc(100vh - 220px)' }}
      >
        {lines.map((lineInfos, lineIndex) => {
          const units = groupIntoUnits(lineInfos)
          return (
            <div key={lineIndex} className="flex flex-wrap justify-center">
              {units.map((unit, unitIndex) => (
                // Each unit (word + trailing punctuation) is a single flex
                // child of the wrap container, so the punctuation cannot wrap
                // away from its character.
                <div key={`${lineIndex}-${unitIndex}`} className="flex">
                  {unit.map(({ word, phonetic }, infoIndex) => {
                    const isPunct = isPunctuation(word)
                    const chars = word.split('')
                    return (
                      <div key={`${lineIndex}-${unitIndex}-${infoIndex}`} className={`flex ${isPunct ? '' : ''}`}>
                        {chars.map((char, charOffset) => {
                          const currentCharIndex = charIndex
                          charIndex++

                          const isPunctChar = isPunctuation(char)
                          const state = letterStates[currentCharIndex] || 'normal'
                          const visible = getLetterVisible ? getLetterVisible(currentCharIndex) : true

                          let charPinyin = ''
                          if (!isPunctChar && phonetic) {
                            if (chars.length === 1) {
                              charPinyin = phonetic
                            } else {
                              charPinyin = charOffset === 0 ? phonetic : ''
                            }
                          }

                          return (
                            <div
                              key={`${lineIndex}-${unitIndex}-${infoIndex}-${charOffset}`}
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
              ))}
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
