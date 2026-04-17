
import { motion, useScroll, useTransform } from "@/shared/animations/motion";
import { useRef } from "react";

interface ParallaxMediaProps {
  children: React.ReactNode;
  className?: string;
  offset?: number;
}

export function ParallaxMedia({ children, className, offset = 30 }: ParallaxMediaProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
