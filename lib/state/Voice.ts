import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { Storage } from '@lib/enums/Storage'
import { createMMKVStorage } from '@lib/storage/MMKV'

export type TTSProviderName = 'device' | 'elevenlabs' | 'minimax'
export type STTProviderName = 'device' | 'openrouter'

export type ElevenLabsConfig = {
    apiKey: string
    voiceId: string
    modelId: string
    stability: number
    similarityBoost: number
    style: number
    speed: number
}

export type MinimaxConfig = {
    apiKey: string
    groupId: string
    endpoint: string
    model: string
    voiceId: string
    emotion: string
    speed: number
    languageBoost: string
}

export type RemoteSTTConfig = {
    apiKey: string
    endpoint: string
    model: string
}

type VoiceState = {
    ttsProvider: TTSProviderName
    elevenlabs: ElevenLabsConfig
    minimax: MinimaxConfig
    sttProvider: STTProviderName
    sttLanguage: string
    remoteSTT: RemoteSTTConfig
    /** Keeps the microphone open while the assistant speaks, letting the user interrupt it */
    bargeIn: boolean
    setTTSProvider: (provider: TTSProviderName) => void
    setElevenLabs: (config: Partial<ElevenLabsConfig>) => void
    setMinimax: (config: Partial<MinimaxConfig>) => void
    setSTTProvider: (provider: STTProviderName) => void
    setSTTLanguage: (language: string) => void
    setRemoteSTT: (config: Partial<RemoteSTTConfig>) => void
    setBargeIn: (value: boolean) => void
}

export const defaultElevenLabs: ElevenLabsConfig = {
    apiKey: '',
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    modelId: 'eleven_flash_v2_5',
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0,
    speed: 1,
}

export const defaultMinimax: MinimaxConfig = {
    apiKey: '',
    groupId: '',
    endpoint: 'https://api.minimax.io/v1/t2a_v2',
    model: 'speech-02-turbo',
    voiceId: 'Wise_Woman',
    emotion: '',
    speed: 1,
    languageBoost: 'auto',
}

export const defaultRemoteSTT: RemoteSTTConfig = {
    apiKey: '',
    endpoint: 'https://openrouter.ai/api/v1/audio/transcriptions',
    model: 'openai/whisper-1',
}

export const useVoiceStore = create<VoiceState>()(
    persist(
        (set, get) => ({
            ttsProvider: 'device',
            elevenlabs: defaultElevenLabs,
            minimax: defaultMinimax,
            sttProvider: 'device',
            sttLanguage: 'en-US',
            remoteSTT: defaultRemoteSTT,
            bargeIn: false,
            setTTSProvider: (provider) => set({ ttsProvider: provider }),
            setElevenLabs: (config) => set({ elevenlabs: { ...get().elevenlabs, ...config } }),
            setMinimax: (config) => set({ minimax: { ...get().minimax, ...config } }),
            setSTTProvider: (provider) => set({ sttProvider: provider }),
            setSTTLanguage: (language) => set({ sttLanguage: language }),
            setRemoteSTT: (config) => set({ remoteSTT: { ...get().remoteSTT, ...config } }),
            setBargeIn: (value) => set({ bargeIn: value }),
        }),
        {
            name: Storage.Voice,
            storage: createMMKVStorage(),
            version: 1,
        }
    )
)
