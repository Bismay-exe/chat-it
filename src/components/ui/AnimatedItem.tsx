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
export const AnimatedItem: React.FC<AnimatedItemProps> = React.memo(({ 
  children, 
  delay = 0,
  className = "",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { 
    amount: 0.1, // Reduced amount to trigger faster/more reliably during fast scrolls
    once: false // Keeps the user's preferred "animate every time" behavior
  });

  return (
    <motion.div
      ref={ref}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
      transition={{ 
        duration: 0.2, 
        delay: delay || 0.05, // Slightly faster default delay
        ease: "easeOut"
      }}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
});
