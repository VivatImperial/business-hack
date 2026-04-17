
import { motion, useScroll, useSpring } from "@/shared/animations/motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[90] h-[3px] origin-left bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-700"
      style={{ scaleX }}
    />
  );
}
