import { createHash } from "node:crypto";
import { db } from "../db";
import { Result, ok, err } from "../result";

export type OrderLineInput = { product: string; quantity: number; unitPrice: number };

export type Order = {
  id: number;
  customerId: number;
  status: string;
  discountCode: string | null;
  lines: { product: string; quantity: number; unitPrice: string }[];
};

export type OrderCreation = { order: Order; created: boolean };

function validateLines(lines: unknown): Result<OrderLineInput[]> {
  if (!Array.isArray(lines) || lines.length === 0) {
    return err("invalid_input", "En beställning måste ha minst en rad.");
  }
  for (const line of lines) {
    if (
      typeof line?.product !== "string" ||
      !Number.isInteger(line?.quantity) ||
      line.quantity <= 0 ||
      typeof line?.unitPrice !== "number" ||
      line.unitPrice < 0
    ) {
      return err("invalid_input", "Varje rad behöver product, quantity (> 0) och unitPrice.");
    }
  }
  return ok(lines as OrderLineInput[]);
}

function requestHash(lines: OrderLineInput[], discountCode: string | null): string {
  const normalized = JSON.stringify({ lines, discountCode });
  return createHash("sha256").update(normalized).digest("hex");
}

export async function createOrder(
  customerId: number,
  input: { lines?: unknown; discountCode?: unknown },
  idempotencyKey: string,
): Promise<Result<OrderCreation>> {
  const lines = validateLines(input.lines);
  if (!lines.ok) return lines;
  const discountCode = typeof input.discountCode === "string" ? input.discountCode : null;
  const hash = requestHash(lines.value, discountCode);

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const claim = await client.query(
      `INSERT INTO order_idempotency (idempotency_key, customer_id, request_hash)
       VALUES ($1, $2, $3)
       ON CONFLICT (idempotency_key) DO NOTHING
       RETURNING idempotency_key`,
      [idempotencyKey, customerId, hash],
    );

    if (claim.rowCount === 0) {
      const existing = await client.query(
        `SELECT customer_id AS "customerId", request_hash AS "requestHash", order_id AS "orderId"
           FROM order_idempotency
          WHERE idempotency_key = $1
          FOR UPDATE`,
        [idempotencyKey],
      );
      const record = existing.rows[0];
      if (
        !record ||
        record.customerId !== customerId ||
        record.requestHash !== hash ||
        record.orderId === null
      ) {
        await client.query("ROLLBACK");
        return err("conflict", "Idempotency-Key har redan använts för en annan beställning.");
      }

      await client.query("COMMIT");
      const order = await getOrder(record.orderId, customerId);
      if (!order.ok) return err(order.error.code, order.error.message);
      return ok({ order: order.value, created: false });
    }

    const order = await client.query(
      "INSERT INTO orders (customer_id, discount_code) VALUES ($1, $2) RETURNING id",
      [customerId, discountCode],
    );
    const orderId: number = order.rows[0].id;
    for (const line of lines.value) {
      await client.query(
        "INSERT INTO order_lines (order_id, product, quantity, unit_price) VALUES ($1, $2, $3, $4)",
        [orderId, line.product, line.quantity, line.unitPrice],
      );
    }
    await client.query("UPDATE order_idempotency SET order_id = $2 WHERE idempotency_key = $1", [
      idempotencyKey,
      orderId,
    ]);
    await client.query("COMMIT");
    const created = await getOrder(orderId, customerId);
    if (!created.ok) return err(created.error.code, created.error.message);
    return ok({ order: created.value, created: true });
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
}

export async function getOrder(orderId: number, customerId: number): Promise<Result<Order>> {
  const res = await db.query(
    `SELECT id, customer_id AS "customerId", status, discount_code AS "discountCode"
       FROM orders WHERE id = $1`,
    [orderId],
  );
  if (res.rowCount === 0) {
    return err("not_found", `Beställning ${orderId} finns inte.`);
  }
  const order = res.rows[0];
  if (order.customerId !== customerId) {
    return err("forbidden", "Beställningen tillhör en annan kund.");
  }
  const lines = await db.query(
    `SELECT product, quantity, unit_price AS "unitPrice"
       FROM order_lines WHERE order_id = $1 ORDER BY id`,
    [orderId],
  );
  return ok({ ...order, lines: lines.rows });
}
