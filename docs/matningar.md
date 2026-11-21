# Mätningar för kursprojektet

Mätningarna är hämtade från sessionsloggar, commitresultat och körningar i den
lokala Docker/PostgreSQL-miljön. Tiderna är inte uppskattningar när de anges
som körningstid; commitintervall anges uttryckligen som ett lägre mått och inte
som total arbetstid.

## Sammanfattning

| Arbete | Mätbart resultat | Bevis |
|---|---:|---|
| Baslinje | 502 npm-paket, cirka 37 s installation | `sessions/2026-10-25-baseline.md` |
| Ny funktion | 22/22 Jest-tester gröna | `sessions/2026-10-30-idempotent-orders.md` |
| Modernisering | 6/6 Python-tester gröna | `sessions/2026-10-30-modernisering-*.md` |
| Full kvalitetsgrind | 22 Jest + 6 Python gröna; verifiering cirka 2,4 s i senaste körningen | senaste `npm run verify` och commit-hookens output |
| Kontroller som fångade fel | minst 5 dokumenterade fynd | tabellen nedan |

## Tid

- Baslinjens npm-installation tog cirka 37 sekunder.
- Den senaste `npm run verify`-körningen tog cirka 2,4 sekunder efter att
  Docker redan var igång.
- `npm run test:legacy` tog 0,14 sekunder och körde sex tester.
- De fyra moderniseringscommitsen ligger mellan 10:23:44 och 10:25:21 i
  lokal Git-historik. Det är 97 sekunder mellan commitpunkterna och ska läsas
  som ett reproducerbart minimum för den sekvensen, inte som hela arbetstiden.

## Tokens och kostnad

Codex-verktyget exponerade inte ett säkert token- eller prisvärde i den här
arbetsmiljön. Därför anges inga påhittade tokens eller kronor. Modellvalet är
dokumenterat i `.claude/agents/`, men kostnadsjämförelsen mot en större modell
behöver kompletteras från den faktiska kursmiljöns usage-logg om läraren kräver
den siffran.

## Vad kontrollerna fångade

| Kontroll | Fångat | Konsekvens |
|---|---|---|
| PostgreSQL-/Docker-baslinje | Jest blockerades när databasen inte körde | Miljöproblem skiljdes från kodfel. |
| Prettier | 15 befintliga TypeScript-/testfiler var inte formatterade | Formatteringen åtgärdades separat innan grönt läge. |
| Plattformstest | `python3` gav 404 i prisendpointen på Windows | Bryggan använder `python` på Windows och `python3` på andra plattformar. |
| Test-integritetshook | Avsiktlig `describe.skip` stoppades | Tester kan inte hoppas över eller tas bort för att få grönt. |
| Path-guard | Avsiktlig `.env`-ändring stoppades | Hemligheter och skyddade sökvägar blockeras. |
| Kommando-hook | `git push` stoppades med exitkod 2 | Den lokala kurskopian kan inte publiceras genom riggens tillåtna kommandoflöde. |
| Legacy-karakterisering | 6 beteenden låstes före refaktorering | Trunkering, rabatt och loggning kan jämföras efter varje steg. |

## Två besparingar och kvalitetskostnad

1. Att köra legacy-testet som del av `verify` kostar 0,14 sekunder i senaste
   körningen men sparar manuell kontroll av sex beteenden. Kvalitetskostnaden
   är att verifieringen kräver lokal Python och PostgreSQL.
2. En liten `haiku`-subagent används för research och codemap medan
   `sonnet` reserveras för test- och säkerhetsbedömning. Det sparar modellkostnad
   jämfört med att använda den större modellen i alla faser, men den exakta
   kronor- eller tokenbesparingen är inte mätbar här. Kvalitetskostnaden är att
   researchresultatet måste granskas av huvudagenten och att komplexa fynd
   eskaleras till säkerhetsgranskaren.

## Begränsning

PR 214 granskades lokalt efter att seminariegrenen hämtats. Kontrollerna gav
25/25 gröna Jest-tester, medan `npm run verify` stoppades av Prettier i fyra
PR-filer. Den manuella granskningen hittade dessutom säkerhets-, struktur- och
kodstandardbrister. Se `docs/review-pr-214-returer.md`.
