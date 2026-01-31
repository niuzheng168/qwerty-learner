import type { WordUpdateAction } from '../InputHandler'
import { TypingContext } from '@/pages/Typing/store'
import type { CompositionEvent, FormEvent } from 'react'
import { useCallback, useContext, useEffect, useRef, useState } from 'react'

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
      if (data) {
        // Send each character separately for proper validation
        for (const char of data) {
          updateInput({ type: 'add', value: char, event: e as unknown as FormEvent<HTMLTextAreaElement> })
        }
      }
      if (textareaRef.current) {
        textareaRef.current.value = ''
      }
    },
    [updateInput],
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
      className="absolute left-0 top-0 m-0 h-0 w-0 appearance-none overflow-hidden border-0 p-0 focus:outline-none"
      ref={textareaRef}
      autoFocus
      spellCheck="false"
      onCompositionStart={onCompositionStart}
      onCompositionEnd={onCompositionEnd}
      onInput={onInput}
      onBlur={onBlur}
    ></textarea>
  )
}
