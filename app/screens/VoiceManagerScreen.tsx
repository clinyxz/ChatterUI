import { View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useShallow } from 'zustand/react/shallow'

import ThemedButton from '@components/buttons/ThemedButton'
import HorizontalSelector from '@components/input/HorizontalSelector'
import ThemedSlider from '@components/input/ThemedSlider'
import ThemedSwitch from '@components/input/ThemedSwitch'
import ThemedTextInput from '@components/input/ThemedTextInput'
import SectionTitle from '@components/text/SectionTitle'
import HeaderTitle from '@components/views/HeaderTitle'
import { SpeechEngine } from '@lib/engine/Voice/SpeechEngine'
import { useTTSStore } from '@lib/state/TTS'
import { STTProviderName, TTSProviderName, useVoiceStore } from '@lib/state/Voice'

const ttsProviders: { label: string; value: TTSProviderName }[] = [
    { label: 'Device', value: 'device' },
    { label: 'ElevenLabs', value: 'elevenlabs' },
    { label: 'MiniMax', value: 'minimax' },
]

const sttProviders: { label: string; value: STTProviderName }[] = [
    { label: 'Device', value: 'device' },
    { label: 'API (Whisper)', value: 'openrouter' },
]

const VoiceManagerScreen = () => {
    const {
        ttsProvider,
        setTTSProvider,
        elevenlabs,
        setElevenLabs,
        minimax,
        setMinimax,
        sttProvider,
        setSTTProvider,
        sttLanguage,
        setSTTLanguage,
        remoteSTT,
        setRemoteSTT,
        bargeIn,
        setBargeIn,
    } = useVoiceStore(
        useShallow((state) => ({
            ttsProvider: state.ttsProvider,
            setTTSProvider: state.setTTSProvider,
            elevenlabs: state.elevenlabs,
            setElevenLabs: state.setElevenLabs,
            minimax: state.minimax,
            setMinimax: state.setMinimax,
            sttProvider: state.sttProvider,
            setSTTProvider: state.setSTTProvider,
            sttLanguage: state.sttLanguage,
            setSTTLanguage: state.setSTTLanguage,
            remoteSTT: state.remoteSTT,
            setRemoteSTT: state.setRemoteSTT,
            bargeIn: state.bargeIn,
            setBargeIn: state.setBargeIn,
        }))
    )

    const { voice, rate } = useTTSStore(
        useShallow((state) => ({ voice: state.voice, rate: state.rate }))
    )

    const handleTestVoice = () => {
        SpeechEngine.speak('Hello, this is a test of the live voice engine.', { voice, rate })
    }

    return (
        <KeyboardAwareScrollView
            style={{ marginVertical: 16, paddingVertical: 16, paddingHorizontal: 16 }}
            contentContainerStyle={{ rowGap: 8, paddingBottom: 32 }}>
            <HeaderTitle title="Voice" />

            <SectionTitle>Speech Output</SectionTitle>
            <HorizontalSelector
                label="TTS Provider"
                values={ttsProviders}
                selected={ttsProvider}
                onPress={setTTSProvider}
            />

            {ttsProvider === 'device' && (
                <ThemedTextInput
                    label="Device Voice"
                    value={voice?.identifier ?? 'Not set - choose one in the TTS screen'}
                    editable={false}
                />
            )}

            {ttsProvider === 'elevenlabs' && (
                <View style={{ rowGap: 8 }}>
                    <ThemedTextInput
                        label="API Key"
                        value={elevenlabs.apiKey}
                        secureTextEntry
                        onChangeText={(apiKey) => setElevenLabs({ apiKey })}
                    />
                    <ThemedTextInput
                        label="Voice ID"
                        value={elevenlabs.voiceId}
                        onChangeText={(voiceId) => setElevenLabs({ voiceId })}
                    />
                    <ThemedTextInput
                        label="Model ID"
                        value={elevenlabs.modelId}
                        onChangeText={(modelId) => setElevenLabs({ modelId })}
                    />
                    <ThemedSlider
                        label="Stability"
                        min={0}
                        max={1}
                        step={0.05}
                        precision={2}
                        value={elevenlabs.stability}
                        onValueChange={(stability) => setElevenLabs({ stability })}
                    />
                    <ThemedSlider
                        label="Similarity Boost"
                        min={0}
                        max={1}
                        step={0.05}
                        precision={2}
                        value={elevenlabs.similarityBoost}
                        onValueChange={(similarityBoost) => setElevenLabs({ similarityBoost })}
                    />
                    <ThemedSlider
                        label="Style"
                        min={0}
                        max={1}
                        step={0.05}
                        precision={2}
                        value={elevenlabs.style}
                        onValueChange={(style) => setElevenLabs({ style })}
                    />
                    <ThemedSlider
                        label="Speed"
                        min={0.7}
                        max={1.2}
                        step={0.05}
                        precision={2}
                        value={elevenlabs.speed}
                        onValueChange={(speed) => setElevenLabs({ speed })}
                    />
                </View>
            )}

            {ttsProvider === 'minimax' && (
                <View style={{ rowGap: 8 }}>
                    <ThemedTextInput
                        label="API Key"
                        value={minimax.apiKey}
                        secureTextEntry
                        onChangeText={(apiKey) => setMinimax({ apiKey })}
                    />
                    <ThemedTextInput
                        label="Group ID"
                        value={minimax.groupId}
                        onChangeText={(groupId) => setMinimax({ groupId })}
                    />
                    <ThemedTextInput
                        label="Endpoint"
                        value={minimax.endpoint}
                        onChangeText={(endpoint) => setMinimax({ endpoint })}
                    />
                    <ThemedTextInput
                        label="Model"
                        value={minimax.model}
                        onChangeText={(model) => setMinimax({ model })}
                    />
                    <ThemedTextInput
                        label="Voice ID"
                        value={minimax.voiceId}
                        onChangeText={(voiceId) => setMinimax({ voiceId })}
                    />
                    <ThemedTextInput
                        label="Emotion"
                        value={minimax.emotion}
                        placeholder="happy, sad, angry..."
                        onChangeText={(emotion) => setMinimax({ emotion })}
                    />
                    <ThemedTextInput
                        label="Language Boost"
                        value={minimax.languageBoost}
                        onChangeText={(languageBoost) => setMinimax({ languageBoost })}
                    />
                    <ThemedSlider
                        label="Speed"
                        min={0.5}
                        max={2}
                        step={0.1}
                        precision={1}
                        value={minimax.speed}
                        onValueChange={(speed) => setMinimax({ speed })}
                    />
                </View>
            )}

            <ThemedButton label="Test Voice" variant="secondary" onPress={handleTestVoice} />

            <SectionTitle style={{ marginTop: 16 }}>Speech Input</SectionTitle>
            <HorizontalSelector
                label="STT Provider"
                values={sttProviders}
                selected={sttProvider}
                onPress={setSTTProvider}
            />
            <ThemedTextInput
                label="Language"
                value={sttLanguage}
                placeholder="en-US"
                onChangeText={setSTTLanguage}
            />

            {sttProvider === 'openrouter' && (
                <View style={{ rowGap: 8 }}>
                    <ThemedTextInput
                        label="Transcription Endpoint"
                        value={remoteSTT.endpoint}
                        onChangeText={(endpoint) => setRemoteSTT({ endpoint })}
                    />
                    <ThemedTextInput
                        label="Transcription Model"
                        value={remoteSTT.model}
                        onChangeText={(model) => setRemoteSTT({ model })}
                    />
                    <ThemedTextInput
                        label="API Key"
                        description="Leave blank to reuse the key of an active OpenRouter connection"
                        value={remoteSTT.apiKey}
                        secureTextEntry
                        onChangeText={(apiKey) => setRemoteSTT({ apiKey })}
                    />
                </View>
            )}

            <ThemedSwitch
                label="Allow Interruptions"
                description="Keeps the microphone open while the assistant speaks. May cause echo on speakers."
                value={bargeIn}
                onChangeValue={setBargeIn}
            />
        </KeyboardAwareScrollView>
    )
}

export default VoiceManagerScreen
