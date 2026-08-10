import { create } from 'zustand'

import { generateResponse } from '@lib/engine/Inference'
import { SpeechEngine } from '@lib/engine/Voice/SpeechEngine'
import { STTEngine } from '@lib/engine/Voice/STTEngine'
import { Characters } from '@lib/state/Characters'
import { Chats, useInference } from '@lib/state/Chat'
import { Logger } from '@lib/state/Logger'
import { useTTSStore } from '@lib/state/TTS'
import { useVoiceStore } from '@lib/state/Voice'

export type LiveStatus = 'idle' | 'listening' | 'thinking' | 'speaking'

type LiveModeState = {
    active: boolean
    status: LiveStatus
    muted: boolean
    /** Partial transcript of the ongoing utterance */
    interim: string
    lastUserText: string
    start: () => Promise<void>
    stop: () => Promise<void>
    setMuted: (muted: boolean) => void
    submit: (text: string) => Promise<void>
}

/** TTS settings which live mode temporarily overrides */
let previousTTSSettings: { enabled: boolean; liveTTS: boolean; auto: boolean } | undefined
let unsubscribers: (() => void)[] = []
let listenTimeout: ReturnType<typeof setTimeout> | undefined

const clearListenTimeout = () => {
    if (listenTimeout) clearTimeout(listenTimeout)
    listenTimeout = undefined
}

export const useLiveModeStore = create<LiveModeState>()((set, get) => {
    const listen = () => {
        if (!get().active || get().muted || STTEngine.isRunning()) return
        if (useInference.getState().nowGenerating) return
        if (SpeechEngine.isSpeaking() && !useVoiceStore.getState().bargeIn) {
            set({ status: 'speaking' })
            return
        }
        set({ interim: '' })
        STTEngine.start({
            onInterim: (text) => set({ interim: text }),
            onSpeechStart: () => {
                if (SpeechEngine.isSpeaking()) {
                    SpeechEngine.stop()
                    useInference.getState().abortFunction?.()
                }
            },
            onFinal: (text) => {
                if (!get().active) return
                if (!text.trim()) {
                    evaluate()
                    return
                }
                get().submit(text)
            },
            onError: () => {
                if (!get().active) return
                evaluate()
            },
        })
        set({ status: 'listening' })
    }

    const evaluate = () => {
        clearListenTimeout()
        if (!get().active) return
        if (useInference.getState().nowGenerating) {
            set({ status: 'thinking' })
            return
        }
        const speaking = SpeechEngine.isSpeaking()
        if (speaking && !useVoiceStore.getState().bargeIn) {
            set({ status: 'speaking' })
            return
        }
        if (get().muted) {
            set({ status: speaking ? 'speaking' : 'idle' })
            return
        }
        if (speaking) set({ status: 'speaking' })
        // A short delay avoids the recognizer picking up the tail of the previous playback
        listenTimeout = setTimeout(listen, 300)
    }

    return {
        active: false,
        status: 'idle',
        muted: false,
        interim: '',
        lastUserText: '',

        start: async () => {
            if (get().active) return
            const granted = await STTEngine.requestPermissions()
            if (!granted) return
            await SpeechEngine.prepareAudioSession()

            const ttsState = useTTSStore.getState()
            previousTTSSettings = {
                enabled: ttsState.enabled,
                liveTTS: ttsState.liveTTS,
                auto: ttsState.auto,
            }
            ttsState.setEnabled(true)
            ttsState.setAuto(false)
            ttsState.setLiveTTS(true)

            unsubscribers.push(SpeechEngine.addIdleListener(() => evaluate()))
            unsubscribers.push(useInference.subscribe(() => evaluate()))

            set({ active: true, muted: false, interim: '', status: 'idle' })
            Logger.info('Live mode started')
            evaluate()
        },

        stop: async () => {
            if (!get().active) return
            set({ active: false, status: 'idle', interim: '' })
            clearListenTimeout()
            unsubscribers.forEach((unsubscribe) => unsubscribe())
            unsubscribers = []
            STTEngine.abort()
            await SpeechEngine.stop()
            if (previousTTSSettings) {
                const ttsState = useTTSStore.getState()
                ttsState.setEnabled(previousTTSSettings.enabled)
                ttsState.setLiveTTS(previousTTSSettings.liveTTS)
                ttsState.setAuto(previousTTSSettings.auto)
                previousTTSSettings = undefined
            }
            Logger.info('Live mode stopped')
        },

        setMuted: (muted) => {
            set({ muted })
            if (muted) {
                STTEngine.abort()
                set({ status: SpeechEngine.isSpeaking() ? 'speaking' : 'idle', interim: '' })
                return
            }
            evaluate()
        },

        submit: async (text) => {
            const userName = Characters.useUserStore.getState().card?.name ?? ''
            const charName = Characters.useCharacterStore.getState().card?.name ?? ''
            set({ status: 'thinking', lastUserText: text, interim: '' })
            const chatState = Chats.useChatState.getState()
            await chatState.addEntry(userName, true, text)
            const swipeId = await chatState.addEntry(charName, false, '')
            if (swipeId) await generateResponse(swipeId)
        },
    }
})
