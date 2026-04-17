import { motion } from 'framer-motion';

export function TabUnderline({ layoutId = "activeTab" }: { layoutId?: string }) {
    return (
        <motion.div
            layoutId={layoutId}
            className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-t-full"
            initial={false}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
    );
}
