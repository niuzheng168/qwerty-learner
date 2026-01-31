import type { WordUpdateAction } from '../InputHandler'
import { TypingContext } from '@/pages/Typing/store'
import type { CompositionEvent, FormEvent, KeyboardEvent } from 'react'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'

// Punctuation marks that can be input directly (both Chinese and English)
const punctuations = new Set([
  // Chinese punctuation
  '\uff0c', // ，
  '\u3002', // 。
  '\uff01', // ！
  '\uff1f', // ？
  '\u3001', // 、
  '\uff1b', // ；
  '\uff1a', // ：
  '\u201c', // "
  '\u201d', // "
  '\u2018', // '
  '\u2019', // '
  '\uff08', // （
  '\uff09', // ）
  '\u300a', // 《
  '\u300b', // 》
  '\u3010', // 【
  '\u3011', // 】
  '\u2014', // —
  '\u2026', // …
  '\u00b7', // ·
  // English punctuation
  ',',
  '.',
  '!',
  '?',
  ';',
  ':',
  "'",
  '"',
  '(',
  ')',
  '[',
  ']',
  '<',
  '>',
  '-',
])

export default function ChinesePinyinHandler({ updateInput }: { updateInput: (updateObj: WordUpdateAction) => void }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isComposing, setIsComposing] = useState(false)
  // eslint-disable-next-line  @typescript-eslint/no-non-null-assertion
  const { state } = useContext(TypingContext)!

  useEffect(() => {
    if (!textareaRef.current) return

    if (state.isTyping) {
      textareaRef.current.focus()
    } else {
      textareaRef.current.blur()
    }
  }, [state.isTyping])

  const onCompositionStart = useCallback(() => {
    setIsComposing(true)
  }, [])

  const onCompositionEnd = useCallback(
    (e: CompositionEvent<HTMLTextAreaElement>) => {
      setIsComposing(false)
      const data = e.data
      if (data && data.length > 0) {
        // Send all characters from IME composition as a single input
        updateInput({ type: 'add', value: data, event: e as unknown as FormEvent<HTMLTextAreaElement> })
      }
      if (textareaRef.current) {
        textareaRef.current.value = ''
      }
    },
    [updateInput],
  )

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Handle punctuation keys directly when not composing
      if (isComposing) return

      const key = e.key
      // Allow direct punctuation input (both Chinese and English punctuation)
      if (punctuations.has(key)) {
        e.preventDefault()
        updateInput({ type: 'add', value: key, event: e as unknown as FormEvent<HTMLTextAreaElement> })
        if (textareaRef.current) {
          textareaRef.current.value = ''
        }
      }
    },
    [isComposing, updateInput],
  )

  const onInput = useCallback(
    (e: FormEvent<HTMLTextAreaElement>) => {
      // Only handle direct input (non-IME), skip if composing
      if (isComposing) return

      const nativeEvent = e.nativeEvent as InputEvent
      // Handle direct character input (e.g., punctuation or when IME is off)
      if (nativeEvent.data !== null && !nativeEvent.isComposing) {
        for (const char of nativeEvent.data) {
          updateInput({ type: 'add', value: char, event: e })
        }
        if (textareaRef.current) {
          textareaRef.current.value = ''
        }
      }
    },
    [isComposing, updateInput],
  )

  const onBlur = useCallback(() => {
    if (!textareaRef.current) return

    if (state.isTyping) {
      textareaRef.current.focus()
    }
  }, [state.isTyping])

  return (
    <textarea
      className="fixed left-1/2 top-[60%] m-0 h-0 w-0 -translate-x-1/2 appearance-none overflow-hidden border-0 p-0 focus:outline-none"
      ref={textareaRef}
      autoFocus
      spellCheck="false"
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
      onKeyDown={onKeyDown}
      onInput={onInput}
      onBlur={onBlur}
    ></textarea>
  )
}
