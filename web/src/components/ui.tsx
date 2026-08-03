import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const buttonVariants = {
  primary: "bg-ink-700 text-white hover:bg-ink-800",
  accent: "bg-sand-500 text-white hover:bg-sand-600",
  outline: "border border-ink-200 bg-white text-ink-800 hover:border-ink-400 hover:bg-ink-50",
  ghost: "text-ink-700 hover:bg-ink-50",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
} as const;

const buttonSizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
} as const;

type ButtonStyle = {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & ButtonStyle) {
  return (
    <button
      {...props}
      className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
    />
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<typeof Link> & ButtonStyle) {
  return (
    <Link
      {...props}
      className={cx(buttonBase, buttonVariants[variant], buttonSizes[size], className)}
    />
  );
}

const badgeTones = {
  neutral: "bg-ink-50 text-ink-700 border-ink-100",
  success: "bg-emerald-50 text-emerald-800 border-emerald-100",
  warning: "bg-amber-50 text-amber-800 border-amber-100",
  danger: "bg-red-50 text-red-700 border-red-100",
  accent: "bg-sand-100 text-sand-700 border-sand-200",
} as const;

export function Badge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: keyof typeof badgeTones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div {...props} className={cx("card", className)} />;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="field-hint">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function Alert({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "error" | "warning";
  children: ReactNode;
}) {
  const tones = {
    info: "border-ink-200 bg-ink-50 text-ink-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
  } as const;

  return (
    <div className={cx("rounded-lg border px-4 py-3 text-sm", tones[tone])} role="status">
      {children}
    </div>
  );
}

export function Stars({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const full = Math.round(value);
  return (
    <span
      className={cx("inline-flex", size === "sm" ? "text-xs" : "text-sm")}
      aria-label={`Hodnocení ${value.toFixed(1)} z 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= full ? "text-sand-500" : "text-ink-200"} aria-hidden>
          ★
        </span>
      ))}
    </span>
  );
}

/** Iniciály místo fotky – v MVP neřešíme nahrávání obrázků. */
export function Avatar({
  firstName,
  lastName,
  size = "md",
}: {
  firstName: string;
  lastName: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "size-9 text-xs",
    md: "size-12 text-sm",
    lg: "size-20 text-xl",
  } as const;

  return (
    <span
      className={cx(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-ink-100 font-semibold text-ink-700",
        sizes[size],
      )}
      aria-hidden
    >
      {firstName[0]}
      {lastName[0]}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-14 text-center">
      <h3 className="text-lg font-semibold text-ink-900">{title}</h3>
      <p className="max-w-md text-sm text-ink-600">{description}</p>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-ink-600">{description}</p>}
      </div>
      {action}
    </div>
  );
}
