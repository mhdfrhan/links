import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.NVIDIA_API_KEY,
  baseURL: 'https://integrate.api.nvidia.com/v1',
});

export async function POST(request: Request) {
  try {
    const { text, targetLang = 'English' } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to ${targetLang}. 
          Maintain the original tone and context. Only return the translated text without any explanations or extra characters.`
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent translations
      max_tokens: 2000,
    });

    const translatedText = completion.choices[0]?.message?.content?.trim();

    return NextResponse.json({ translatedText });
  } catch (error: any) {
    console.error('Translation Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
