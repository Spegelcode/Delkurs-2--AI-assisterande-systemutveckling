# Arbetspass: modernisering – parameteriserad SQL

## Läge

Första refaktoreringen av `src/legacy/price_calc.py` är genomförd.

## Ändring

Order-id och rabattkod skickas nu som parametrar till `psycopg` i stället för
att byggas in i SQL-strängar. Prisberäkning, trunkering, loggning och CLI-
beteende är inte ändrade.

## Bevis

- `npm run test:legacy`: `6 passed`.
- `npm run verify`: lint, format, typkontroll och `22/22` Jest-tester gröna.
- Karakteriseringstesterna visar att de tidigare observerade beloppen kvarstår.

## Återstår

- Dela upp dataläsning och beräkning i tydligare ansvar.
- Göra anslutnings- och loggberoenden mindre globala.
- Dokumentera expand/contract-planen för databasmoderniseringen.
