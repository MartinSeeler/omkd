import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { z } from "zod";
import { prisma } from "../../../db/client";

export const appRouter = trpc
  .router()
  .query("meals-by-date", {
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
              location: true,
              price: true,
            },
          },
        },
      });
    },
  })
  .query("similar", {
    input: z.object({
      query: z.string().min(3),
    }),
    async resolve({ input }) {
      const isFlagged = await fetch("https://api.openai.com/v1/moderations", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        method: "POST",
        body: JSON.stringify({
          input: input.query,
        }),
      }).then((res) => res.json());
      console.log(isFlagged);
      if (isFlagged.results[0].flagged) {
        throw new trpc.TRPCError({
          code: "FORBIDDEN",
          message: "Inhalt verstößt gegen die Community Guidelines",
          cause: "OpenAI",
        });
      }
      const query_embedding = await fetch(
        "https://api.openai.com/v1/embeddings",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          method: "POST",
          body: JSON.stringify({
            input: input.query,
            model: "text-search-babbage-query-001",
          }),
        }
      )
        .then((res) => res.json())
        .then((res) => res.data[0].embedding);

      return query_embedding;
    },
  });

export type AppRouter = typeof appRouter;

export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => null,
});
