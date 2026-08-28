export const DEMO_EMAIL_FAMILIA = "demo.familia@cuideja.app";
export const DEMO_EMAIL_CUIDADORA = "demo.cuidadora@cuideja.app";
export const DEMO_SENHA = "CuidaJa#Demo2026";

export const ehContaDemo = (email: string | undefined, tipo: "familia" | "cuidadora") =>
  email?.toLowerCase() === (tipo === "familia" ? DEMO_EMAIL_FAMILIA : DEMO_EMAIL_CUIDADORA);
