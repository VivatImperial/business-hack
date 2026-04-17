
import { motion } from "@/shared/animations/motion";

export function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -top-24 -left-20 h-80 w-80 rounded-full bg-blue-300/30 blur-3xl"
        animate={{ x: [0, 80, 0], y: [0, 40, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl"
        animate={{ x: [0, -90, 0], y: [0, 80, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-140px] left-1/3 h-[28rem] w-[28rem] rounded-full bg-indigo-300/20 blur-3xl"
        animate={{ x: [0, 60, 0], y: [0, -50, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_10%,rgba(37,99,235,0.08),transparent_40%)]" />
    </div>
  );
}
