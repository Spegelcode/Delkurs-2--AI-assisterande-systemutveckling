# Plan: idempotenta orderförsök

## Acceptanskriterier

### Skapa order

**Givet** en inloggad kund och en giltig order med en ny `Idempotency-Key`  
**När** kunden skickar `POST /orders`  
**Så** skapas exakt en order och svaret är `201`.

### Identiskt omförsök

**Givet** att en order redan skapats med en viss nyckel  
**När** samma kund skickar samma order med samma nyckel igen  
**Så** skapas ingen ny order och svaret är `200` med den ursprungliga ordern.

### Konflikt med annat innehåll

**Givet** att en nyckel redan använts  
**När** kunden skickar en annan order med samma nyckel  
**Så** svarar API:t `409` utan att skapa en ny order.

### Konflikt mellan kunder

**Givet** att en nyckel redan använts av en kund  
**När** en annan kund skickar en order med samma nyckel  
**Så** svarar API:t `409` utan att avslöja den ursprungliga ordern.

### Ogiltig begäran

**Givet** att `Idempotency-Key` saknas, är tom eller längre än 255 tecken  
**När** kunden skickar `POST /orders`  
**Så** svarar API:t `400` med projektets vanliga felmodell.

### Samtidighet

**Givet** två identiska requests som skickas samtidigt  
**När** båda använder samma kund och nyckel  
**Så** finns exakt en order efteråt och båda svaren beskriver samma order.

## Implementation i små steg

1. Lägg till tester för header, första request och identiskt omförsök.
2. Lägg till tester för konflikt, annan kund, ogiltig nyckel och samtidighet.
3. Lägg till idempotens-tabellen i schema och testreset.
4. Lägg till hashning och claim i tjänstelagret.
5. Lägg till route-validering och statuskod `201`/`200`.
6. Kör `npm run verify` efter varje steg.
7. Granska SQL, behörighet och transaktionsgräns manuellt.

## Migration

Migrationen finns i `db/migrations/001_add_order_idempotency.sql` och kan backas
med `001_add_order_idempotency.down.sql`.

Expand-steget skapar tabellen utan att röra befintliga orders. Contract/rollback
får köras först när applikationskoden inte längre använder tabellen. Under
utveckling återställs testdatabasen fortfarande från `db/schema.sql`.

## Testmatris

| Fall | Förväntat |
|---|---|
| Ny giltig nyckel | 201, en order |
| Samma nyckel och body | 200, samma order-id |
| Samma nyckel annan body | 409, ingen ny order |
| Samma nyckel annan kund | 409, ingen läcka |
| Saknad nyckel | 400 |
| Tom eller lång nyckel | 400 |
| Två samtidiga requests | en order, båda får samma id |
| Befintliga orderfall | oförändrat gröna |
