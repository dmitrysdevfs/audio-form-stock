import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';

export class AudioConverterService {
  /**
   * Convert WebM/Opus audio to PCM16 mono 24kHz format required by OpenAI
   */
  static async convertToPCM16(
    audioBuffer: Buffer,
    inputFormat: string = 'webm'
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const inputStream = new PassThrough();
      const outputStream = new PassThrough();
      const outputChunks: Buffer[] = [];

      // Collect output data
      outputStream.on('data', (chunk: Buffer) => {
        outputChunks.push(chunk);
      });

      outputStream.on('end', () => {
        const pcmBuffer = Buffer.concat(outputChunks);
        console.log(
          `Audio converted: ${audioBuffer.length} bytes → ${pcmBuffer.length} bytes PCM16`
        );
        resolve(pcmBuffer);
      });

      outputStream.on('error', (error) => {
        console.error('Output stream error:', error);
        reject(error);
      });

      ffmpeg(inputStream)
        .inputFormat(inputFormat)
        .audioChannels(1) // mono
        .audioFrequency(24000) // 24kHz
        .audioCodec('pcm_s16le') // 16-bit PCM little-endian
        .format('s16le') // raw PCM
        .on('error', (error) => {
          console.error('FFmpeg conversion error:', error);
          reject(error);
        })
        .on('end', () => {
          outputStream.end();
        })
        .pipe(outputStream);

      // Start the conversion
      inputStream.end(audioBuffer);
    });
  }

  /**
   * Convert audio to base64 encoded PCM16 for OpenAI
   */
  static async convertToBase64PCM16(
    audioBuffer: Buffer,
    inputFormat: string = 'webm'
  ): Promise<string> {
    const pcmBuffer = await this.convertToPCM16(audioBuffer, inputFormat);
    return pcmBuffer.toString('base64');
  }
}
