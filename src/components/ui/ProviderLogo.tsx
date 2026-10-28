import React from "react";

type LogoProps = {
  provider: string;
  size?: number;
  className?: string;
  showCompanyBadge?: boolean;
};

export function getProviderLogoPath(provider: string): { path: string; name: string; company: string } {
  const p = (provider || "").toLowerCase();

  if (p.includes("claude") || p.includes("anthropic") || p.includes("fable")) {
    return { path: "/assets/AI-Logo/anthropic.svg", name: "Claude", company: "Anthropic" };
  }
  if (p.includes("openai") || p.includes("chatgpt") || p.includes("gpt")) {
    return { path: "/assets/AI-Logo/OpenAI.png", name: "ChatGPT", company: "OpenAI" };
  }
  if (p.includes("gemini") || p.includes("google")) {
    return { path: "/assets/AI-Logo/Gemini.jpg", name: "Gemini", company: "Google" };
  }
  if (p.includes("deepseek")) {
    return { path: "/assets/AI-Logo/Deepseek.png", name: "DeepSeek", company: "DeepSeek" };
  }
  if (p.includes("qwen") || p.includes("alibaba")) {
    return { path: "/assets/AI-Logo/qwen.svg", name: "Qwen", company: "Alibaba Cloud" };
  }
  if (p.includes("grok") || p.includes("xai")) {
    return { path: "/assets/AI-Logo/Grok.png", name: "Grok", company: "xAI" };
  }
  if (p.includes("meta") || p.includes("llama")) {
    return { path: "/assets/AI-Logo/meta.png", name: "Llama", company: "Meta" };
  }
  if (p.includes("kimi") || p.includes("moonshot")) {
    return { path: "/assets/AI-Logo/Kimi-ai.png", name: "Kimi", company: "Moonshot AI" };
  }
  if (p.includes("bytedance") || p.includes("doubao")) {
    return { path: "/assets/AI-Logo/bytedance.png", name: "Doubao", company: "Bytedance" };
  }
  if (p.includes("minimax")) {
    return { path: "/assets/AI-Logo/minimax.jpg", name: "MiniMax", company: "MiniMax" };
  }
  if (p.includes("zhipu") || p.includes("glm") || p.includes("z.ai") || p.includes("z-ai") || p.includes("zai")) {
    return { path: "/assets/AI-Logo/Zhipu.png", name: "GLM", company: "Z.ai" };
  }
  if (p.includes("cursor")) {
    return { path: "/assets/AI-Logo/cursor.jpg", name: "Cursor", company: "Anysphere" };
  }

  return { path: "/assets/AI-Logo/anthropic.svg", name: provider, company: "AI Provider" };
}

export function ProviderLogo({ provider, size = 24, className = "" }: LogoProps) {
  const info = getProviderLogoPath(provider);

  return (
    <span
      className={`provider-logo-container ${className}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: size > 24 ? "8px" : "4px",
        overflow: "hidden",
        flexShrink: 0,
      }}
      title={`${info.company} (${info.name})`}
    >
      {/* Real logo image directly loaded from /assets/AI-Logo/ */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={info.path}
        alt={`${info.company} logo`}
        width={size}
        height={size}
        className="provider-real-logo"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          borderRadius: "inherit",
          display: "block",
        }}
        loading="eager"
        decoding="async"
        draggable={false}
      />
    </span>
  );
}
