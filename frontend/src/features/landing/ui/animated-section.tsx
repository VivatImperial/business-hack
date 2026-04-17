
import { motion } from "@/shared/animations/motion";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
  dataTrackSection?: string;
}

export function AnimatedSection({ children, className, delay = 0, id, dataTrackSection }: AnimatedSectionProps) {
  return (
    <motion.section
      id={id}
      data-track-section={dataTrackSection}
      initial={{ opacity: 0, y: 20, filter: "blur(4px)", scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ 
        type: "spring", 
        bounce: 0.3, 
        duration: 0.8, 
        delay 
      }}
      className={className}
    >
      {children}
    </motion.section>
  );
}
