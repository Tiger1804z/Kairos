import type { ReactNode } from "react";

function parseBold(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

export function MessageContent({ text, isUser }: { text: string; isUser: boolean }) {
  if (isUser) {
    return <span className="whitespace-pre-line">{text}</span>;
  }

  return (
    <div className="space-y-0.5">
      {text.split("\n").map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1.5" />;

        if (line.startsWith("→ ") || line.startsWith("• ")) {
          return (
            <div key={i} className="flex gap-1.5 pl-0.5">
              <span className="mt-0.5 shrink-0 text-accent/50 leading-relaxed">{line[0]}</span>
              <span className="leading-relaxed">{parseBold(line.slice(2))}</span>
            </div>
          );
        }

        return (
          <div key={i} className="leading-relaxed">{parseBold(line)}</div>
        );
      })}
    </div>
  );
}
