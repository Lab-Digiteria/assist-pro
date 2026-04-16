/**
 * audit.ts — helper para registrar ações críticas na tabela auditLogs
 */
import { auditLogs } from "../drizzle/schema";
import { getDb } from "./db";

export interface AuditEntry {
  actorId?: number;
  actorName?: string;
  tenantId?: number;
  action: string;
  resource?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.insert(auditLogs).values({
      actorId: entry.actorId ?? null,
      actorName: entry.actorName ?? null,
      tenantId: entry.tenantId ?? null,
      action: entry.action,
      resource: entry.resource ?? null,
      resourceId: entry.resourceId ?? null,
      metadata: entry.metadata ?? null,
      ipAddress: entry.ipAddress ?? null,
    });
  } catch (err) {
    // Audit log nunca deve quebrar o fluxo principal
    console.error("[Audit] Failed to log:", err);
  }
}
