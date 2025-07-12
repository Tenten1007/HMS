import React from "react";
import "../styles/glass.css";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = "", style }) => {
  return (
    <div className={`glass p-6 ${className}`} style={style}>
      {children}
    </div>
  );
};

export default GlassCard; 