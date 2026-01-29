// Web Speech API utilities for voice interaction

export interface VoiceConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  rate: number;
  pitch: number;
  volume: number;
}

const DEFAULT_CONFIG: VoiceConfig = {
  language: 'en-US',
  continuous: false,
  interimResults: true,
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
};

// Speech Recognition Setup
export function initSpeechRecognition(onResult: (text: string) => void, onError: (error: string) => void) {
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError('Speech Recognition not supported in this browser');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = DEFAULT_CONFIG.continuous;
  recognition.interimResults = DEFAULT_CONFIG.interimResults;
  recognition.language = DEFAULT_CONFIG.language;

  recognition.onstart = () => {
    console.log('[v0] Speech recognition started');
  };

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;

      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    // Return final transcript when complete
    if (finalTranscript) {
      onResult(finalTranscript.trim());
    }
  };

  recognition.onerror = (event: any) => {
    console.error('[v0] Speech recognition error:', event.error);
    onError(event.error);
  };

  recognition.onend = () => {
    console.log('[v0] Speech recognition ended');
  };

  return recognition;
}

// Text-to-Speech Setup
export function synthesizeSpeech(text: string, config: Partial<VoiceConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = finalConfig.rate;
  utterance.pitch = finalConfig.pitch;
  utterance.volume = finalConfig.volume;
  utterance.lang = finalConfig.language;

  return new Promise<void>((resolve, reject) => {
    utterance.onend = () => {
      console.log('[v0] Speech synthesis completed');
      resolve();
    };

    utterance.onerror = (event) => {
      console.error('[v0] Speech synthesis error:', event);
      reject(new Error('Speech synthesis failed'));
    };

    window.speechSynthesis.speak(utterance);
  });
}

// Stop any ongoing speech synthesis
export function stopSpeech() {
  window.speechSynthesis.cancel();
}

export function pauseSpeech() {
  window.speechSynthesis.pause();
}

export function resumeSpeech() {
  window.speechSynthesis.resume();
}

// Get available voices
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  return window.speechSynthesis.getVoices();
}

// Check browser support
export function checkVoiceSupport(): {
  speechRecognition: boolean;
  textToSpeech: boolean;
} {
  return {
    speechRecognition: !!(
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    ),
    textToSpeech: !!window.speechSynthesis,
  };
}
