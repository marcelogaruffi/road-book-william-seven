import { customConfirm } from "@/lib/custom-confirm";

type ConfirmCallback = (result: boolean) => void;

let confirmFn: ((message: string) => Promise<boolean>) | null = null;

export const customConfirm = async (message: string): Promise<boolean> => {
  if (confirmFn) {
    return confirmFn(message);
  }
  return window.confirm(message);
};

export const setConfirmFn = (fn: (message: string) => Promise<boolean>) => {
  confirmFn = fn;
};
