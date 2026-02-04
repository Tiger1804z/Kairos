import { useState } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { cn } from "../../lib/cn";

type Props = {
  placeholder?: string;
  onAsk?: (value: string) => void;
  className?: string;
};

export default function AskKairosInput({
  placeholder = `Ask anything about your business data... (e.g., "Show me revenue trends by client")`,
  onAsk,
  className,
}: Props) {
  const [value, setValue] = useState("");

  function submit() {
    const v = value.trim();
    if (!v) return;
    onAsk?.(v);
    setValue("");
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-white/10 backdrop-blur",
        className
      )}
    >
      <Sparkles className="h-5 w-5 text-accent" />
      <div className="flex-1">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={placeholder}
          className="border-0 bg-transparent ring-0 focus:ring-0"
        />
      </div>
      <Button onClick={submit} className="rounded-xl px-4">
        Ask Kairos <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
