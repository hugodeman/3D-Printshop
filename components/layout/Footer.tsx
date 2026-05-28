import React from "react";
import { Icon } from "@/components/ui/Icon";
import { P } from "@/components/ui/Typography";

const footerItems = [
  { icon: "Mail", label: "Contact", href: "/contact" },
  { icon: "ArrowLeftRight", label: "Terms & Conditions", href: "/footer_pages/terms_conditions" },
  { icon: "ScrollText", label: "FAQ", href: "/faq" },
  { icon: "Cookie", label: "Cookies", href: "/cookies" },
] as const;

export function Footer() {
  return (
    <footer className="bg-[#2E3033] border-t border-black/25 px-6 pt-10 pb-8">
      <div className="mx-auto flex max-w-6xl items-center justify-center gap-10">
        {footerItems.map((item, index) => (
          <React.Fragment key={item.label}>
            <a
              href={item.href}
              className="group flex items-center gap-2 text-white/70 transition-colors hover:text-[#98CEAA]"
            >
              <Icon name={item.icon} size={24} className="opacity-50 transition-opacity group-hover:opacity-100" />
              <P className="text-white/70 group-hover:text-[#98CEAA]">{item.label}</P>
            </a>
            {index < footerItems.length - 1 ? <div className="h-6 w-px bg-white/25" /> : null}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-[15px] text-white/30">
        <Icon name="Copyright" size={20} className="opacity-45" color={"#000000"}/>
        <span className="font-light opacity-50">HoekvanNoek, 2026</span>
      </div>
    </footer>
  );
}

