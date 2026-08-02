import { pronunciationConfigAtom } from '@/store'
import type { PronunciationType } from '@/typings'
import { addHowlListener } from '@/utils'
import { romajiToHiragana } from '@/utils/kana'
import noop from '@/utils/noop'
import type { Howl } from 'howler'
import { useAtomValue } from 'jotai'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import useSound from 'use-sound'
import type { HookOptions } from 'use-sound/dist/types'

const pronunciationApi = 'https://dict.youdao.com/dictvoice?audio='

// ---- Azure TTS (zh) ----
// We POST SSML to a same-origin /tts/synthesize endpoint. The subscription key
// is injected server-side (nginx in prod, Vite dev proxy in dev) so it is never
// exposed to the browser. If the endpoint is unreachable we fall back to Youdao.
const AZURE_VOICE = 'zh-CN-Xiaoxiao:DragonHDFlashLatestNeural'
const AZURE_TTS_ENDPOINT = '/tts/synthesize'
const azureTtsCache = new Map<string, string>()
const azureTtsPending = new Map<string, Promise<string>>()
let azureTtsAvailable = true // turned off after the first failure to avoid repeated 502s

function escapeSsml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export function isAzureTtsConfigured(): boolean {
  return azureTtsAvailable
}

export async function fetchAzureTtsUrl(text: string): Promise<string> {
  const cached = azureTtsCache.get(text)
  if (cached) return cached
  const pending = azureTtsPending.get(text)
  if (pending) return pending

  const ssml = `<speak version="1.0" xml:lang="zh-CN"><voice name="${AZURE_VOICE}">${escapeSsml(text)}</voice></speak>`
  const promise = fetch(AZURE_TTS_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
    },
    body: ssml,
  })
    .then(async (res) => {
      if (!res.ok) {
        const detail = await res.text().catch(() => '')
        throw new Error(`Azure TTS error ${res.status}: ${detail.slice(0, 200)}`)
      }
      // Re-wrap the bytes with an explicit MIME type — some proxies/CDNs strip
      // Content-Type which leaves a `blob:` URL the browser refuses to play.
      const buf = await res.arrayBuffer()
      const blob = new Blob([buf], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      azureTtsCache.set(text, url)
      return url
    })
    .catch((err) => {
      azureTtsAvailable = false
      throw err
    })
    .finally(() => {
      azureTtsPending.delete(text)
    })
  azureTtsPending.set(text, promise)
  return promise
}

export function generateWordSoundSrc(word: string, pronunciation: Exclude<PronunciationType, false>): string {
  switch (pronunciation) {
    case 'uk':
      return `${pronunciationApi}${word}&type=1`
    case 'us':
      return `${pronunciationApi}${word}&type=2`
    case 'romaji':
      return `${pronunciationApi}${romajiToHiragana(word)}&le=jap`
    case 'zh':
      return `${pronunciationApi}${word}&le=zh`
    case 'ja':
      return `${pronunciationApi}${word}&le=jap`
    case 'de':
      return `${pronunciationApi}${word}&le=de`
    case 'hapin':
    case 'kk':
      return `${pronunciationApi}${word}&le=ru` // 有道不支持哈萨克语, 暂时用俄语发音兜底
    case 'id':
      return `${pronunciationApi}${word}&le=id`
    default:
      return ''
  }
}

export default function usePronunciationSound(word: string, isLoop?: boolean) {
  const pronunciationConfig = useAtomValue(pronunciationConfigAtom)
  const loop = useMemo(() => (typeof isLoop === 'boolean' ? isLoop : pronunciationConfig.isLoop), [isLoop, pronunciationConfig.isLoop])
  const [isPlaying, setIsPlaying] = useState(false)

  const pronunciationType = pronunciationConfig.type
  const useAzure = pronunciationType === 'zh' && isAzureTtsConfigured()

  // Non-Azure path uses the existing useSound/Howler pipeline with a URL.
  const fallbackUrl = useMemo(
    () => (pronunciationType ? generateWordSoundSrc(word, pronunciationType) : ''),
    [word, pronunciationType],
  )
  // useSound is always called for non-Azure paths; when useAzure we feed it '' so it does nothing.
  const howlerUrl = useAzure ? '' : fallbackUrl

  const [howlerPlay, { stop: howlerStop, sound }] = useSound(howlerUrl, {
    html5: true,
    format: ['mp3'],
    loop,
    volume: pronunciationConfig.volume,
    rate: pronunciationConfig.rate,
  } as HookOptions)

  useEffect(() => {
    if (useAzure || !sound) return
    sound.loop(loop)
    return noop
  }, [loop, sound, useAzure])

  useEffect(() => {
    if (useAzure || !sound) return
    const unListens: Array<() => void> = []

    unListens.push(addHowlListener(sound, 'play', () => setIsPlaying(true)))
    unListens.push(addHowlListener(sound, 'end', () => setIsPlaying(false)))
    unListens.push(addHowlListener(sound, 'pause', () => setIsPlaying(false)))
    unListens.push(addHowlListener(sound, 'playerror', () => setIsPlaying(false)))

    return () => {
      setIsPlaying(false)
      unListens.forEach((unListen) => unListen())
      ;(sound as Howl).unload()
    }
  }, [sound, useAzure])

  // ---- Azure native <audio> path ----
  // Howler/useSound has been flaky with blob: URLs in our setup, so we drive the
  // playback ourselves via a vanilla HTMLAudioElement.
  const azureAudioRef = useRef<HTMLAudioElement | null>(null)

  // (Re)create / configure the Audio element whenever the word or volume/rate/loop change.
  useEffect(() => {
    if (!useAzure) {
      // tear down the azure audio when switching away
      if (azureAudioRef.current) {
        azureAudioRef.current.pause()
        azureAudioRef.current.src = ''
        azureAudioRef.current = null
      }
      return
    }

    let cancelled = false
    const audio = azureAudioRef.current ?? new Audio()
    azureAudioRef.current = audio
    audio.preload = 'auto'
    audio.volume = pronunciationConfig.volume
    audio.playbackRate = pronunciationConfig.rate
    audio.loop = loop

    const onPlay = () => setIsPlaying(true)
    const onEnd = () => {
      setIsPlaying(false)
      if (audio.loop) {
        // some browsers don't auto-restart when looping a blob; force it
        audio.currentTime = 0
        audio.play().catch(() => {})
      }
    }
    const onPause = () => setIsPlaying(false)
    const onError = () => {
      setIsPlaying(false)
      console.error('[Azure TTS] <audio> playback error', audio.error)
    }
    audio.addEventListener('play', onPlay)
    audio.addEventListener('ended', onEnd)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('error', onError)

    fetchAzureTtsUrl(word)
      .then((url) => {
        if (cancelled) return
        // Only update src if it changed to avoid an unnecessary reload.
        if (audio.src !== url) {
          audio.src = url
          audio.load()
        }
      })
      .catch((err) => {
        console.error('[Azure TTS] fetch failed:', err)
      })

    return () => {
      cancelled = true
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('ended', onEnd)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('error', onError)
      audio.pause()
      setIsPlaying(false)
    }
  }, [useAzure, word, loop, pronunciationConfig.volume, pronunciationConfig.rate])

  const play = useCallback(() => {
    if (useAzure) {
      const audio = azureAudioRef.current
      if (!audio) return
      // Restart from the beginning each click.
      audio.currentTime = 0
      const p = audio.play()
      if (p && typeof p.catch === 'function') {
        p.catch((err) => {
          console.error('[Azure TTS] play() rejected:', err)
        })
      }
    } else {
      howlerPlay()
    }
  }, [useAzure, howlerPlay])

  const stop = useCallback(() => {
    if (useAzure) {
      const audio = azureAudioRef.current
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }
    } else {
      howlerStop()
    }
  }, [useAzure, howlerStop])

  return { play, stop, isPlaying }
}

export function usePrefetchPronunciationSound(word: string | undefined) {
  const pronunciationConfig = useAtomValue(pronunciationConfigAtom)

  useEffect(() => {
    if (!word) return

    // For Azure TTS (zh), warm the cache by firing the request once. Result is cached as a blob URL.
    if (pronunciationConfig.type === 'zh' && isAzureTtsConfigured()) {
      fetchAzureTtsUrl(word).catch(() => {
        /* ignore prefetch errors */
      })
      return
    }

    const soundUrl = generateWordSoundSrc(word, pronunciationConfig.type)
    if (soundUrl === '') return

    const head = document.head
    const isPrefetch = (Array.from(head.querySelectorAll('link[href]')) as HTMLLinkElement[]).some((el) => el.href === soundUrl)

    if (!isPrefetch) {
      const audio = new Audio()
      audio.src = soundUrl
      audio.preload = 'auto'

      // gpt 说这这两行能尽可能规避下载插件被触发问题。 本地测试不加也可以，考虑到别的插件可能有问题，所以加上保险
      audio.crossOrigin = 'anonymous'
      audio.style.display = 'none'

      head.appendChild(audio)

      return () => {
        head.removeChild(audio)
      }
    }
  }, [pronunciationConfig.type, word])
}
