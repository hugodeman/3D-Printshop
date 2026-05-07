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
    primary: isActive
        ? "bg-button-primary-active text-contrast"
        : "bg-button-primary text-contrast",
    secondary: isActive
        ? "bg-button-secondary-active text-white"
        : "bg-button-secondary text-white",
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
