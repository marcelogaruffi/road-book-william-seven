import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhone(value: string | null | undefined | number): string {
  if (!value) return "";
  const strValue = String(value);
  let digits = strValue.replace(/\D/g, "");
  
  // Se começar com 55 (Brasil) e tiver 12 ou 13 dígitos
  if (digits.startsWith("55") && digits.length >= 12) {
    return digits.replace(/^55(\d{2})(\d{4,5})(\d{4})$/, "+55 ($1) $2-$3");
  }
  
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{0,4})(\d{0,4}).*/, (_, p1, p2, p3) => {
      let res = `(${p1}`;
      if (p2) res += `) ${p2}`;
      if (p3) res += `-${p3}`;
      return res;
    });
  }
  
  return digits.replace(/^(\d{2})(\d{0,5})(\d{0,4}).*/, (_, p1, p2, p3) => {
    let res = `(${p1}`;
    if (p2) res += `) ${p2}`;
    if (p3) res += `-${p3}`;
    return res;
  });
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

export function getErrorMessage(error: any): string {
  if (!error) return "Ocorreu um erro inesperado. Tente novamente.";
  
  const msg = typeof error === 'string' ? error : (error.message || error.error_description || "");
  const code = error.code || "";
  
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
    return "Falha de conexão. Verifique se você está conectado à internet.";
  }
  if (msg.includes("JWT") || msg.includes("Auth session missing") || code === 'PGRST301') {
    return "Sua sessão expirou. Por favor, faça login novamente.";
  }
  if (code === '23505' || msg.includes("duplicate key")) {
    return "Este item já existe no sistema.";
  }
  if (code === '23503' || msg.includes("foreign key")) {
    return "Ação bloqueada: Este item está vinculado a outras partes do sistema.";
  }
  if (code === 'PGRST116') {
    return "Nenhum dado encontrado para a sua solicitação.";
  }
  if (code === '42P01') {
    return "Ocorreu um problema no sistema de dados.";
  }
  if (msg.includes("Failed to upload") || msg.includes("storage")) {
    return "Falha ao enviar arquivo. Verifique sua internet ou tente uma imagem menor.";
  }
  if (msg.includes("rate limit") || code === '429') {
    return "Muitas solicitações ao mesmo tempo. Aguarde alguns segundos e tente novamente.";
  }
  if (msg.includes("User already registered") || msg.includes("duplicate email")) {
    return "Já existe uma conta com este e-mail.";
  }
  if (msg.includes("Invalid login credentials") || msg.includes("Invalid credentials")) {
    return "Usuário ou senha incorretos.";
  }
  if (msg.includes("SMS") || msg.includes("Twilio")) {
    return "Falha no envio da mensagem SMS. Verifique o número ou o saldo do sistema.";
  }
  
  // Return original if it doesn't look like technical jargon, or fallback to generic
  if (msg && !/[A-Z_0-9]{5,}/.test(msg) && msg.length < 80) {
      return msg;
  }
  
  return msg || "Ocorreu um erro inesperado. Tente novamente.";
}
