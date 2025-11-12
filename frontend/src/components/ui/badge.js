import React from "react";

const Badge = ({ children, variant = "default", className = "", ...props }) => {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
  
  const variants = {
    default: "bg-gray-100 text-gray-800",
    outline: "border bg-transparent",
    secondary: "bg-gray-100 text-gray-900",
    destructive: "bg-red-500 text-white",
    success: "bg-green-500 text-white"
  };

  const variantClasses = variants[variant] || variants.default;

  return (
    <span 
      className={`${baseClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};

export { Badge };