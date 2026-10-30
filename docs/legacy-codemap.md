# Codemap: äldre prisberäkning

## Omfattning

Den äldre delen består av prisberäkningen i `src/legacy/price_calc.py` och två
användare av modulen. Codemapen beskriver nuläget före refaktorering.

## Moduler och ansvar

| Modul | Ansvar | Beroenden | Risker i nuläget |
|---|---|---|---|
| `src/legacy/price_calc.py` | Läser en order, summerar orderrader, tillämpar rabatt, räknar moms och skriver logg. | PostgreSQL via `psycopg`, miljövariabeln `DATABASE_URL`, filsystemet. | Öppen SQL-stränginterpolering, global databasanslutning, globala konstanter, bred `except`, otydlig avrundningsregel och import med sidoeffekt. |
| `src/pricing/legacyPrice.ts` | TypeScript-brygga som startar Python-modulen och tolkar JSON-svaret. | Python-process, `src/legacy/price_calc.py`. | Processfel och Python-miljö måste hanteras mellan två språk. |
| `jobs/nightly_report.py` | Hämtar betalda order för ett datum och summerar resultat från `calc_price`. | `price_calc.calc_price`, den globala `price_calc.conn`, PostgreSQL. | SQL-stränginterpolering, direkt beroende av intern global anslutning och ingen tydlig transaktions-/felhantering. |
| `db/schema.sql` / `db/seed.sql` | Datamodell och fiktiva lokala exempeldata för order, rader och rabatter. | Dockeriserad PostgreSQL. | Äldre tabeller saknar främmande nycklar mellan order och orderrader samt regler för rabattens giltighet. |

## Dataflöde

```text
TypeScript -> python price_calc.py <order-id>
                         |
                         v
              global psycopg-anslutning
                         |
       orders -> order_lines -> discounts
                         |
                         v
            Pris(net, vat, total) + loggfil
```

## Beteenden som måste skyddas före refaktorering

- Pris räknas med 25 procent moms.
- Belopp kapas, inte avrundas, till två decimaler före momsberäkningen.
- Rabatt tillämpas på orderns summa när rabattkoden finns, även om rabattens
  datumintervall har gått ut.
- En order som saknas returnerar `None`; CLI:t skriver då ett svenskt felobjekt
  och avslutar med statuskod 1.
- Beräkningen försöker skriva en loggrad men låter loggfel passera utan att
  påverka prisresultatet.

## Moderniseringsordning

1. Karakteriseringstester låser nulägets observerbara beteende.
2. SQL-parametrar införs utan att ändra resultat eller avrundning.
3. Beräkningen delas upp i mindre, testbara ansvar med explicit beroende på
   anslutning.
4. Fil- och felhantering görs explicit efter att beteendet är dokumenterat.

Varje steg ska ha en egen liten commit och ett grönt testresultat i
`sessions/`.
