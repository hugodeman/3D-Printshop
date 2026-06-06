import {useState, useRef, useEffect, ReactNode} from "react";

/**
 * InfoPopover — klein info-icoontje met uitklapbare uitleg
 *
 * Props:
 *   children  — de tekst (of JSX) die in de popover verschijnt (verplicht)
 *   side      — "bottom" (default) | "top"  waar de popover verschijnt
 *   width     — Tailwind width class, bijv. "w-72" (default)
 */

interface InfoPopoverProps {
    children: ReactNode;
    side?: "bottom" | "top";
    width?: string;
}

export function InfoPopover({ children, side = "bottom", width = "w-72" }: InfoPopoverProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        function handleOutside(e: { target: any; }) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        function handleEsc(e: { key: string; }) {
            if (e.key === "Escape") setOpen(false);
        }
        document.addEventListener("mousedown", handleOutside);
        document.addEventListener("keydown", handleEsc);
        return () => {
            document.removeEventListener("mousedown", handleOutside);
            document.removeEventListener("keydown", handleEsc);
        };
    }, []);

    const positionClass =
        side === "top"
            ? "bottom-full mb-2"
            : "top-full mt-2";

    return (
        <span className="relative inline-block" ref={ref}>
      <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label="Meer informatie"
          className="ml-1.5 align-middle text-white/40 hover:text-white/70 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-full"
      >
        <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            aria-hidden="true"
        >
          <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1" />
          <text
              x="7.5"
              y="11"
              textAnchor="middle"
              fill="currentColor"
              fontSize="8.5"
              fontFamily="sans-serif"
              fontWeight="600"
          >
            i
          </text>
        </svg>
      </button>

            {open && (
                <div
                    role="tooltip"
                    className={`absolute left-0 z-50 ${positionClass} ${width} rounded-lg border border-white/10 bg-[#1e1e1e] p-3.5 text-sm text-white/70 leading-relaxed shadow-xl`}
                >
                    {children}
                </div>
            )}
    </span>
    );
}