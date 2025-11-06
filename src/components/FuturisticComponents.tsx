'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// Composant de timeline futuriste
export const FuturisticTimeline: React.FC<{
  events: Array<{
    date: string;
    title: string;
    description?: string;
    type?: 'success' | 'warning' | 'danger' | 'info';
  }>;
}> = ({ events }) => {
  const getColor = (type?: string) => {
    switch (type) {
      case 'success': return '#00ff88';
      case 'warning': return '#ffaa00';
      case 'danger': return '#ff0055';
      case 'info': return '#00d4ff';
      default: return '#ffffff';
    }
  };

  return (
    <div className="relative">
      {/* Ligne centrale */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500/50 via-purple-500/50 to-transparent" />
      
      {/* Événements */}
      <div className="space-y-6">
        {events.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex gap-4"
          >
            {/* Point sur la timeline */}
            <div className="relative z-10">
              <motion.div
                className="w-4 h-4 rounded-full border-2"
                style={{ 
                  borderColor: getColor(event.type),
                  backgroundColor: `${getColor(event.type)}33`
                }}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity
                }}
              />
              {/* Effet de glow */}
              <div 
                className="absolute inset-0 rounded-full blur-md"
                style={{ backgroundColor: getColor(event.type) }}
              />
            </div>
            
            {/* Contenu */}
            <div className="flex-1 backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">{event.date}</div>
              <div className="font-medium text-white">{event.title}</div>
              {event.description && (
                <div className="text-sm text-gray-400 mt-1">{event.description}</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Composant de statistique animée
export const AnimatedStat: React.FC<{
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  color?: string;
  icon?: React.ReactNode;
}> = ({ value, suffix = '', prefix = '', label, color = '#00ff88', icon }) => {
  const [displayValue, setDisplayValue] = React.useState(0);

  React.useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <div className="relative">
      {/* Effet de glow de fond */}
      <div 
        className="absolute inset-0 rounded-2xl blur-2xl opacity-20"
        style={{ backgroundColor: color }}
      />
      
      <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
        {/* Icône */}
        {icon && (
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ 
              background: `linear-gradient(135deg, ${color}20, ${color}10)`,
              border: `1px solid ${color}40`
            }}
          >
            <span style={{ color }}>{icon}</span>
          </div>
        )}
        
        {/* Valeur */}
        <div className="text-3xl font-bold mb-2">
          <span style={{ color }}>
            {prefix}{displayValue}{suffix}
          </span>
        </div>
        
        {/* Label */}
        <div className="text-sm text-gray-400">{label}</div>
        
        {/* Barre de progression */}
        <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${(displayValue / value) * 100}%` }}
            transition={{ duration: 2, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
};

// Composant de carte 3D interactive
export const Card3D: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  const [rotateX, setRotateX] = React.useState(0);
  const [rotateY, setRotateY] = React.useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    setRotateY((x - centerX) / 10);
    setRotateX(-(y - centerY) / 10);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      className={cn("relative preserve-3d", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{
        rotateX,
        rotateY,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="relative z-10" style={{ transform: 'translateZ(50px)' }}>
        {children}
      </div>
      
      {/* Ombre dynamique */}
      <motion.div
        className="absolute inset-0 bg-black/50 blur-2xl -z-10"
        animate={{
          x: -rotateY * 2,
          y: -rotateX * 2,
        }}
        style={{ transform: 'translateZ(-50px)' }}
      />
    </motion.div>
  );
};

// Composant de bouton néon
export const NeonButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  color?: string;
  variant?: 'solid' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ 
  children, 
  onClick, 
  color = '#00ff88',
  variant = 'solid',
  size = 'md',
  className 
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "relative font-medium rounded-lg transition-all",
        sizeClasses[size],
        variant === 'solid' 
          ? 'text-black' 
          : 'text-white border',
        className
      )}
      style={{
        background: variant === 'solid' 
          ? `linear-gradient(135deg, ${color}, ${color}dd)`
          : 'transparent',
        borderColor: variant === 'outline' ? color : 'transparent',
        boxShadow: `0 0 20px ${color}40`
      }}
    >
      {/* Effet de glow au hover */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        style={{
          background: `radial-gradient(circle, ${color}40, transparent)`,
        }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      />
      
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
};

// Composant de notification futuriste
export const FuturisticNotification: React.FC<{
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message?: string;
  onClose?: () => void;
}> = ({ type, title, message, onClose }) => {
  const colors = {
    success: '#00ff88',
    warning: '#ffaa00',
    error: '#ff0055',
    info: '#00d4ff'
  };

  const icons = {
    success: '✓',
    warning: '⚠',
    error: '✕',
    info: 'ℹ'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.9 }}
      className="relative backdrop-blur-xl bg-black/80 border rounded-lg p-4"
      style={{ borderColor: `${colors[type]}40` }}
    >
      {/* Ligne de scan animée */}
      <motion.div
        className="absolute inset-x-0 top-0 h-0.5"
        style={{ background: colors[type] }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5 }}
      />
      
      <div className="flex gap-3">
        {/* Icône */}
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-bold"
          style={{ 
            background: `${colors[type]}20`,
            color: colors[type]
          }}
        >
          {icons[type]}
        </div>
        
        {/* Contenu */}
        <div className="flex-1">
          <div className="font-medium text-white">{title}</div>
          {message && (
            <div className="text-sm text-gray-400 mt-1">{message}</div>
          )}
        </div>
        
        {/* Bouton fermer */}
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Composant de loader futuriste
export const FuturisticLoader: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}> = ({ size = 'md', color = '#00ff88' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className="relative">
      {/* Cercles rotatifs */}
      <motion.div
        className={cn("relative", sizes[size])}
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="absolute inset-0 rounded-full border-2"
            style={{
              borderColor: `${color}${(30 - index * 10).toString(16)}`,
              borderStyle: 'dashed'
            }}
            animate={{ 
              rotate: index % 2 === 0 ? 360 : -360,
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              rotate: { duration: 3 + index, repeat: Infinity, ease: "linear" },
              scale: { duration: 2, repeat: Infinity }
            }}
          />
        ))}
      </motion.div>
      
      {/* Point central pulsant */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{
          scale: [1, 1.5, 1],
          opacity: [1, 0.5, 1]
        }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div 
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color }}
        />
      </motion.div>
    </div>
  );
};
