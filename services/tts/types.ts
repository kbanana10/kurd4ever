export interface TTSProvider {
  /**
   * Generates audio for the given text.
   * @param text The original text to convert to speech
   * @param lang Optional language or dialect code
   * @returns A Promise resolving to an audio buffer
   */
  generateAudio(text: string, lang?: string): Promise<Buffer>;
}
