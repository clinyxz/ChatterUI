# ChatterUI - A simple app for LLMs

ChatterUI is a native mobile frontend for LLMs.

Run LLMs on device or connect to various commercial or open source APIs. ChatterUI aims to provide a mobile-friendly interface with fine-grained control over chat structuring.

If you like the app, feel free support me here:

<a href='https://ko-fi.com/W7W7X8T7W' target='_blank'><img height='42' style='border:0px;height:42px;' src='https://storage.ko-fi.com/cdn/kofi6.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>

<div>
Chat With Characters or Assistants
<br/>
<img src ="https://github.com/Vali-98/ChatterUI/blob/master/assets/screenshots/characterlist.png" width="150" > 
<img src ="https://github.com/Vali-98/ChatterUI/blob/master/assets/screenshots/chat.png" width="150" > 
<br/>
Use on-device Models or APIs
<br/>
<img src ="https://github.com/Vali-98/ChatterUI/blob/master/assets/screenshots/models.png" width="150" > 
<img src ="https://github.com/Vali-98/ChatterUI/blob/master/assets/screenshots/api.png" width="150" > 
<br/>
Modify And Customize
<br/>
<img src ="https://github.com/Vali-98/ChatterUI/blob/master/assets/screenshots/charactereditor.png" width="150" > 
<img src ="https://github.com/Vali-98/ChatterUI/blob/master/assets/screenshots/settings.png" width="150" >
<br/>
Personalize Yourself
<br/>
<img src ="https://github.com/Vali-98/ChatterUI/blob/master/assets/screenshots/usereditor.png" width="150" > 
<img src ="https://github.com/Vali-98/ChatterUI/blob/master/assets/screenshots/userlist.png" width="150" >
</div>

## Features:

-   Run LLMs on-device in Local Mode
-   Connect to various APIs in Remote Mode
-   Chat with characters. (Supports the Character Card v2 specification.)
-   Create and manage multiple chats per character.
-   Customize Sampler fields and Instruct formatting
-   Integrates with your device’s text-to-speech (TTS) engine
-   Hands-free Live Mode: talk to any API with speech input and spoken replies

<br/>

# Usage

Download and install latest APK from the [releases](https://github.com/Vali-98/ChatterUI/releases/latest) page.

<i>iOS is Currently unavailable due to lacking iOS hardware for development</i>

## Local Mode

ChatterUI uses a [llama.cpp](https://github.com/ggerganov/llama.cpp) under the hood to run gguf files on device. A custom adapter is used to integrate with react-native: [cui-llama.rn](https://github.com/Vali-98/cui-llama.rn)

To use on-device inferencing, first enable Local Mode, then go to Models > Import Model / Use External Model and choose a gguf model that can fit on your device's memory. The importing functions are as follows:

-   Import Model: Copies the model file into ChatterUI, potentially speeding up startup time.
-   Use External Model: Uses a model from your device storage directly, removing the need to copy large files into ChatterUI but with a slight delay in load times.

After that, you can load the model and begin chatting!

_Note: For devices with Snapdragon 8 Gen 1 and above or Exynos 2200+, it is recommended to use the Q4_0 quantization for optimized performance._

## Remote Mode

Remote Mode allows you to connect to a few common APIs from both commercial and open source projects.

### Open Source Backends:

-   koboldcpp
-   text-generation-webui
-   Ollama

### Dedicated API:

-   OpenAI
-   Claude _(with ability to use a proxy)_
-   Cohere
-   Open Router
-   Mancer
-   AI Horde

### Generic backends:

-   Generic Text Completions
-   Generic Chat Completions

_These should be compliant with any Text Completion/Chat Completion backends such as Groq or Infermatic._

### Custom APIs:

Is your API provider missing? ChatterUI allows you to define APIs using its template system.

Read more about it [here!](https://github.com/Vali-98/ChatterUI/discussions/126)

## Live Mode

Live Mode turns any configured API into a voice assistant: your speech is transcribed, sent to the
active API, and the streamed reply is spoken back sentence by sentence. Open a chat, then select
`Live Voice` from the chat input menu.

Providers are configured under `Settings > Voice`:

-   Speech input: the device recognizer (offline capable, no key) or any OpenAI-compatible
    transcription endpoint, such as OpenRouter's `/api/v1/audio/transcriptions` with Whisper.
-   Speech output: the device TTS engine, ElevenLabs, or MiniMax T2A.
-   `Allow Interruptions` keeps the microphone open while the reply is spoken so it can be cut off
    mid sentence. Headphones are recommended, as speakers may cause the microphone to hear the reply.

All keys are stored on device and are only sent to the provider you configure.

## Development

### Android

To run a development build, follow these simple steps:

-   Install any Java 17/21 SDK of your choosing
-   Install `android-sdk` via `Android Studio`
-   Clone the repo:

```
git clone https://github.com/Vali-98/ChatterUI.git
```

-   Install dependencies via npm and run via Expo:

```
npm install
npx expo run:android
```

#### Building an APK

Requires Node.js, Java 17/21 SDK and Android SDK. Expo uses EAS to build apps which requires a Linux environment.

1. Clone the repo.
2. Rename the `eas.json.example` to `eas.json`.
3. Modify `"ANDROID_SDK_ROOT"` to the directory of your Android SDK
4. Run the following:

```
npm install
eas build --platform android --local
```

### IOS

Currently in development

## Acknowledgement

-   [llama.cpp](https://github.com/ggerganov/llama.cpp) - the underlying engine to run LLMs
-   [llama.rn](https://github.com/mybigday/llama.rn) - the original react-native llama.cpp adapter

