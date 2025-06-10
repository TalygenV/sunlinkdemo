export const containerVariants = {
  initial: { opacity: 0, scale: 0.98, filter: 'blur(8px)' },
  animate: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1], // Custom cubic-bezier for premium feel
      staggerChildren: 0.07,
      delayChildren: 0.1
    }
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    filter: 'blur(8px)',
    transition: {
      duration: 0.5,
      ease: [0.76, 0, 0.24, 1]
    }
  }
};

export const itemVariants = {
  initial: { opacity: 0, y: 20, filter: 'blur(4px)' },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    filter: 'blur(4px)',
    transition: {
      duration: 0.3,
      ease: [0.76, 0, 0.24, 1]
    }
  }
};

export const cardVariants = {
  initial: { opacity: 0, y: 15, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  hover: {
    y: -4,
    scale: 1.02,
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
      ease: "easeIn"
    }
  }
};

export const panelVariants = {
  initial: { opacity: 0, scale: 0.8, filter: 'blur(2px)' },
  animate: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
      delay: 0.05
    }
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    filter: 'blur(2px)',
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  },
  hover: {
    scale: 1.03,
    boxShadow: "0 0 20px 5px rgba(0, 0, 0, 0.15)",
    transition: { duration: 0.2 }
  }
};

export const segmentCardVariants = {
  initial: { opacity: 0, x: -10 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.4,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  hover: {
    backgroundColor: "rgba(255, 255, 255, 0.12)",
    x: 2,
    transition: { duration: 0.2 }
  },
  tap: {
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    scale: 0.98,
    transition: { duration: 0.1 }
  }
};

export const controlButtonVariants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 }
  }
};

export const slideFromRight = {
  initial: { x: 50, opacity: 0 },
  animate: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1]
    }
  },
  exit: {
    x: 50,
    opacity: 0,
    transition: {
      duration: 0.4,
      ease: [0.76, 0, 0.24, 1]
    }
  }
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.6 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.4 }
  }
};