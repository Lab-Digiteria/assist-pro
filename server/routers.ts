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
import { leadRouter } from "./routers/lead";
import { subscriptionsRouter } from "./routers/subscriptions";
import { runStripeReconciliation } from "./stripe-reconcile";
import { adminRouter } from "./routers/admin";
import { revendedoresRouter } from "./routers/revendedores";
import { equipmentModelsRouter } from "./routers/equipmentModels";
import { listaComprasRouter } from "./routers/listaCompras";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => {
      if (!opts.ctx.user) return null;
      return {
        ...opts.ctx.user,
        isImpersonating: opts.ctx.isImpersonating ?? false,
        impersonatedBy: opts.ctx.impersonatedBy,
        tenantId: opts.ctx.tenantId,
        // isPlatformAdmin: true apenas quando role=admin E não é tenant (tenantId=null) E não está em impersonation
        // Garante que tenants com role=admin na tabela users não vejam o painel admin
        isPlatformAdmin: opts.ctx.user.role === "admin" && opts.ctx.tenantId === null && !opts.ctx.isImpersonating,
      };
    }),
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
  lead: leadRouter,
  subscriptions: subscriptionsRouter,
  admin: adminRouter,
  revendedores: revendedoresRouter,
  equipmentModels: equipmentModelsRouter,
  listaCompras: listaComprasRouter,
});

export type AppRouter = typeof appRouter;
