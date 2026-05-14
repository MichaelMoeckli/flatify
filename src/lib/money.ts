const CURRENCY = "EUR";
const LOCALE = "de-CH";

export function formatCents(cents: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
  }).format(cents / 100);
}

export function parseAmountToCents(input: string): number | null {
  const cleaned = input.replace(/[^\d.,-]/g, "").replace(",", ".");
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

// Equal split for exactly two users. Payer absorbs any odd cent.
// Returns the two shares in the same order as [payerId, otherId].
export function equalSplit(
  totalCents: number,
  payerId: string,
  otherId: string,
): { userId: string; amountCents: number }[] {
  const otherShare = Math.floor(totalCents / 2);
  const payerShare = totalCents - otherShare;
  return [
    { userId: payerId, amountCents: payerShare },
    { userId: otherId, amountCents: otherShare },
  ];
}
