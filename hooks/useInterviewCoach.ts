import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import type { Application, CvData } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Audio Encoding/Decoding Helpers ---

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- Custom Hook ---

export type TranscriptItem = {
    speaker: 'user' | 'model';
    text: string;
};

export const useInterviewCoach = (application: Application, cvData: CvData, onSessionEnd?: () => void) => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
    const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
    const [error, setError] = useState<string | null>(null);

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const audioRefs = useRef<{
        inputAudioContext: AudioContext | null,
        outputAudioContext: AudioContext | null,
        stream: MediaStream | null,
        scriptProcessor: ScriptProcessorNode | null,
        sources: Set<AudioBufferSourceNode>,
        nextStartTime: number,
    }>({
        inputAudioContext: null,
        outputAudioContext: null,
        stream: null,
        scriptProcessor: null,
        sources: new Set(),
        nextStartTime: 0,
    });
    
    const currentInputTranscriptionRef = useRef('');
    const currentOutputTranscriptionRef = useRef('');

    const startSession = useCallback(async () => {
        setStatus('connecting');
        setError(null);
        setTranscript([]);

        try {
            audioRefs.current.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            const systemInstruction = `Tu es un recruteur expert et bienveillant de l'entreprise ${application.job.company}. Tu mènes un premier entretien pour le poste de ${application.job.title}. Le CV du candidat est le suivant :

${JSON.stringify(cvData, null, 2)}

Ton objectif est de :
1. Évaluer la pertinence du profil du candidat pour le poste.
2. Poser des questions comportementales et techniques pertinentes.
3. Garder une conversation fluide et naturelle.

Commence par te présenter brièvement, puis pose la première question. Parle de manière concise. Ne pose qu'une seule question à la fois.`;
            
            const audio = audioRefs.current;
            audio.sources = new Set();
            audio.nextStartTime = 0;
            // Fix: Cast `window` to `any` to support `webkitAudioContext` for older browsers.
            audio.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            // Fix: Cast `window` to `any` to support `webkitAudioContext` for older browsers.
            audio.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

            sessionPromiseRef.current = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        setStatus('active');
                        if (!audio.stream || !audio.inputAudioContext) return;
                        
                        const source = audio.inputAudioContext.createMediaStreamSource(audio.stream);
                        audio.scriptProcessor = audio.inputAudioContext.createScriptProcessor(4096, 1, 1);
                        
                        audio.scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromiseRef.current?.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(audio.scriptProcessor);
                        audio.scriptProcessor.connect(audio.inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                       // Handle Transcription
                        if (message.serverContent?.outputTranscription) {
                            currentOutputTranscriptionRef.current += message.serverContent.outputTranscription.text;
                        }
                        if (message.serverContent?.inputTranscription) {
                            currentInputTranscriptionRef.current += message.serverContent.inputTranscription.text;
                        }
                        if (message.serverContent?.turnComplete) {
                            const fullInput = currentInputTranscriptionRef.current.trim();
                            const fullOutput = currentOutputTranscriptionRef.current.trim();

                            setTranscript(prev => {
                                const newTranscript = [...prev];
                                if (fullInput) newTranscript.push({ speaker: 'user', text: fullInput });
                                if (fullOutput) newTranscript.push({ speaker: 'model', text: fullOutput });
                                return newTranscript;
                            });

                            currentInputTranscriptionRef.current = '';
                            currentOutputTranscriptionRef.current = '';
                        }

                        // Handle Audio Playback
                        const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                        if (base64EncodedAudioString && audio.outputAudioContext) {
                            audio.nextStartTime = Math.max(audio.nextStartTime, audio.outputAudioContext.currentTime);
                            const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), audio.outputAudioContext, 24000, 1);
                            const source = audio.outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(audio.outputAudioContext.destination);
                            source.addEventListener('ended', () => {
                                audio.sources.delete(source);
                            });
                            source.start(audio.nextStartTime);
                            audio.nextStartTime += audioBuffer.duration;
                            audio.sources.add(source);
                        }

                        if (message.serverContent?.interrupted) {
                            for (const source of audio.sources.values()) {
                                source.stop();
                                audio.sources.delete(source);
                            }
                            audio.nextStartTime = 0;
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Session error:', e);
                        setError('Une erreur de connexion est survenue.');
                        setStatus('error');
                    },
                    onclose: (e: CloseEvent) => {
                        stopSession(false);
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: systemInstruction,
                    inputAudioTranscription: {},
                    outputAudioTranscription: {},
                },
            });

        } catch (err) {
            console.error('Failed to start session', err);
            const message = err instanceof Error ? err.message : "Une erreur inconnue s'est produite.";
            setError(`Impossible de démarrer la session: ${message}`);
            setStatus('error');
        }
    }, [application.job, cvData]);
    
    const stopSession = useCallback((invokeCallback = true) => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }

        const audio = audioRefs.current;
        if (audio.scriptProcessor) {
            audio.scriptProcessor.disconnect();
            audio.scriptProcessor = null;
        }
        if (audio.stream) {
            audio.stream.getTracks().forEach(track => track.stop());
            audio.stream = null;
        }
        if (audio.inputAudioContext && audio.inputAudioContext.state !== 'closed') {
            audio.inputAudioContext.close();
        }
        if (audio.outputAudioContext && audio.outputAudioContext.state !== 'closed') {
            audio.outputAudioContext.close();
        }

        for (const source of audio.sources.values()) {
            source.stop();
        }
        audio.sources.clear();
        
        setStatus('idle');
        if (onSessionEnd && invokeCallback) {
            onSessionEnd();
        }
    }, [onSessionEnd]);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopSession(false);
        };
    }, [stopSession]);
    
    return { status, transcript, error, startSession, stopSession };
};
