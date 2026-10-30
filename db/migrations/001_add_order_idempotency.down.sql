-- Contract/rollback: ta endast bort idempotensdata när applikationen inte längre använder tabellen.
BEGIN;

DROP TABLE IF EXISTS order_idempotency;

COMMIT;
