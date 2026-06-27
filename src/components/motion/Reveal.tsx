import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

interface RevealProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  delay?: number;
  y?: number;
  duration?: number;
  once?: boolean;
}

export const Reveal = ({ children, delay = 0, y = 18, duration = 0.52, once = true, ...rest }: RevealProps) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once, margin: "-80px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export const Stagger = ({ children, delay = 0.08, ...rest }: { children: ReactNode; delay?: number } & HTMLMotionProps<"div">) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : "hidden"}
      whileInView={reduce ? undefined : "show"}
      viewport={{ once: true, margin: "-80px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: delay } } }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};

export const StaggerItem = ({ children, y = 18, ...rest }: { children: ReactNode; y?: number } & HTMLMotionProps<"div">) => {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={reduce ? undefined : {
        hidden: { opacity: 0, y },
        show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
      }}
      {...rest}
    >
      {children}
    </motion.div>
  );
};
