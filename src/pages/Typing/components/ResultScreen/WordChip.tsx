import usePronunciationSound from '@/hooks/usePronunciation'
import { currentDictInfoAtom } from '@/store'
import type { WordWithIndex } from '@/typings'
import { flip, offset, shift, useFloating, useHover, useInteractions, useRole } from '@floating-ui/react'
import { useAtomValue } from 'jotai'
import { useCallback, useMemo, useState } from 'react'

// Extract Chinese characters from notation format: 床(chuáng)前(qián) -> 床前
const extractChineseFromNotation = (notation: string): string => {
  return notation.replace(/\(([^)]+)\)/g, '')
}

export default function WordChip({ word }: { word: WordWithIndex }) {
  const [showTranslation, setShowTranslation] = useState(false)
  const currentLanguage = useAtomValue(currentDictInfoAtom).language
  const { x, y, strategy, refs, context } = useFloating({
    open: showTranslation,
    onOpenChange: setShowTranslation,
    middleware: [offset(4), shift(), flip()],
  })
  const hover = useHover(context)
  const role = useRole(context, { role: 'tooltip' })
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, role])
  const { play, stop } = usePronunciationSound(word.name, false)

  const displayWord = useMemo(() => {
    if (currentLanguage === 'zh' && word.notation) {
      return extractChineseFromNotation(word.notation)
    }
    return word.name
  }, [currentLanguage, word.notation, word.name])

  const onClickWord = useCallback(() => {
    stop()
    play()
  }, [play, stop])

  return (
    <>
      <button
        ref={refs.setReference}
        className="word-chip select-all"
        {...getReferenceProps()}
        type="button"
        onClick={onClickWord}
        title={`朗读 ${displayWord}`}
      >
        <span>{displayWord}</span>
      </button>
      {showTranslation && (
        <div
          ref={refs.setFloating}
          className="word-chip-tooltip"
          style={{
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            width: 'max-content',
          }}
          {...getFloatingProps()}
        >
          {word.trans}
        </div>
      )}
    </>
  )
}
