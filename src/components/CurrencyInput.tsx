import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
}

export function CurrencyInput({ value, onChange, ...props }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("0,00");

  useEffect(() => {
    if (!value) {
      setDisplayValue("0,00");
    } else {
      let numStr = String(value);
      if (numStr.includes(',')) {
        numStr = numStr.replace(/\./g, '').replace(',', '.');
      }
      let num = parseFloat(numStr);
      if (isNaN(num)) {
        setDisplayValue("0,00");
      } else {
        setDisplayValue(num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Remove everything except digits
    const digits = val.replace(/\D/g, "");
    
    if (!digits) {
      setDisplayValue("0,00");
      onChange("0,00");
      return;
    }

    // Convert to number and format
    const num = parseInt(digits, 10);
    const formatted = (num / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    setDisplayValue(formatted);
    onChange(formatted);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (!displayValue || displayValue === "0,00") {
      // Just keep 0,00
    }
    if (props.onFocus) props.onFocus(e);
  };

  return (
    <Input
      {...props}
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      inputMode="numeric"
    />
  );
}
