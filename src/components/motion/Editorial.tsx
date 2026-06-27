import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EyebrowProps {
  children: ReactNode;
  className?: string;
  center?: boolean;
}

export const Eyebrow = ({ children, className, center }: EyebrowProps) => (
  <span className={cn("eyebrow", center && "eyebrow eyebrow-center", className)}>{children}</span>
);

interface EditorialHeadingProps {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
  size?: "sm" | "md" | "lg" | "xl";
}

export const EditorialHeading = ({ children, className, as: Tag = "h2", size = "lg" }: EditorialHeadingProps) => {
  const sizes = {
    sm: "text-2xl md:text-3xl",
    md: "text-3xl md:text-4xl",
    lg: "text-4xl md:text-5xl lg:text-6xl",
    xl: "text-5xl md:text-7xl lg:text-8xl",
  };
  return <Tag className={cn("headline-editorial text-foreground", sizes[size], className)}>{children}</Tag>;
};

export const HairlineRule = ({ className }: { className?: string }) => (
  <span className={cn("rule-gold", className)} aria-hidden />
);
