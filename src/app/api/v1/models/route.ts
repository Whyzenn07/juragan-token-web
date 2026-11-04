import { NextResponse } from "next/server";
import { modelsCatalog } from "@/data/catalog";

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
  const customModels = [
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
      id: "claude-3-5-sonnet",
      object: "model",
      created: 1730000000,
      owned_by: "anthropic",
      permission: [],
      root: "claude-3-5-sonnet",
      parent: null,
      description: "Anthropic Claude 3.5 Sonnet - Model coding dan penalaran tingkat lanjut via Pass-Through Engine Juragan Token.",
    },
    {
      id: "claude-3-5-haiku",
      object: "model",
      created: 1730000000,
      owned_by: "anthropic",
      permission: [],
      root: "claude-3-5-haiku",
      parent: null,
      description: "Anthropic Claude 3.5 Haiku - Model ringan, cepat, dan ekonomis untuk alur kerja terstruktur.",
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

  // Map all models from catalog
  const catalogList = modelsCatalog.map((m) => ({
    id: m.id,
    object: "model",
    created: 1730000000,
    owned_by: m.providerId,
    permission: [],
    root: m.id,
    parent: null,
    description: m.description,
  }));

  const modelMap = new Map<string, any>();
  catalogList.forEach((m) => modelMap.set(m.id, m));
  customModels.forEach((m) => {
    if (!modelMap.has(m.id)) modelMap.set(m.id, m);
  });

  const allModels = Array.from(modelMap.values());

  return NextResponse.json(
    {
      object: "list",
      data: allModels,
    },
    {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, max-age=3600",
      },
    }
  );
}
