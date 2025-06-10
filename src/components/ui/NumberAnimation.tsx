import React from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface NumberAnimationProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export default function NumberAnimation({ value, prefix = '', suffix = '', className = '' }: NumberAnimationProps) {
  const spring = useSpring(0, {
    stiffness: 50,
    damping: 15,
    duration: 1.5
  });

  const display = useTransform(spring, (current) => {
    return `${prefix}${Math.floor(current).toLocaleString()}${suffix}`;
  });

  React.useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return (
    <motion.span className={className}>
      {display}
    </motion.span>
  );
}