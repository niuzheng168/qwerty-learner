import { useCallback, useEffect } from 'react'

export function useKeyboardInput(onKeyPress: (key: string) => void, isActive: boolean) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (/^[a-zA-Z]$/.test(e.key) && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault()
        onKeyPress(e.key.toUpperCase())
      }
    },
    [onKeyPress],
  )

  useEffect(() => {
    if (!isActive) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, isActive])
}
