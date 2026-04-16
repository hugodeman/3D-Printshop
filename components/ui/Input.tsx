import React from "react";

type InputProps = {
  variant?: "normal" | "contrast";
  inputSize?: "lg" | "sm";
  className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Input({
  variant = "normal",
  inputSize = "lg",
  className = "",
  ...props
}: InputProps) {
  const baseClasses =
    "rounded-[5px] border input-shadow outline-none transition-colors h-12 px-4 text-p";

  const variantClasses = {
    normal: "bg-input-normal border-input-normal text-input-normal placeholder:text-[rgba(255,255,255,0.6)]",
    contrast: "bg-input-contrast border-input-contrast text-input-contrast placeholder:text-[rgba(31,33,38,0.8)]",
  };

  const sizeClasses = {
    lg: "w-full",
    // Small variant is approximately 45% of the large input width.
    sm: "w-70",
  };

  return (
    <input
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[inputSize]} ${className}`}
      {...props}
    />
  );
}
