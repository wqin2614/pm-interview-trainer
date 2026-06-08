import { Injectable, InternalServerErrorException } from '@nestjs/common';

type OpenAITranscriptionResponse = {
  error?: {
    message?: string;
  };
  text?: string;
};

const getAudioMimeType = (filename: string): string => {
  const normalized = filename.toLowerCase();

  if (normalized.endsWith('.mp3')) {
    return 'audio/mpeg';
  }

  if (normalized.endsWith('.wav')) {
    return 'audio/wav';
  }

  if (normalized.endsWith('.aac')) {
    return 'audio/aac';
  }

  if (normalized.endsWith('.pcm')) {
    return 'audio/pcm';
  }

  return 'audio/webm';
};

@Injectable()
export class InterviewService {
  async transcribeAudio(buffer: Buffer, filename = 'interview-segment.webm'): Promise<{ text: string }> {
    const apiKey = process.env.OPENAI_API_KEY;
    const model = process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe';

    if (!apiKey) {
      throw new InternalServerErrorException('Server is missing OPENAI_API_KEY');
    }

    const formData = new FormData();
    const audioBytes = new Uint8Array(buffer);
    formData.append('file', new Blob([audioBytes], { type: getAudioMimeType(filename) }), filename);
    formData.append('model', model);
    formData.append('language', 'zh');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    const payload = (await response.json()) as OpenAITranscriptionResponse;

    if (!response.ok) {
      throw new InternalServerErrorException(payload?.error?.message || 'Transcription request failed');
    }

    return {
      text: payload?.text || '',
    };
  }
}
