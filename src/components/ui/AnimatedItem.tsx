import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';

interface AnimatedItemProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  className?: string;
  animateOnce?: boolean;
}

/**
 * AnimatedItem provides a smooth entrance animation (scale + opacity) 
 * as the element enters the viewport. Perfect for list items.
 */
export const AnimatedItem: React.FC<AnimatedItemProps> = ({ 
  children, 
  delay = 0,
  className = "",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { 
    amount: 0.5, 
    once: false // Snippet uses once: false for re-animation on scroll
  });

  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
      transition={{ 
        duration: 0.2, 
        delay: delay || 0.1, // Using snippet's constant delay or provided
        ease: "easeOut"
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
