---
description: Granska ändringar för säkerhet, struktur, kodstandard och tester.
---

# /review

Granska ändringen i fyra lager:

1. Säkerhet: behörighet, ägarskap, SQL, hemligheter och dataläckage.
2. Struktur: ansvar mellan route, service, databas och legacy-bryggor.
3. Kodstandard: namn, Result-modell, statuskoder, parametriserad SQL och formattering.
4. Test: lyckat fall, negativa fall, regression, samtidighet och migration.

Rapportera varje fynd med fil, rad, konsekvens, prioritet och föreslagen kontroll.
Kör `npm run verify` och skilj på vad automatiken hittade och vad människan hittade.
