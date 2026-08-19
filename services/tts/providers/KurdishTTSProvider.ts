import { TTSProvider } from '../types.js';

export interface KurdishTTSConfig {
  apiKey: string;
  modelVersion?: string;
  speakerId?: string;
  endpointUrl?: string;
  providerType?: 'kurdishtts' | 'google' | 'custom';
  timeoutMs?: number;
}

export class KurdishTTSProvider implements TTSProvider {
  private config: KurdishTTSConfig;

  constructor(config: KurdishTTSConfig) {
    this.config = {
      modelVersion: 'v4',
      speakerId: 'kurmanji_236',
      providerType: 'kurdishtts',
      timeoutMs: 15000,
      ...config,
    };
  }

  /**
   * Generates audio buffer for the given Kurmanji or fallback text.
   * @param text Kurmanji text or word to synthesize
   * @param lang Language code (e.g. 'ku' or 'tr')
   */
  async generateAudio(text: string, lang: string = 'ku'): Promise<Buffer> {
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error('[KurdishTTSProvider] Text must not be empty.');
    }

    if (!this.config.apiKey) {
      throw new Error(
        '[KurdishTTSProvider] KURDISHTTS_API_KEY is not configured. Please set KURDISHTTS_API_KEY in your environment to generate audio.'
      );
    }

    if (this.config.providerType === 'google') {
      return this.generateGoogleTTS(trimmed, lang);
    }

    return this.generateKurdishTTS(trimmed, lang);
  }

  private async generateKurdishTTS(text: string, lang: string): Promise<Buffer> {
    const endpoint = this.config.endpointUrl || 'https://api.kurdishtts.com/v1/synthesize';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs || 15000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'X-API-Key': this.config.apiKey,
        },
        body: JSON.stringify({
          text,
          lang: lang === 'ku' ? 'kmr' : lang,
          speaker_id: this.config.speakerId,
          model: this.config.modelVersion,
          format: 'mp3',
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        throw new Error(`[KurdishTTSProvider] HTTP error ${response.status} (${response.statusText}): ${errText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = (await response.json()) as { audio_base64?: string; audio_url?: string; error?: string };
        if (json.error) {
          throw new Error(`[KurdishTTSProvider] API returned error: ${json.error}`);
        }
        if (json.audio_base64) {
          return Buffer.from(json.audio_base64, 'base64');
        }
        if (json.audio_url) {
          const fileResp = await fetch(json.audio_url);
          const arrayBuf = await fileResp.arrayBuffer();
          return Buffer.from(arrayBuf);
        }
        throw new Error('[KurdishTTSProvider] JSON response did not contain audio_base64 or audio_url');
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`[KurdishTTSProvider] Request timed out after ${this.config.timeoutMs}ms for: "${text}"`);
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async generateGoogleTTS(text: string, lang: string): Promise<Buffer> {
    const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.config.apiKey}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs || 15000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          // Google Cloud TTS supports Turkish phonetics closest to Kurmanji or Arabic
          voice: {
            languageCode: lang === 'tr' ? 'tr-TR' : 'tr-TR',
            name: this.config.speakerId || 'tr-TR-Standard-A',
          },
          audioConfig: { audioEncoding: 'MP3' },
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown');
        throw new Error(`[GoogleTTS] HTTP ${response.status}: ${errText}`);
      }

      const data = (await response.json()) as { audioContent?: string };
      if (!data.audioContent) {
        throw new Error('[GoogleTTS] Missing audioContent in response');
      }
      return Buffer.from(data.audioContent, 'base64');
    } finally {
      clearTimeout(timeout);
    }
  }
}
