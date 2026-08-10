import { AudioPlayer, AudioStatus, createAudioPlayer, setAudioModeAsync } from 'expo-audio'
import * as Speech from 'expo-speech'

import { Logger } from '@lib/state/Logger'
import { useVoiceStore } from '@lib/state/Voice'

import { isRemoteTTSProvider, synthesizeRemoteAudio } from './RemoteTTS'

export type SpeakOptions = {
    /** Device TTS voice, ignored by remote providers */
    voice?: Speech.Voice
    rate?: number
    onDone?: () => void
    onStopped?: () => void
}

type SpeechJob = {
    text: string
    options: SpeakOptions
}

type PlaybackSubscription = { remove: () => void }

// expo-modules-core is not hoisted in this project, so the inherited emitter types are unavailable
type PlaybackEmitter = {
    addListener: (
        event: 'playbackStatusUpdate',
        listener: (status: AudioStatus) => void
    ) => PlaybackSubscription
}

let queue: SpeechJob[] = []
let processing = false
let generation = 0
let controller: AbortController | undefined
let player: AudioPlayer | undefined
const idleListeners = new Set<() => void>()

const notifyIdle = () => {
    idleListeners.forEach((listener) => listener())
}

const disposePlayer = () => {
    if (!player) return
    try {
        player.pause()
        player.remove()
    } catch (e) {
        Logger.debug('Failed to dispose audio player: ' + e)
    }
    player = undefined
}

const speakDevice = (text: string, options: SpeakOptions) =>
    new Promise<boolean>((resolve) => {
        Speech.speak(text, {
            language: options.voice?.language,
            voice: options.voice?.identifier,
            rate: options.rate,
            onDone: () => resolve(true),
            onStopped: () => resolve(false),
            onError: () => resolve(false),
        })
    })

const playFile = (uri: string, currentGeneration: number) =>
    new Promise<boolean>((resolve) => {
        try {
            player = createAudioPlayer({ uri })
        } catch (e) {
            Logger.error('Failed to create audio player: ' + e)
            resolve(false)
            return
        }
        let settled = false
        const finish = (completed: boolean) => {
            if (settled) return
            settled = true
            subscription.remove()
            disposePlayer()
            resolve(completed)
        }
        const subscription = (player as unknown as PlaybackEmitter).addListener(
            'playbackStatusUpdate',
            (status) => {
                if (currentGeneration !== generation) {
                    finish(false)
                    return
                }
                if (status.didJustFinish) finish(true)
            }
        )
        player.play()
    })

const processQueue = async () => {
    if (processing) return
    processing = true
    const currentGeneration = generation
    while (queue.length > 0 && currentGeneration === generation) {
        const job = queue.shift()
        if (!job) break
        const provider = useVoiceStore.getState().ttsProvider
        let completed = false
        if (isRemoteTTSProvider(provider)) {
            controller = new AbortController()
            const uri = await synthesizeRemoteAudio(job.text, controller.signal)
            controller = undefined
            if (currentGeneration !== generation) break
            if (uri) completed = await playFile(uri, currentGeneration)
        } else {
            completed = await speakDevice(job.text, job.options)
        }
        if (currentGeneration !== generation) {
            job.options.onStopped?.()
            break
        }
        if (completed) job.options.onDone?.()
        else job.options.onStopped?.()
    }
    processing = false
    if (currentGeneration === generation && queue.length === 0) notifyIdle()
}

/**
 * Unified speech output which routes between the device TTS engine and remote providers
 */
export const SpeechEngine = {
    speak: (text: string, options: SpeakOptions = {}) => {
        const clean = text.trim()
        if (!clean) {
            options.onDone?.()
            return
        }
        queue.push({ text: clean, options: options })
        processQueue()
    },

    stop: async () => {
        generation += 1
        const pending = queue
        queue = []
        controller?.abort()
        controller = undefined
        disposePlayer()
        await Speech.stop()
        pending.forEach((job) => job.options.onStopped?.())
        notifyIdle()
    },

    isSpeaking: () => processing || queue.length > 0,

    addIdleListener: (listener: () => void) => {
        idleListeners.add(listener)
        return () => {
            idleListeners.delete(listener)
        }
    },

    /** Prepares the audio session so speech plays through the main speaker */
    prepareAudioSession: async () => {
        try {
            await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: false })
        } catch (e) {
            Logger.debug('Failed to set audio mode: ' + e)
        }
    },
}
