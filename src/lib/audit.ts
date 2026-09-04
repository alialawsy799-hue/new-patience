import { db } from '@/lib/db';
import { auditLogs } from '@/lib/db/schema';

export type AuditAction =
  | 'code.generated'
  | 'code.activated'
  | 'code.activation_failed'
  | 'code.revoked'
  | 'code.exported'
  | 'student.created'
  | 'student.access_granted'
  | 'student.access_revoked'
  | 'student.deactivated'
  | 'student.reactivated'
  | 'student.signed_out'
  | 'lesson.completed'
  | 'lesson.uncompleted'
  | 'stage.completed'
  | 'admin.login'
  | 'admin.login_failed'
  | 'admin.logout'
  | 'admin.settings_updated'
  | 'stage.updated'
  | 'lesson.created'
  | 'lesson.updated'
  | 'lesson.deleted'
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'category.created'
  | 'category.updated'
  | 'order.created'
  | 'order.status_changed'
  | 'contact.message_received'
  | 'security.rate_limited';

type AuditInput = {
  actorType: 'admin' | 'student' | 'system' | 'anonymous';
  actorId?: string | null;
  actorLabel?: string;
  action: AuditAction;
  entityType?: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Appends an audit entry.
 *
 * Auditing must never break the operation it is recording, so failures are
 * logged to the server console and swallowed.
 */
export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      actorType: input.actorType,
      actorId: input.actorId ?? null,
      actorLabel: input.actorLabel ?? '',
      action: input.action,
      entityType: input.entityType ?? '',
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? {},
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });
  } catch (error) {
    console.error('[audit] failed to record event', input.action, error);
  }
}
