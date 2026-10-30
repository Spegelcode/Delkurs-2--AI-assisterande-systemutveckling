-- Expand: lägg till idempotensdata utan att ändra befintliga orders.
BEGIN;

CREATE TABLE IF NOT EXISTS order_idempotency (
  idempotency_key TEXT PRIMARY KEY,
  customer_id     INTEGER NOT NULL REFERENCES customers(id),
  request_hash    TEXT NOT NULL,
  order_id        INTEGER REFERENCES orders(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMIT;
