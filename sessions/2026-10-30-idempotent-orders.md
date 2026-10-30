# User story: idempotenta orderförsök – 2026-10-30

## Mål

Implementera user storyn: kunden ska kunna skicka om en order när nätet
strular utan att en andra order skapas.

## Faser genomförda

- Research skapad i `docs/research-order-idempotency.md`.
- Implementation planerad i `docs/plan-order-idempotency.md`.
- ADR skapad i `docs/adr/0001-idempotent-orders.md`.
- API-kontraktet uppdaterat i `docs/api.md`.
- Tester skrivna först i `tests/orders.test.ts`.
- Databas- och route/service-implementation påbörjad.

## Implementation

- Ny tabell `order_idempotency` med global unik nyckel.
- Hash av normaliserade orderfält lagras i stället för hela requesten.
- Första requesten svarar `201`.
- Identiskt omförsök svarar `200` med samma order.
- Ändrat innehåll eller annan kund med samma nyckel svarar `409`.
- Saknad eller för lång nyckel svarar `400`.
- Claim och order skapande sker i samma transaktion med
  `INSERT ... ON CONFLICT DO NOTHING`.

## Testresultat

### Rött test före implementation

De nya testerna kunde inte ansluta till PostgreSQL när Docker-motorn hade
stannat. Alla databasberoende tester fick därför `AggregateError` vid
`tests/helpers/db.ts`. Detta är ett miljöblockerande resultat, inte ett bevis
för att implementationen är korrekt eller felaktig.

### Gröna kontroller efter implementation

- ESLint: godkänd.
- TypeScript typecheck: godkänd.
- Prettier: godkänd.
- `git diff --check`: inga whitespacefel.
- `npm test`: 22 av 22 tester passerade.
- `npm run verify`: exitkod 0.

### Legacy-kontroll

`npm run test:legacy` kunde startas men blockerades av Windows Device Guard när
`pytest.exe` skulle köras. Detta är ett miljöblockerande resultat. Dessutom finns
ännu inga karakteriseringstester för legacy-modulen.

## Databasmigration

Expand- och rollbackfiler skapades:

- `db/migrations/001_add_order_idempotency.sql`.
- `db/migrations/001_add_order_idempotency.down.sql`.

Testdatabasen har återställts med `npm run db:reset` innan den gröna körningen.

## Nästa steg

Följande verifiering är genomförd:

```text
npm test
npm run verify
```

Concurrency-testet bekräftar att exakt en order skapas och att de två svaren
refererar till samma order.

Kvar för user storyn:

- skapa separata små commits;
- granska implementationen med `/review`;
- samla mätningar för tid, tokens och kontroller;
- kontrollera migrationens körning och rollback i en separat testdatabas.
