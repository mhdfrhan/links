"use client";

import { motion } from "framer-motion";

interface ExperienceItem {
  title: string;
  company: string;
  period: string;
  points: string[];
}

interface ExperienceSectionProps {
  title: string;
  icon: React.ReactNode;
  items: ExperienceItem[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export function ExperienceSection({ title, icon, items }: ExperienceSectionProps) {
  return (
    <motion.section
      className="w-full"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={containerVariants}
    >
      <motion.div 
        className="flex items-center gap-3 mb-6"
        variants={itemVariants}
      >
        <div className="p-2 rounded-xl bg-accent/10 text-accent">
          {icon}
        </div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
      </motion.div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <motion.div
            key={index}
            className="relative pl-6 border-l-2 border-accent/30 hover:border-accent transition-colors duration-300"
            variants={itemVariants}
          >
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-accent/20 border-2 border-accent" />
            
            <div className="pb-6">
              <h3 className="font-semibold text-foreground text-lg">{item.title}</h3>
              <p className="text-accent font-medium text-sm">{item.company}</p>
              <p className="text-muted-foreground text-xs mb-3">{item.period}</p>
              
              <ul className="space-y-2">
                {item.points.map((point, pIndex) => (
                  <li 
                    key={pIndex}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-accent mt-1.5 flex-shrink-0">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
