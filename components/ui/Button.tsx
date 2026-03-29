import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses =
    "px-4 py-2 text-p font-medium border border-black button-shadow transition-colors";

  const variantClasses = {
    primary: "bg-button-primary text-contrast hover:bg-button-primary-hover",
    secondary: "bg-button-secondary text-white hover:bg-button-secondary-hover",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
