import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { verifyAdminRequest } from "@/lib/firebase/serverAuth";

export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAdminRequest(request);
    if (!authResult.ok) {
      return authResult.response;
    }

    const apiKey = process.env.NVIDIA_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "NVIDIA_API_KEY is not configured." },
        { status: 503 }
      );
    }

    const openai = new OpenAI({
      apiKey,
      baseURL: "https://integrate.api.nvidia.com/v1",
    });

    const { text, targetLang = "English" } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const completion = await (openai.chat.completions.create as unknown as (
      params: Record<string, unknown>
    ) => Promise<{ choices?: Array<{ message?: { content?: string | null } }> }>)({
      model: "nvidia/nemotron-3-ultra-550b-a55b",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following text to ${targetLang}. 
          Maintain the original tone and context. Only return the translated text without any explanations or extra characters.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
      temperature: 1,
      top_p: 0.95,
      max_tokens: 16384,
      chat_template_kwargs: { enable_thinking: true },
      reasoning_budget: 16384,
    });

    const translatedText = completion.choices?.[0]?.message?.content?.trim();

    return NextResponse.json({ translatedText });
  } catch (error: unknown) {
    console.error("Translation Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
