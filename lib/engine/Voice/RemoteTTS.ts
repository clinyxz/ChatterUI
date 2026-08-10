import { randomUUID } from 'expo-crypto'
import { Directory, File, Paths } from 'expo-file-system'

import { Logger } from '@lib/state/Logger'
import { TTSProviderName, useVoiceStore } from '@lib/state/Voice'

const voiceCacheDirectory = new Directory(Paths.cache, 'voice')

const hexToBytes = (hex: string) => {
    const clean = hex.trim()
    const bytes = new Uint8Array(Math.floor(clean.length / 2))
    for (let i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(clean.substring(i * 2, i * 2 + 2), 16)
    }
    return bytes
}

const createAudioFile = (extension: string) => {
    voiceCacheDirectory.create({ idempotent: true, intermediates: true })
    return new File(voiceCacheDirectory, `${randomUUID()}.${extension}`)
}

const synthesizeElevenLabs = async (text: string, signal?: AbortSignal) => {
    const config = useVoiceStore.getState().elevenlabs
    if (!config.apiKey) {
        Logger.errorToast('No ElevenLabs API key set')
        return
    }
    const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}/with-timestamps?output_format=mp3_44100_128`,
        {
            method: 'POST',
            signal: signal,
            headers: {
                'xi-api-key': config.apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                model_id: config.modelId,
                voice_settings: {
                    stability: config.stability,
                    similarity_boost: config.similarityBoost,
                    style: config.style,
                    speed: config.speed,
                },
            }),
        }
    )

    if (!response.ok) {
        Logger.errorToast(`ElevenLabs TTS failed: ${response.status}`)
        Logger.error(await response.text())
        return
    }

    const data = await response.json()
    const audio: string | undefined = data?.audio_base64
    if (!audio) {
        Logger.errorToast('ElevenLabs returned no audio')
        return
    }
    const file = createAudioFile('mp3')
    file.write(audio, { encoding: 'base64' })
    return file.uri
}

const synthesizeMinimax = async (text: string, signal?: AbortSignal) => {
    const config = useVoiceStore.getState().minimax
    if (!config.apiKey) {
        Logger.errorToast('No MiniMax API key set')
        return
    }
    const endpoint = config.groupId
        ? `${config.endpoint}?GroupId=${config.groupId}`
        : config.endpoint

    const response = await fetch(endpoint, {
        method: 'POST',
        signal: signal,
        headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: config.model,
            text: text,
            stream: false,
            output_format: 'hex',
            language_boost: config.languageBoost || 'auto',
            voice_setting: {
                voice_id: config.voiceId,
                speed: config.speed,
                vol: 1,
                pitch: 0,
                ...(config.emotion ? { emotion: config.emotion } : {}),
            },
            audio_setting: {
                sample_rate: 32000,
                bitrate: 128000,
                format: 'mp3',
                channel: 1,
            },
        }),
    })

    if (!response.ok) {
        Logger.errorToast(`MiniMax TTS failed: ${response.status}`)
        Logger.error(await response.text())
        return
    }

    const data = await response.json()
    const status = data?.base_resp?.status_code
    if (status !== undefined && status !== 0) {
        Logger.errorToast(`MiniMax TTS error: ${data?.base_resp?.status_msg}`)
        return
    }
    const audio: string | undefined = data?.data?.audio
    if (!audio) {
        Logger.errorToast('MiniMax returned no audio')
        return
    }
    const file = createAudioFile('mp3')
    file.write(hexToBytes(audio))
    return file.uri
}

/**
 * Synthesizes text using the configured remote provider
 * @param text text to synthesize
 * @param signal optional abort signal
 * @returns local file uri of the generated audio, undefined on failure
 */
export const synthesizeRemoteAudio = async (
    text: string,
    signal?: AbortSignal
): Promise<string | undefined> => {
    const provider = useVoiceStore.getState().ttsProvider
    try {
        switch (provider) {
            case 'elevenlabs':
                return await synthesizeElevenLabs(text, signal)
            case 'minimax':
                return await synthesizeMinimax(text, signal)
            default:
                return undefined
        }
    } catch (e) {
        if (signal?.aborted) return undefined
        Logger.errorToast('Speech synthesis failed')
        Logger.error(`${provider} synthesis failed: ${e}`)
        return undefined
    }
}

export const isRemoteTTSProvider = (provider: TTSProviderName) => provider !== 'device'

export const clearVoiceCache = () => {
    try {
        if (voiceCacheDirectory.exists) voiceCacheDirectory.delete()
    } catch (e) {
        Logger.error('Failed to clear voice cache: ' + e)
    }
}
