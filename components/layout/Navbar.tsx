import React from "react";
import {H2, H3} from "@/components/ui/Typography";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className = "" }: NavbarProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <nav className={`flex items-center justify-between p-6 border-b border-black/5 bg-[#2E3033] ${className}`}>
      {/* Left side - Logo/Icon and Title */}
      <div className="flex items-center gap-4 cursor-pointer ml-8" onClick={() => window.location.href = "/"}>
        {/* Placeholder for image icon */}
        <div>
          <Icon name="Image" size={40} color={"#98CEAA"}/>
        </div>
        <H2>HoekvanNoek</H2>
      </div>

      {/* Right side - Navigation buttons */}
      <div className="flex items-center gap-10">
        <Button
          variant="secondary"
          isActive={pathname === "/shop"}
          onClick={() => window.location.href = "/shop"}
          className="w-48"
        >
          Webshop
        </Button>
        <Button
          variant="secondary"
          isActive={pathname === "/offerte"}
          onClick={() => window.location.href = "/offerte"}
          className="w-48"
        >
          Offerte maken
        </Button>
        <Button
          variant="secondary"
          isActive={pathname === "/builder"}
          onClick={() => window.location.href = "/builder"}
          className="w-48"
        >
          3D Builder
        </Button>
        {status === "loading" ? (
            // Lege placeholder met zelfde breedte zodat de navbar niet springt
            <div className="flex items-center gap-3 hover:cursor-pointer w-48 justify-center">
            {/*//   <H3>Profiel</H3>*/}
            {/*//   <Icon name="CircleUserRound" size={40} color={"#98CEAA"}></Icon>*/}
            </div>
        ) : session ? (
            <div
                className="flex items-center gap-3 hover:cursor-pointer w-48 justify-center"
                onClick={() => window.location.href = "/profile"}
            >
              <H3>Profiel</H3>
              <Icon name="CircleUserRound" size={40} color={"#98CEAA"} />
            </div>
        ) : (
            <Button
                variant="primary"
                isActive={pathname === "/auth/login"}
                onClick={() => window.location.href = "/auth/login"}
                className="w-48"
            >
              Login
            </Button>
        )}
      </div>
    </nav>
  );
}
