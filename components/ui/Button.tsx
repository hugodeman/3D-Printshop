import React from "react";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  isActive?: boolean;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  children,
  variant = "primary",
  isActive = false,
  className = "", 
  ...props
}: ButtonProps) {
  const baseClasses =
    "px-6 py-3 text-p font-medium border border-black button-shadow transition-colors rounded-lg hover:cursor-pointer";

  const variantClasses = {
    primary: "bg-button-primary text-contrast",
    secondary: "bg-button-secondary text-white",
  };

  const activeClasses = isActive 
    ? variant === "primary" 
      ? "bg-button-primary-active" 
      : "bg-button-secondary-active"
    : "";

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${activeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
