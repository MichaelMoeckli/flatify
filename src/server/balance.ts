import { prisma } from "@/lib/db";

// Returns balance from the perspective of `meId`:
//   positive  → partner owes me this many cents
//   negative  → I owe partner this many cents
//   zero      → settled
export async function computeBalance(meId: string, partnerId: string): Promise<number> {
  const [paidByMeTotal, mySharesAcrossPartnerExpenses, settlementsFromPartner, settlementsFromMe] =
    await Promise.all([
      // Total I paid out (across all expenses)
      prisma.expense.aggregate({
        where: { paidById: meId },
        _sum: { amountCents: true },
      }),
      // My share total (across all expenses) — i.e. how much I personally owe out of all expenses
      prisma.expenseShare.aggregate({
        where: { userId: meId },
        _sum: { amountCents: true },
      }),
      // Partner paying me reduces the amount partner owes me
      prisma.settlement.aggregate({
        where: { fromUserId: partnerId, toUserId: meId },
        _sum: { amountCents: true },
      }),
      // Me paying partner reduces the amount I owe partner (i.e. increases what they owe me back)
      prisma.settlement.aggregate({
        where: { fromUserId: meId, toUserId: partnerId },
        _sum: { amountCents: true },
      }),
    ]);

  const paid = paidByMeTotal._sum.amountCents ?? 0;
  const myShare = mySharesAcrossPartnerExpenses._sum.amountCents ?? 0;
  const settledIn = settlementsFromPartner._sum.amountCents ?? 0;
  const settledOut = settlementsFromMe._sum.amountCents ?? 0;

  // net = (what I paid - my share) - settlements partner gave me + settlements I gave partner
  return paid - myShare - settledIn + settledOut;
}
