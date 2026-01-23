"use client";

import { motion } from "framer-motion";

interface Education {
  institution: string;
  period: string;
  degree: string;
  note?: string;
}

interface EducationSectionProps {
  items: Education[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
    },
  },
};

export function EducationSection({ items }: EducationSectionProps) {
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground">Pendidikan</h2>
      </motion.div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <motion.div
            key={index}
            className="p-4 rounded-2xl bg-card border border-border hover:border-accent/50 transition-all duration-300"
            variants={itemVariants}
            whileHover={{ y: -2 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground">{item.institution}</h3>
                <p className="text-accent font-medium text-sm">{item.degree}</p>
                {item.note && (
                  <p className="text-xs text-muted-foreground mt-2 p-2 rounded-lg bg-accent/5 border border-accent/20">
                    🎓 {item.note}
                  </p>
                )}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded-full">
                {item.period}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
