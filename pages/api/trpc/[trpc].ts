import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { z } from "zod";
import { prisma } from "../../../db/client";

export const appRouter = trpc.router().query("meals-by-date", {
  input: z.object({
    date: z.string(),
  }),
  async resolve({ input }) {
    const startDate = new Date(input.date);
    const endDate = new Date(input.date);
    endDate.setDate(endDate.getDate() + 1);
    return await prisma.location.findMany({
      where: {
        meals: {
          some: {
            date: {
              gte: startDate,
              lt: endDate,
            },
          },
        },
      },
      include: {
        meals: {
          where: {
            date: {
              gte: startDate,
              lt: endDate,
            },
          },
          include: {
            price: true,
          },
        },
      },
    });
  },
});

export type AppRouter = typeof appRouter;

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => null,
});
