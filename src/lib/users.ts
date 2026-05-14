import { prisma } from "./db";

export {
  getAllowedUsernames,
  isUsernameAllowed,
  pickColorFor,
  displayNameFor,
} from "./allowlist";

// Returns the *other* user in the 2-person household, given one user id.
export async function getPartner(userId: string) {
  return prisma.user.findFirst({
    where: { id: { not: userId } },
    orderBy: { createdAt: "asc" },
  });
}

export async function getBothUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: "asc" } });
}
