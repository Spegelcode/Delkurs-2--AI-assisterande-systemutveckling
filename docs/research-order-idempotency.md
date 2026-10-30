# Research: omförsök utan dubbla beställningar

## Fråga

Hur kan `POST /orders` tåla att klienten skickar samma begäran igen när nätet
strular, utan att två beställningar skapas?

## Befintligt flöde

1. `src/routes/orders.ts` kräver `X-Customer-Id` via `requireCustomer`.
2. Route-funktionen skickar request body till `createOrder`.
3. `src/services/orderService.ts` validerar orderrader.
4. Tjänsten startar en PostgreSQL-transaktion.
5. En rad skapas i `orders`, sedan rader i `order_lines`.
6. Tjänsten committar och läser tillbaka ordern med `getOrder`.
7. Testerna återställer databasen före varje test via `tests/helpers/db.ts`.

## Risker

- Ett nätverksfel kan inträffa efter commit men före klientens svar.
- Två samtidiga requests kan båda hinna valideras innan någon order skapas.
- En klient kan återanvända en nyckel med ett annat orderinnehåll.
- En annan kund får inte kunna läsa eller återanvända en befintlig kunds nyckel.
- En unik regel endast i TypeScript räcker inte mot samtidighet.

## Vald databasstrategi

Skapa en separat tabell `order_idempotency` med:

- `idempotency_key` som primärnyckel;
- `customer_id`;
- hash av normaliserat request-innehåll;
- nullable `order_id` som fylls i samma transaktion.

Första requesten gör en `INSERT ... ON CONFLICT DO NOTHING`. Vid konflikt
jämförs kunden och request-hashen. Därmed skyddar databasen mot samtidiga
requests utan att applikationen behöver bygga SQL-strängar dynamiskt.

## Normalisering

Hashen ska baseras på ett begränsat objekt med de fält som faktiskt påverkar
orderresultatet:

```json
{
  "lines": [{"product": "...", "quantity": 1, "unitPrice": 10}],
  "discountCode": null
}
```

Radernas ordning bevaras. Inga personuppgifter eller hela requesten lagras i
idempotens-tabellen.

## Kodpunkter att ändra

- `db/schema.sql`: tabell och främmande nycklar.
- `src/routes/orders.ts`: läs och validera `Idempotency-Key`, välj statuskod.
- `src/services/orderService.ts`: claim, hash, konflikt och transaktion.
- `tests/orders.test.ts`: acceptans-, konflikt- och samtidighetstester.
- `docs/api.md`: kontrakt och statuskoder.

## Öppna frågor som nu är beslutade

- Nyckeln krävs för `POST /orders`.
- Första skapandet svarar `201`.
- Ett lyckat identiskt omförsök svarar `200` med samma order.
- Samma nyckel med annat innehåll eller annan kund svarar `409`.
- Nyckeln är opaque och får vara 1–255 tecken efter trimning.

