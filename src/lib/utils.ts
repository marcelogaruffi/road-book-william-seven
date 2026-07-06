import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(value: string | null | undefined): string {
  if (!value) return "";
  let digits = value.replace(/\D/g, "");
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{0,4})(\d{0,4}).*/, (_, p1, p2, p3) => {
      let res = `(${p1}`;
      if (p2) res += `) ${p2}`;
      if (p3) res += `-${p3}`;
      return res;
    });
  } else {
    return digits.replace(/^(\d{2})(\d{0,5})(\d{0,4}).*/, (_, p1, p2, p3) => {
      let res = `(${p1}`;
      if (p2) res += `) ${p2}`;
      if (p3) res += `-${p3}`;
      return res;
    });
  }
}


export function maskPhone(value: string, oldValue: string): string {
  if (!value) return "";
  let digits = value.replace(/\D/g, "");
  
  // Detect backspacing over a formatting character
  if (value.length < oldValue.length && digits.length === oldValue.replace(/\D/g, "").length) {
    digits = digits.slice(0, -1);
  }

  if (!digits) return "";
  if (digits.length > 11) digits = digits.substring(0, 11);
  
  let formatted = digits;
  if (digits.length > 2) formatted = `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
  if (formatted.length > 10) formatted = `${formatted.substring(0, 10)}-${formatted.substring(10)}`;
  
  return formatted;
}
