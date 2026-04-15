import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { tenantsRouter } from "./routers/tenants";
import { clientesRouter } from "./routers/clientes";
import { equipamentosRouter } from "./routers/equipamentos";
import { ordensServicoRouter } from "./routers/ordensServico";
import { estoqueRouter } from "./routers/estoque";
import { financeiroRouter, leadsRouter } from "./routers/financeiro";
import { billingRouter } from "./routers/billing";
import { runStripeReconciliation } from "./stripe-reconcile";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  tenants: tenantsRouter,
  clientes: clientesRouter,
  equipamentos: equipamentosRouter,
  os: ordensServicoRouter,
  estoque: estoqueRouter,
  financeiro: financeiroRouter,
  leads: leadsRouter,
  billing: billingRouter,
});

export type AppRouter = typeof appRouter;
