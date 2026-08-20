import { COOKIE_NAME } from "@shared/const";
import { z } from "zod";
import {
  advancePracticeOrder,
  createPracticeOrder,
  getAllPracticeOrders,
  getPracticeOrderEvents,
  getPracticeOrdersForCustomer,
} from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { PRACTICE_MENU, PRACTICE_ORDER_STATUSES } from "../shared/regionbites";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  practiceCatalog: router({
    list: publicProcedure.query(() => PRACTICE_MENU),
  }),
  practiceOrders: router({
    create: protectedProcedure
      .input(z.object({
        deliveryAddress: z.string().trim().min(10).max(500),
        items: z.array(z.object({ id: z.string().min(1), quantity: z.number().int().min(1).max(10) })).min(1).max(20),
      }))
      .mutation(({ ctx, input }) =>
        createPracticeOrder({ customerId: ctx.user.id, deliveryAddress: input.deliveryAddress, cart: input.items }),
      ),
    mine: protectedProcedure.query(({ ctx }) => getPracticeOrdersForCustomer(ctx.user.id)),
    events: protectedProcedure
      .input(z.object({ orderId: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const orders = await getPracticeOrdersForCustomer(ctx.user.id);
        if (!orders.some((order) => order.id === input.orderId)) throw new Error("Practice order not found");
        return getPracticeOrderEvents(input.orderId);
      }),
  }),
  practiceAdmin: router({
    list: adminProcedure.query(() => getAllPracticeOrders()),
    advance: adminProcedure
      .input(z.object({ orderId: z.number().int().positive(), nextStatus: z.enum(PRACTICE_ORDER_STATUSES) }))
      .mutation(({ input }) => advancePracticeOrder(input)),
  }),
});

export type AppRouter = typeof appRouter;
