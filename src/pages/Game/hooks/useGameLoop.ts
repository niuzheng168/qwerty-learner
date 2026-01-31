import { useEffect, useRef } from 'react'

export function useGameLoop(callback: (deltaTime: number) => void, isActive: boolean) {
  const callbackRef = useRef(callback)
  const previousTimeRef = useRef<number>()
  const requestRef = useRef<number>()

  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (!isActive) {
      previousTimeRef.current = undefined
      return
    }

    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        const deltaTime = time - previousTimeRef.current
        callbackRef.current(deltaTime)
      }
      previousTimeRef.current = time
      requestRef.current = requestAnimationFrame(animate)
    }

    requestRef.current = requestAnimationFrame(animate)
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [isActive])
}
