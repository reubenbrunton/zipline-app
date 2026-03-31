import { cn } from "@/lib/utils";
import Image from "next/image";

interface ZiplineLogoProps {
  variant?: "white" | "dark";
  className?: string;
  iconOnly?: boolean;
}

export function ZiplineLogo({
  className,
}: ZiplineLogoProps) {
  return (
    <Image
      src="/zipline-logo.png"
      alt="Zipline"
      width={160}
      height={40}
      priority
      className={cn("h-8 w-auto", className)}
    />
  );
}

export function ZiplineWordmark({
  className,
}: {
  variant?: "white" | "dark";
  className?: string;
}) {
  return (
    <Image
      src="/zipline-logo.png"
      alt="Zipline"
      width={160}
      height={40}
      priority
      className={cn("h-8 w-auto", className)}
    />
  );
}
