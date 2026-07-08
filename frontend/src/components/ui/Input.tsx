import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="space-y-1.5">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-blue-100/80"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2.5 text-sm text-white",
            "placeholder:text-blue-200/30",
            "focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/10",
            "disabled:cursor-not-allowed disabled:opacity-40",
            error &&
              "border-red-400/30 focus:border-red-400/40 focus:ring-red-400/20",
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400/80">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
