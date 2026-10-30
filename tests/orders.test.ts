import request from "supertest";
import { createApp } from "../src/app";
import { db } from "../src/db";
import { closeDb, resetDb } from "./helpers/db";

const app = createApp();

beforeEach(resetDb);
afterAll(closeDb);

describe("POST /orders", () => {
  it("lägger en beställning med rader", async () => {
    const res = await request(app)
      .post("/orders")
      .set("X-Customer-Id", "3")
      .set("Idempotency-Key", "create-order-1")
      .send({ lines: [{ product: "Musmatta", quantity: 2, unitPrice: 200 }] });
    expect(res.status).toBe(201);
    expect(res.body.customerId).toBe(3);
    expect(res.body.status).toBe("new");
    expect(res.body.lines).toEqual([{ product: "Musmatta", quantity: 2, unitPrice: "200.00" }]);
  });

  it("returnerar 400 utan rader", async () => {
    const res = await request(app)
      .post("/orders")
      .set("X-Customer-Id", "3")
      .set("Idempotency-Key", "invalid-lines-1")
      .send({ lines: [] });
    expect(res.status).toBe(400);
  });

  it("returnerar 400 när antalet inte är positivt", async () => {
    const res = await request(app)
      .post("/orders")
      .set("X-Customer-Id", "3")
      .set("Idempotency-Key", "invalid-quantity-1")
      .send({ lines: [{ product: "Musmatta", quantity: 0, unitPrice: 200 }] });
    expect(res.status).toBe(400);
  });

  it("returnerar 401 utan inloggning", async () => {
    const res = await request(app).post("/orders").send({ lines: [] });
    expect(res.status).toBe(401);
  });

  it("returnerar samma order vid identiskt omförsök", async () => {
    const body = { lines: [{ product: "Musmatta", quantity: 2, unitPrice: 200 }] };
    const first = await request(app)
      .post("/orders")
      .set("X-Customer-Id", "3")
      .set("Idempotency-Key", "retry-1")
      .send(body);
    const retry = await request(app)
      .post("/orders")
      .set("X-Customer-Id", "3")
      .set("Idempotency-Key", "retry-1")
      .send(body);

    expect(first.status).toBe(201);
    expect(retry.status).toBe(200);
    expect(retry.body.id).toBe(first.body.id);
    const count = await db.query(
      "SELECT count(*)::int AS count FROM order_idempotency WHERE idempotency_key = $1",
      ["retry-1"],
    );
    expect(count.rows[0].count).toBe(1);
  });

  it("returnerar 409 när samma nyckel används för annat innehåll", async () => {
    const first = await request(app)
      .post("/orders")
      .set("X-Customer-Id", "3")
      .set("Idempotency-Key", "conflict-1")
      .send({ lines: [{ product: "Musmatta", quantity: 1, unitPrice: 200 }] });
    const conflict = await request(app)
      .post("/orders")
      .set("X-Customer-Id", "3")
      .set("Idempotency-Key", "conflict-1")
      .send({ lines: [{ product: "Musmatta", quantity: 2, unitPrice: 200 }] });

    expect(first.status).toBe(201);
    expect(conflict.status).toBe(409);
    expect(conflict.body.error.code).toBe("conflict");
  });

  it("returnerar 409 när en annan kund använder nyckeln", async () => {
    await request(app)
      .post("/orders")
      .set("X-Customer-Id", "3")
      .set("Idempotency-Key", "cross-customer-1")
      .send({ lines: [{ product: "Musmatta", quantity: 1, unitPrice: 200 }] });
    const conflict = await request(app)
      .post("/orders")
      .set("X-Customer-Id", "4")
      .set("Idempotency-Key", "cross-customer-1")
      .send({ lines: [{ product: "Musmatta", quantity: 1, unitPrice: 200 }] });

    expect(conflict.status).toBe(409);
    expect(conflict.body.error.code).toBe("conflict");
  });

  it("returnerar 400 utan idempotensnyckel", async () => {
    const res = await request(app)
      .post("/orders")
      .set("X-Customer-Id", "3")
      .send({ lines: [{ product: "Musmatta", quantity: 1, unitPrice: 200 }] });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_input");
  });

  it("returnerar 400 för en för lång idempotensnyckel", async () => {
    const res = await request(app)
      .post("/orders")
      .set("X-Customer-Id", "3")
      .set("Idempotency-Key", "x".repeat(256))
      .send({ lines: [{ product: "Musmatta", quantity: 1, unitPrice: 200 }] });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("invalid_input");
  });

  it("skapar bara en order vid samtidiga identiska requests", async () => {
    const body = { lines: [{ product: "Musmatta", quantity: 1, unitPrice: 200 }] };
    const responses = await Promise.all(
      [1, 2].map(() =>
        request(app)
          .post("/orders")
          .set("X-Customer-Id", "3")
          .set("Idempotency-Key", "concurrent-1")
          .send(body),
      ),
    );

    expect(responses.map((response) => response.status).sort()).toEqual([200, 201]);
    expect(responses[0].body.id).toBe(responses[1].body.id);
    const count = await db.query(
      "SELECT count(*)::int AS count FROM order_idempotency WHERE idempotency_key = $1",
      ["concurrent-1"],
    );
    expect(count.rows[0].count).toBe(1);
  });
});

describe("GET /orders/:id", () => {
  it("returnerar en egen beställning med rader", async () => {
    const res = await request(app).get("/orders/1042").set("X-Customer-Id", "1");
    expect(res.status).toBe(200);
    expect(res.body.lines).toHaveLength(2);
  });

  it("returnerar 403 för en annan kunds beställning", async () => {
    const res = await request(app).get("/orders/1042").set("X-Customer-Id", "2");
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("forbidden");
  });

  it("returnerar 404 för en beställning som inte finns", async () => {
    const res = await request(app).get("/orders/9999").set("X-Customer-Id", "1");
    expect(res.status).toBe(404);
  });

  it("returnerar 400 för ett ogiltigt id", async () => {
    const res = await request(app).get("/orders/abc").set("X-Customer-Id", "1");
    expect(res.status).toBe(400);
  });
});

describe("GET /orders/:id/price", () => {
  it("räknar pris med moms via den äldre modulen", async () => {
    const res = await request(app).get("/orders/1042/price").set("X-Customer-Id", "1");
    expect(res.status).toBe(200);
    expect(Number(res.body.total)).toBe(1187.5);
  });
});
