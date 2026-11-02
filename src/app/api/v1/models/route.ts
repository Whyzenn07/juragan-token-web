import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, x-api-key",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const models = [
    {
      id: "gemini-3.8-flash",
      object: "model",
      created: 1730000000,
      owned_by: "google",
      permission: [],
      root: "gemini-3.8-flash",
      parent: null,
      description: "Google Gemini 3.8 Flash - Generasi terbaru: ultra cepat, cerdas, dan hemat untuk koding & chat.",
    },
    {
      id: "gemini-flash-latest",
      object: "model",
      created: 1730000000,
      owned_by: "google",
      permission: [],
      root: "gemini-flash-latest",
      parent: null,
      description: "Google Gemini Flash (Auto-updated to latest production build).",
    },
    {
      id: "gemini-1.5-flash",
      object: "model",
      created: 1730000000,
      owned_by: "google",
      permission: [],
      root: "gemini-1.5-flash",
      parent: null,
      description: "Google Gemini 1.5 Flash - Model serbaguna berkecepatan tinggi dengan konteks panjang 1M token.",
    },
    {
      id: "gemini-1.5-pro",
      object: "model",
      created: 1730000000,
      owned_by: "google",
      permission: [],
      root: "gemini-1.5-pro",
      parent: null,
      description: "Google Gemini 1.5 Pro - Penalaran kompleks, pemecahan masalah matematika & arsitektur sistem tingkat lanjut.",
    },
    {
      id: "claude-sonnet-5-5",
      object: "model",
      created: 1730000000,
      owned_by: "anthropic",
      permission: [],
      root: "claude-sonnet-5-5",
      parent: null,
      description: "Anthropic Claude Sonnet 5.5 - Pilihan utama untuk Claude Code & Cursor: review kode, refactor lintas file, dan logika koding bebas halusinasi.",
    },
    {
      id: "claude-opus-5-5",
      object: "model",
      created: 1730000000,
      owned_by: "anthropic",
      permission: [],
      root: "claude-opus-5-5",
      parent: null,
      description: "Anthropic Claude Opus 5.5 - Kasta tertinggi untuk deep reasoning logika murni, arsitektur enterprise, dan pembuktian matematis.",
    },
    {
      id: "claude-3-5-sonnet",
      object: "model",
      created: 1730000000,
      owned_by: "anthropic",
      permission: [],
      root: "claude-3-5-sonnet",
      parent: null,
      description: "Anthropic Claude 3.5 Sonnet - Model frontier koding & penalaran.",
    },
    {
      id: "gpt-4o",
      object: "model",
      created: 1730000000,
      owned_by: "openai",
      permission: [],
      root: "gpt-4o",
      parent: null,
      description: "OpenAI GPT-4o - Model multimodal serbaguna andalan OpenAI (memerlukan OpenRouter key).",
    },
    {
      id: "deepseek-chat",
      object: "model",
      created: 1730000000,
      owned_by: "deepseek",
      permission: [],
      root: "deepseek-chat",
      parent: null,
      description: "DeepSeek V3 Chat - Model open-weights berperforma tinggi dengan harga sangat kompetitif.",
    },
  ];

  return NextResponse.json(
    {
      object: "list",
      data: models,
    },
    {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
