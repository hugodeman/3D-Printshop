import React from 'react';

type BackgroundMainProps = {
  children: React.ReactNode;
  className?: string;
};

export function BackgroundMain({ children, className = '' }: BackgroundMainProps) {
  return (
    <div className={`min-h-screen bg-main ${className}`}>
      {children}
    </div>
  );
}

type BackgroundOverlayProps = {
  children: React.ReactNode;
  className?: string;
};

export function BackgroundOverlay({ children, className = '' }: BackgroundOverlayProps) {
  return (
    <div className={`bg-overlay p-6 mb-8 py-10 flex flex-col justify-center items-center text-center gap-5 ${className}`}>
      {children}
    </div>
  );
}

type BackgroundContrast1Props = {
  children: React.ReactNode;
  className?: string;
};

export function BackgroundContrast1({ children, className = '' }: BackgroundContrast1Props) {
  return (
    <div className={`bg-contrast-1 ${className}`}>
      {children}
    </div>
  );
}

type BackgroundContrast2Props = {
  children: React.ReactNode;
  className?: string;
};

export function BackgroundContrast2({ children, className = '' }: BackgroundContrast2Props) {
  return (
    <div className={`bg-contrast-2 ${className}`}>
      {children}
    </div>
  );
}
