import { NextResponse } from "next/server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
  const models = [
    {
      id: "gemini-3.5-flash-lite",
      object: "model",
      created: 1730000000,
      owned_by: "google",
      permission: [],
      root: "gemini-3.5-flash-lite",
      parent: null,
      description: "Google Gemini 3.5 Flash Lite - Sangat tangguh, latensi sub-detik, bebas overload (503), pilihan terbaik untuk Chatbox & Cursor.",
    },
    {
      id: "gemini-flash-lite-latest",
      object: "model",
      created: 1730000000,
      owned_by: "google",
      permission: [],
      root: "gemini-flash-lite-latest",
      parent: null,
      description: "Google Gemini Flash Lite (Auto-updated production build) - Kecepatan maksimal untuk dialog interaktif.",
    },
    {
      id: "gemini-3.5-flash",
      object: "model",
      created: 1730000000,
      owned_by: "google",
      permission: [],
      root: "gemini-3.5-flash",
      parent: null,
      description: "Google Gemini 3.5 Flash - Cerdas, hemat token, dan handal untuk analisis teks & koding.",
    },
    {
      id: "gemini-pro-latest",
      object: "model",
      created: 1730000000,
      owned_by: "google",
      permission: [],
      root: "gemini-pro-latest",
      parent: null,
      description: "Google Gemini Pro - Penalaran kompleks, pemecahan masalah matematika & arsitektur sistem tingkat lanjut.",
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
      description: "OpenAI GPT-4o - Model multimodal serbaguna andalan OpenAI via Pass-Through Engine Juragan Token.",
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
