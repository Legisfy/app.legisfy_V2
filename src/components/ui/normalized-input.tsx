import React, { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { normalizeForStorage, formatForDisplay, areEquivalentStrings } from "@/utils/textNormalization";
import { cn } from "@/lib/utils";

interface NormalizedInputProps extends Omit<React.ComponentProps<typeof Input>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  normalize?: boolean;
  checkDuplicates?: boolean;
  existingValues?: string[];
  onDuplicateFound?: (isDuplicate: boolean, duplicateValue?: string) => void;
}

export const NormalizedInput = React.forwardRef<HTMLInputElement, NormalizedInputProps>(
  ({ 
    value, 
    onChange, 
    normalize = true,
    checkDuplicates = false,
    existingValues = [],
    onDuplicateFound,
    onBlur,
    className,
    ...props 
  }, ref) => {
    const [displayValue, setDisplayValue] = useState(value);
    const [isDuplicate, setIsDuplicate] = useState(false);

    // Update display value when prop value changes
    useEffect(() => {
      setDisplayValue(value);
    }, [value]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setDisplayValue(inputValue);
      
      // For real-time feedback, check duplicates on every change if enabled
      if (checkDuplicates && inputValue.trim()) {
        const normalized = normalizeForStorage(inputValue);
        const duplicate = existingValues.some(existing => 
          areEquivalentStrings(existing, inputValue)
        );
        setIsDuplicate(duplicate);
        onDuplicateFound?.(duplicate, duplicate ? inputValue : undefined);
      } else {
        setIsDuplicate(false);
        onDuplicateFound?.(false);
      }
    }, [checkDuplicates, existingValues, onDuplicateFound]);

    const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
      const inputValue = e.target.value.trim();
      
      if (normalize && inputValue) {
        // Format for display (first letter uppercase, etc.)
        const formattedValue = formatForDisplay(inputValue);
        setDisplayValue(formattedValue);
        
        // Check for duplicates
        if (checkDuplicates) {
          const duplicate = existingValues.some(existing => 
            areEquivalentStrings(existing, inputValue)
          );
          setIsDuplicate(duplicate);
          onDuplicateFound?.(duplicate, duplicate ? inputValue : undefined);
          
          if (duplicate) {
            // Don't update the value if it's a duplicate
            return;
          }
        }
        
        // Pass the formatted value back
        onChange(formattedValue);
      } else {
        onChange(inputValue);
      }
      
      // Call original onBlur if provided
      onBlur?.(e);
    }, [normalize, checkDuplicates, existingValues, onChange, onBlur, onDuplicateFound]);

    return (
      <div className="relative">
        <Input
          ref={ref}
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          className={cn(className, isDuplicate && 'border-red-500 focus-visible:ring-red-500')}
          {...props}
        />
        {isDuplicate && (
          <p className="text-sm text-red-500 mt-1">
            Esse valor já existe
          </p>
        )}
      </div>
    );
  }
);

NormalizedInput.displayName = "NormalizedInput";