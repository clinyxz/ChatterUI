import {
    ExpoSpeechRecognitionErrorCode,
    ExpoSpeechRecognitionModule,
} from 'expo-speech-recognition'

import { Logger } from '@lib/state/Logger'
import { useVoiceStore } from '@lib/state/Voice'

import { transcribeAudioFile } from './RemoteSTT'

export type STTHandlers = {
    /** Fired with partial results while the user speaks, device recognition only */
    onInterim?: (text: string) => void
    /** Fired once when the utterance is complete, may be an empty string */
    onFinal: (text: string) => void
    onError?: (code: ExpoSpeechRecognitionErrorCode, message: string) => void
    onSpeechStart?: () => void
}

let subscriptions: { remove: () => void }[] = []
let running = false
let cancelled = false
let transcript = ''
let recordingUri: string | undefined

const cleanup = () => {
    subscriptions.forEach((subscription) => subscription.remove())
    subscriptions = []
    running = false
}

export const STTEngine = {
    requestPermissions: async () => {
        const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync()
        if (!result.granted) Logger.errorToast('Microphone permission denied')
        return result.granted
    },

    isRunning: () => running,

    start: (handlers: STTHandlers) => {
        if (running) return
        const { sttProvider, sttLanguage } = useVoiceStore.getState()
        const useRemote = sttProvider !== 'device'
        running = true
        cancelled = false
        transcript = ''
        recordingUri = undefined

        subscriptions.push(
            ExpoSpeechRecognitionModule.addListener('speechstart', () => {
                handlers.onSpeechStart?.()
            })
        )

        subscriptions.push(
            ExpoSpeechRecognitionModule.addListener('result', (event) => {
                const text = event.results?.[0]?.transcript ?? ''
                if (event.isFinal) transcript = text
                else handlers.onInterim?.(text)
            })
        )

        subscriptions.push(
            ExpoSpeechRecognitionModule.addListener('audioend', (event) => {
                if (event.uri) recordingUri = event.uri
            })
        )

        subscriptions.push(
            ExpoSpeechRecognitionModule.addListener('error', (event) => {
                if (event.error === 'no-speech' || event.error === 'aborted') return
                Logger.error(`Speech recognition error: ${event.error} - ${event.message}`)
                handlers.onError?.(event.error, event.message)
            })
        )

        subscriptions.push(
            ExpoSpeechRecognitionModule.addListener('end', () => {
                cleanup()
                if (cancelled) return
                if (useRemote) {
                    if (!recordingUri) {
                        handlers.onFinal('')
                        return
                    }
                    transcribeAudioFile(recordingUri).then((text) => {
                        if (cancelled) return
                        handlers.onFinal(text)
                    })
                    return
                }
                handlers.onFinal(transcript)
            })
        )

        try {
            ExpoSpeechRecognitionModule.start({
                lang: sttLanguage,
                interimResults: !useRemote,
                continuous: false,
                addsPunctuation: true,
                maxAlternatives: 1,
                recordingOptions: useRemote ? { persist: true } : undefined,
                iosVoiceProcessingEnabled: true,
            })
        } catch (e) {
            cleanup()
            Logger.errorToast('Failed to start speech recognition')
            Logger.error('Failed to start speech recognition: ' + e)
            handlers.onFinal('')
        }
    },

    /** Requests a final result and ends the session */
    stop: () => {
        if (!running) return
        ExpoSpeechRecognitionModule.stop()
    },

    /** Ends the session without emitting a result */
    abort: () => {
        if (!running) return
        cancelled = true
        ExpoSpeechRecognitionModule.abort()
        cleanup()
    },
}
