# ADR 0001: Idempotenta orderförsök

## Status

Accepterad för implementation.

## Kontext

Klienten kan få timeout efter att servern har committat en order. Om klienten
försöker igen med nuvarande API skapas ytterligare en order. En kontroll i
klientkod eller endast i TypeScript skyddar inte mot samtidiga requests.

## Beslut

`POST /orders` kräver headern `Idempotency-Key`. Servern lagrar en hash av det
normaliserade orderinnehållet och kopplar nyckeln till ordern i en separat
`order_idempotency`-tabell. Databasen gör nyckeln unik globalt.

Första lyckade requesten svarar `201`. Ett identiskt omförsök svarar `200` med
samma order. Samma nyckel med annat innehåll eller från annan kund svarar `409`.

Claim av nyckeln och skapandet av ordern sker i samma PostgreSQL-transaktion.
`INSERT ... ON CONFLICT DO NOTHING` gör att samtidiga requests serialiseras av
databasen. Request-hashen lagras, men inte hela requesten.

## Alternativ som valdes bort

### Klientbaserad deduplicering

Valdes bort eftersom klienten inte kan veta om servern redan hunnit committa
innan nätverksfelet. Den ger ingen serversäkerhet.

### Endast kontroll i applikationskod

Valdes bort eftersom två samtidiga requests kan passera samma kontroll innan
någon av dem skriver ordern. En databasconstraint behövs som sista skydd.

### Kolumner direkt på `orders`

Valdes bort i första versionen för att hålla ordertabellen fri från teknisk
requeststatus och göra idempotensdata enklare att rensa eller migrera separat.

## Konsekvenser

Positiva konsekvenser:

- dubbla order stoppas även vid samtidighet;
- retry-beteendet är tydligt i API-kontraktet;
- konflikt kan upptäckas utan att lagra kundens hela request;
- idempotens kan hanteras och migreras separat.

Negativa konsekvenser:

- varje orderrequest kräver en extra tabellskrivning och läsning;
- klienten måste spara och återanvända nyckeln vid retry;
- gamla klienter som inte skickar headern får `400`;
- en retentionstrategi för gamla nycklar behövs senare.

## Verifiering

Beslutet verifieras med tester för första request, identiskt omförsök, konflikt,
annan kund, ogiltig nyckel, samtidighet och rollback. SQL ska vara parametriserad
och ägarskap ska kontrolleras i tjänstelagret.

