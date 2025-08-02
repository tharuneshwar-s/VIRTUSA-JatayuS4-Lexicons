'use client';

import * as React from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps {
  checked?: boolean | 'indeterminate';
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  value?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'priceai' | 'success' | 'warning' | 'error';
  children?: React.ReactNode;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6'
};

const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5'
};

const variantClasses = {
  default: {
    unchecked: 'border-gray-300 bg-white hover:border-gray-400',
    checked: 'bg-blue-600 border-blue-600 hover:bg-blue-700',
    indeterminate: 'bg-blue-600 border-blue-600 hover:bg-blue-700'
  },
  priceai: {
    unchecked: 'border-priceai-blue hover:border-priceai-lightblue',
    checked: 'bg-gradient-to-r from-priceai-blue to-priceai-lightgreen border-priceai-blue hover:from-priceai-blue/90 hover:to-priceai-lightgreen/90',
    indeterminate: 'bg-gradient-to-r from-priceai-blue to-priceai-lightgreen border-priceai-blue hover:from-priceai-blue/90 hover:to-priceai-lightgreen/90'
  },
  success: {
    unchecked: 'border-gray-300 bg-white hover:border-green-400',
    checked: 'bg-green-600 border-green-600 hover:bg-green-700',
    indeterminate: 'bg-green-600 border-green-600 hover:bg-green-700'
  },
  warning: {
    unchecked: 'border-gray-300 bg-white hover:border-yellow-400',
    checked: 'bg-yellow-500 border-yellow-500 hover:bg-yellow-600',
    indeterminate: 'bg-yellow-500 border-yellow-500 hover:bg-yellow-600'
  },
  error: {
    unchecked: 'border-gray-300 bg-white hover:border-red-400',
    checked: 'bg-red-600 border-red-600 hover:bg-red-700',
    indeterminate: 'bg-red-600 border-red-600 hover:bg-red-700'
  }
};

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ 
    checked = false, 
    onCheckedChange, 
    disabled = false, 
    id, 
    name, 
    value, 
    className,
    size = 'md',
    variant = 'priceai',
    children,
    ...props 
  }, ref) => {
    const isIndeterminate = checked === 'indeterminate';
    const isChecked = checked === true;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled) return;
      onCheckedChange?.(event.target.checked);
    };

    const getVariantClasses = () => {
      if (isIndeterminate) return variantClasses[variant].indeterminate;
      if (isChecked) return variantClasses[variant].checked;
      return variantClasses[variant].unchecked;
    };

    return (
      <label
        className={cn("flex items-center gap-2 cursor-pointer select-none", className, disabled && "opacity-50 cursor-not-allowed")}
      >
        <input
          ref={ref}
          type="checkbox"
          id={id}
          name={name}
          value={value}
          checked={isChecked}
          onChange={handleChange}
          disabled={disabled}
          className="peer absolute opacity-0 w-0 h-0"
          {...props}
        />
        <span
          className={cn(
            "relative flex items-center justify-center rounded border-2 transition-all duration-200",
            sizeClasses[size],
            getVariantClasses(),
            disabled && "opacity-50 cursor-not-allowed",
            "focus-within:ring-2 focus-within:ring-offset-2",
            variant === 'priceai' ? "focus-within:ring-priceai-blue/20" : "focus-within:ring-blue-500/20"
          )}
        >
          {isIndeterminate && (
            <Minus 
              className={cn(
                iconSizeClasses[size],
                "text-white stroke-[3]"
              )} 
            />
          )}
          {isChecked && (
            <Check 
              className={cn(
                iconSizeClasses[size],
                "text-white stroke-[3]"
              )} 
            />
          )}
        </span>
        {children && (
          <span
            className={cn(
              "text-sm font-medium leading-none",
              disabled ? "text-gray-400" : "text-priceai-dark"
            )}
          >
            {children}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
