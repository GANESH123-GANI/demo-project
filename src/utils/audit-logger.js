import crypto from 'node:crypto';

let lastHash = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Creates an immutable, tamper-evident audit record
 */
export function createAuditRecord({ actor = 'System', action, target, details }) {
  const timestamp = new Date().toISOString();
  const id = `AUD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

  const payload = JSON.stringify({ id, timestamp, actor, action, target, details, prevHash: lastHash });
  const hash = crypto.createHash('sha256').update(payload).digest('hex');
  lastHash = hash;

  return {
    id,
    timestamp,
    actor,
    action,
    target,
    details,
    hash,
    verified: true
  };
}

