"use client";

interface AdminFormFieldProps {
  label: string;
  type?: "text" | "email" | "url" | "number" | "textarea" | "password";
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  rows?: number;
  hint?: string;
  maxLength?: number;
  disabled?: boolean;
}

export function AdminFormField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  error,
  rows = 4,
  hint,
  maxLength,
  disabled = false,
}: AdminFormFieldProps) {
  const inputClass = `w-full p-3.5  bg-background/50 border transition-all duration-200 outline-none placeholder:text-muted-foreground/50 disabled:opacity-50 disabled:cursor-not-allowed ${
    error
      ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20"
      : "border-border focus:border-accent focus:ring-2 focus:ring-accent/20"
  }`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
        {maxLength && (
          <span className={`text-xs ${String(value).length > maxLength ? "text-destructive" : "text-muted-foreground"}`}>
            {String(value).length}/{maxLength}
          </span>
        )}
      </div>

      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          className={`${inputClass} resize-y`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          disabled={disabled}
          className={inputClass}
        />
      )}

      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
