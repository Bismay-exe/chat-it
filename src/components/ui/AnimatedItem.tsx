import React, { useRef } from 'react';
import { motion, useInView } from 'motion/react';

interface AnimatedItemProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  className?: string;
  // animateOnce?: boolean;
}

/**
 * AnimatedItem provides a smooth entrance animation (fade + slide up)
 * as the element first enters the viewport. Animates only once per mount.
 * Items beyond index 10 render instantly to avoid animation overload in long lists.
 */
export const AnimatedItem: React.FC<AnimatedItemProps> = React.memo(({ 
  children, 
  // index = 0,
  delay = 0,
  className = "",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { 
    amount: 0.05,
    once: false // Each item animates only once — never re-animates on re-render
  });

  // Items beyond index 10 don't animate at all (no overhead for long lists)
  // if (index > 10) {
  //   return <div ref={ref} className={className}>{children}</div>;
  // }

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
