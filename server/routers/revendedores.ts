import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { revendedores } from "../../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";
import { sendEmail } from "../email";

const registerSchema = z.object({
  nome: z.string().min(2, "Nome obrigatório"),
  email: z.string().email("E-mail inválido"),
  whatsapp: z.string().min(10, "WhatsApp obrigatório"),
  cidade: z.string().min(2, "Cidade obrigatória"),
  estado: z.string().length(2, "Estado deve ter 2 letras"),
  atuacao: z.enum([
    "consultor_ti",
    "revendedor_software",
    "assistencia_tecnica",
    "agencia_marketing",
    "outro",
  ]),
  mensagem: z.string().optional(),
});

export const revendedoresRouter = router({
  // ── Público: cadastro de interesse ──────────────────────────────────────────
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verificar duplicata por e-mail
      const existing = await db
        .select({ id: revendedores.id })
        .from(revendedores)
        .where(eq(revendedores.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        throw new Error("Este e-mail já está cadastrado como revendedor.");
      }

      await db.insert(revendedores).values({
        nome: input.nome,
        email: input.email,
        whatsapp: input.whatsapp,
        cidade: input.cidade,
        estado: input.estado,
        atuacao: input.atuacao,
        mensagem: input.mensagem ?? null,
        status: "pendente",
      });

      // Notificar owner da plataforma
      await notifyOwner({
        title: "Novo interesse de revendedor",
        content: `${input.nome} (${input.email}) de ${input.cidade}/${input.estado} quer ser revendedor do Assist-Pró. Atuação: ${input.atuacao}.`,
      });

      // E-mail de confirmação ao revendedor
      await sendEmail({
        to: input.email,
        subject: "Recebemos seu interesse — Programa de Revendedores Assist-Pró",
        html: buildRevendedorConfirmationEmail({ nome: input.nome }),
      });

      return { success: true };
    }),

  // ── Admin: listar revendedores ───────────────────────────────────────────────
  list: adminProcedure
    .input(
      z.object({
        status: z.enum(["todos", "pendente", "ativo", "inativo"]).default("todos"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const rows = await db
        .select()
        .from(revendedores)
        .orderBy(desc(revendedores.createdAt));

      if (input.status === "todos") return rows;
      return rows.filter(r => r.status === input.status);
    }),

  // ── Admin: atualizar status ──────────────────────────────────────────────────
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pendente", "ativo", "inativo"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db
        .update(revendedores)
        .set({ status: input.status })
        .where(eq(revendedores.id, input.id));
      return { success: true };
    }),
});

// ── Template de e-mail de confirmação ────────────────────────────────────────
function buildRevendedorConfirmationEmail({ nome }: { nome: string }): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interesse de Revendedor Recebido</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:12px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;max-width:600px;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1B4F8A,#2563EB);padding:32px 40px;text-align:center;">
              <div style="font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">⚡ Assist-Pró</div>
              <div style="color:rgba(255,255,255,0.7);font-size:13px;margin-top:4px;">Programa de Revendedores</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 16px;">Olá, ${nome}! 👋</h2>
              <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 20px;">
                Recebemos seu interesse em fazer parte do <strong style="color:#fff;">Programa de Revendedores do Assist-Pró</strong>. 
                Ficamos muito felizes com o seu interesse!
              </p>
              <p style="color:rgba(255,255,255,0.7);font-size:15px;line-height:1.7;margin:0 0 24px;">
                Nossa equipe irá analisar seu perfil e entrar em contato em breve pelo WhatsApp ou e-mail que você informou.
              </p>
              <!-- Benefícios -->
              <div style="background:#1a1a1a;border-radius:8px;padding:24px;margin-bottom:24px;border:1px solid rgba(255,255,255,0.06);">
                <div style="color:#E8C547;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">O que você vai receber</div>
                <div style="display:flex;align-items:flex-start;margin-bottom:12px;">
                  <span style="color:#22c55e;font-size:16px;margin-right:10px;">✓</span>
                  <span style="color:rgba(255,255,255,0.8);font-size:14px;"><strong style="color:#fff;">Comissão recorrente</strong> — ganhe enquanto o cliente estiver ativo</span>
                </div>
                <div style="display:flex;align-items:flex-start;margin-bottom:12px;">
                  <span style="color:#22c55e;font-size:16px;margin-right:10px;">✓</span>
                  <span style="color:rgba(255,255,255,0.8);font-size:14px;"><strong style="color:#fff;">Material de apoio</strong> — apresentações, vídeos e suporte dedicado</span>
                </div>
                <div style="display:flex;align-items:flex-start;">
                  <span style="color:#22c55e;font-size:16px;margin-right:10px;">✓</span>
                  <span style="color:rgba(255,255,255,0.8);font-size:14px;"><strong style="color:#fff;">Sem investimento inicial</strong> — comece a revender sem custo nenhum</span>
                </div>
              </div>
              <p style="color:rgba(255,255,255,0.5);font-size:13px;line-height:1.6;margin:0;">
                Enquanto isso, se tiver dúvidas, entre em contato conosco pelo WhatsApp.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">
                © ${new Date().getFullYear()} Assist-Pró. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
