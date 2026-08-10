import { MaterialIcons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from 'react-native-reanimated'
import { useShallow } from 'zustand/react/shallow'

import HeaderTitle from '@components/views/HeaderTitle'
import { Characters } from '@lib/state/Characters'
import { Chats } from '@lib/state/Chat'
import { LiveStatus, useLiveModeStore } from '@lib/state/LiveMode'
import { Theme } from '@lib/theme/ThemeManager'

const statusLabel: Record<LiveStatus, string> = {
    idle: 'Tap the mic to talk',
    listening: 'Listening...',
    thinking: 'Thinking...',
    speaking: 'Speaking...',
}

const LiveScreen = () => {
    const router = useRouter()
    const { color, spacing, fontSize, borderRadius } = Theme.useTheme()

    const { active, status, muted, interim, lastUserText, start, stop, setMuted } =
        useLiveModeStore(
            useShallow((state) => ({
                active: state.active,
                status: state.status,
                muted: state.muted,
                interim: state.interim,
                lastUserText: state.lastUserText,
                start: state.start,
                stop: state.stop,
                setMuted: state.setMuted,
            }))
        )

    const charName = Characters.useCharacterStore(useShallow((state) => state.card?.name))
    const chatExists = Chats.useChatState(useShallow((state) => !!state.data))
    const lastResponse = Chats.useChatState(
        useShallow((state) => {
            const messages = state.data?.messages
            const message = messages?.[messages.length - 1]
            if (!message || message.is_user) return ''
            return message.swipes[message.swipe_id]?.swipe ?? ''
        })
    )

    const pulse = useSharedValue(1)
    const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }))

    useEffect(() => {
        const animating = status === 'listening' || status === 'speaking'
        pulse.value = animating
            ? withRepeat(
                  withTiming(1.12, { duration: 900, easing: Easing.inOut(Easing.ease) }),
                  -1,
                  true
              )
            : withTiming(1, { duration: 200 })
    }, [status, pulse])

    useEffect(() => {
        if (chatExists) start()
        return () => {
            stop()
        }
    }, [chatExists, start, stop])

    const orbColor = () => {
        switch (status) {
            case 'listening':
                return color.primary._500
            case 'thinking':
                return color.neutral._400
            case 'speaking':
                return color.primary._300
            default:
                return color.neutral._300
        }
    }

    const handleEnd = async () => {
        await stop()
        router.back()
    }

    return (
        <View style={{ flex: 1, paddingHorizontal: spacing.xl2, paddingVertical: spacing.xl2 }}>
            <HeaderTitle title={charName ? `Live - ${charName}` : 'Live'} />
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', rowGap: 24 }}>
                <Animated.View
                    style={[
                        {
                            width: 180,
                            height: 180,
                            borderRadius: 90,
                            backgroundColor: orbColor(),
                            alignItems: 'center',
                            justifyContent: 'center',
                        },
                        pulseStyle,
                    ]}>
                    <MaterialIcons
                        name={muted ? 'mic-off' : 'graphic-eq'}
                        size={64}
                        color={color.neutral._100}
                    />
                </Animated.View>
                <Text style={{ color: color.text._100, fontSize: fontSize.xl }}>
                    {active ? statusLabel[status] : 'Live mode inactive'}
                </Text>
                {!chatExists && (
                    <Text style={{ color: color.error._400, textAlign: 'center' }}>
                        Open a chat before starting live mode
                    </Text>
                )}
            </View>

            <ScrollView
                style={{
                    maxHeight: 200,
                    backgroundColor: color.neutral._200,
                    borderRadius: borderRadius.l,
                    padding: spacing.l,
                    marginBottom: spacing.xl,
                }}
                contentContainerStyle={{ rowGap: spacing.m }}>
                {!!(interim || lastUserText) && (
                    <Text style={{ color: color.text._400, fontStyle: 'italic' }}>
                        {interim || lastUserText}
                    </Text>
                )}
                {!!lastResponse && <Text style={{ color: color.text._100 }}>{lastResponse}</Text>}
            </ScrollView>

            <View
                style={{
                    flexDirection: 'row',
                    justifyContent: 'space-evenly',
                    alignItems: 'center',
                    marginBottom: spacing.xl2,
                }}>
                <TouchableOpacity
                    onPress={() => setMuted(!muted)}
                    style={{
                        padding: spacing.xl,
                        borderRadius: 48,
                        backgroundColor: muted ? color.neutral._300 : color.primary._500,
                    }}>
                    <MaterialIcons
                        name={muted ? 'mic-off' : 'mic'}
                        size={32}
                        color={color.neutral._100}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={handleEnd}
                    style={{
                        padding: spacing.xl,
                        borderRadius: 48,
                        backgroundColor: color.error._500,
                    }}>
                    <MaterialIcons name="call-end" size={32} color={color.neutral._100} />
                </TouchableOpacity>
            </View>
        </View>
    )
}

export default LiveScreen
