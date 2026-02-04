
import {cn} from "../../lib/cn";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white/5 ring-1 ring-white/10 backdrop-blur",
        className
      )}
      {...props}
    />
  );

}