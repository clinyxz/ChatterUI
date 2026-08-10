import { File } from 'expo-file-system'

import { APIManager } from '@lib/engine/API/APIManagerState'
import { Logger } from '@lib/state/Logger'
import { useVoiceStore } from '@lib/state/Voice'

const openRouterEndpoint = 'openrouter.ai'

/**
 * Falls back to the key of an active OpenRouter connection when no dedicated key is set
 */
const getTranscriptionKey = () => {
    const { apiKey, endpoint } = useVoiceStore.getState().remoteSTT
    if (apiKey) return apiKey
    if (!endpoint.includes(openRouterEndpoint)) return ''
    const apiState = APIManager.useConnectionsStore.getState()
    const active = apiState.values[apiState.activeIndex]
    if (active?.configName === 'Open Router') return active.key
    return ''
}

/**
 * Transcribes a local audio file using an OpenAI-compatible transcription endpoint
 * @param uri local file uri of the recording
 * @param format audio container format, eg 'wav'
 * @returns transcribed text, empty on failure
 */
export const transcribeAudioFile = async (uri: string, format: string = 'wav') => {
    const { endpoint, model } = useVoiceStore.getState().remoteSTT
    const language = useVoiceStore.getState().sttLanguage.split('-')[0]
    const key = getTranscriptionKey()
    if (!key) {
        Logger.errorToast('No transcription API key set')
        return ''
    }

    try {
        const data = await new File(uri).base64()
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${key}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                input_audio: { data: data, format: format },
                language: language,
            }),
        })
        if (!response.ok) {
            Logger.errorToast(`Transcription failed: ${response.status}`)
            Logger.error(await response.text())
            return ''
        }
        const result = await response.json()
        return (result?.text ?? '') as string
    } catch (e) {
        Logger.errorToast('Transcription failed')
        Logger.error('Transcription failed: ' + e)
        return ''
    }
}
