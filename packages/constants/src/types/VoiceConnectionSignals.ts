import { VOICE_CONNECTION_SIGNALS } from '..';

export type VoiceConnectionSignals = typeof VOICE_CONNECTION_SIGNALS[keyof typeof VOICE_CONNECTION_SIGNALS];
