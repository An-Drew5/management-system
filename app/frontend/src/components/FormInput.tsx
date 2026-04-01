import { forwardRef } from "react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, id, ...rest }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-[#F8F7F2]/80"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          {...rest}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={[
            "w-full rounded-xl px-4 py-3 text-sm bg-[#1a3a15]/60 border text-[#F8F7F2] placeholder-[#F8F7F2]/30",
            "outline-none transition-all duration-200",
            "focus:ring-2 focus:ring-[#3DED97]/50 focus:border-[#3DED97]",
            error
              ? "border-rose-500/70 focus:ring-rose-500/50 focus:border-rose-500"
              : "border-[#3DED97]/20 hover:border-[#3DED97]/40",
          ].join(" ")}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-rose-400 mt-0.5"
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

FormInput.displayName = "FormInput";

export default FormInput;
