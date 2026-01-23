"use client";

import { motion } from "framer-motion";

interface Award {
  title: string;
  year: string;
  highlight?: boolean;
}

interface AwardsSectionProps {
  awards: Award[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.15,
    },
  },
};

export function AwardsSection({ awards }: AwardsSectionProps) {
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
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-2.927 0" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground">Penghargaan</h2>
      </motion.div>

      <motion.div 
        className="grid gap-2"
        variants={containerVariants}
      >
        {awards.map((award, index) => (
          <motion.div
            key={index}
            className={`group flex items-start gap-3 p-3 rounded-xl transition-all duration-300 ${
              award.highlight 
                ? 'bg-accent/10 border border-accent/30' 
                : 'bg-card/50 hover:bg-card border border-transparent hover:border-border'
            }`}
            variants={itemVariants}
            whileHover={{ x: 4 }}
          >
            <span className={`mt-0.5 ${award.highlight ? 'text-accent' : 'text-muted-foreground'}`}>
              {award.highlight ? '🏆' : '🎖️'}
            </span>
            <div className="flex-1 min-w-0">
              <p className={`text-sm ${award.highlight ? 'font-semibold text-foreground' : 'text-foreground/90'}`}>
                {award.title}
              </p>
              <p className="text-xs text-muted-foreground">{award.year}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
