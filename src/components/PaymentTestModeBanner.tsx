const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return <div className="w-full border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">Pagamentos reais ainda não foram ativados.</div>;
  }
  if (clientToken.startsWith('pk_test_')) {
    return <div className="w-full border-b border-primary/25 bg-primary/10 px-4 py-2 text-center text-sm text-foreground">Os pagamentos da prévia estão em modo de teste.</div>;
  }
  return null;
}