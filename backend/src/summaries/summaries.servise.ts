import { Injectable } from '@nestjs/common';
import axios from 'axios';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

@Injectable()
export class SummariesService {
  async summarize(text: string): Promise<string> {
    const resp = await axios.post(
      'https://api.openai.com/v1/responses',
      {
        model: 'gpt-4.1-mini',
        input: `Ringkas poin penting dari teks berikut:\n\n${text}`,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      },
    );

    // Cek struktur response
    const data = resp.data as {
      output?: { content?: { text?: string }[] }[];
    };
    const output = data.output?.[0]?.content?.[0]?.text ?? '';
    return output;
  }
}
