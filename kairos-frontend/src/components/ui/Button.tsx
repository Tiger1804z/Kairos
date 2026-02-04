import { cn } from "../../lib/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({ className, disabled, ...props }: Props) {
  return (
    <button
      className={cn(
        "rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60",
        className
      )}
      disabled={disabled}
      {...props}
    />
  );
}
