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
    "px-6 py-3 text-p font-medium border border-black button-shadow transition-colors rounded-lg";

  const variantClasses = {
    primary: "bg-button-primary text-contrast",
    secondary: "bg-button-secondary text-white",
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
