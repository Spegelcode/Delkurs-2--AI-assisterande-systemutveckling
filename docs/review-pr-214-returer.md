# Seminarium: granskning av PR 214

## Omfattning

- Gren: `granskning/pr-214-returer`
- PR-commit: `52bf1f1`
- Ändring: `POST /orders/:id/returns`
- Omfattning: 6 filer, 108 tillagda rader
- Regeln följdes: inga brister rättades och grenen mergades inte till `main`.

## Kontroller

| Kommando | Resultat | Vad det visar |
|---|---|---|
| `npm run db:reset` | Godkänd | Lokal testdatabas återställd. |
| `npm test` | Godkänd, 25/25 | PR:ens tester och befintliga regressionstester är gröna. |
| `npm run lint` | Godkänd | ESLint hittade inget. |
| `npm run typecheck` | Godkänd | TypeScript-typerna är godkända. |
| `npm run test:legacy` | Godkänd, 6/6 | Äldre prisberäkning påverkas inte i testkörningen. |
| `npm run verify` | Underkänd | Prettier hittade stilfel i 4 PR-filer. |
| `git diff --check main...HEAD` | Godkänd | Inga whitespacefel i diffen. |

## Fynd

| Typ | Fil och rad | Vad bristen är | Varför det är en brist | Kontroll som hade stoppat/upptäckt |
|---|---|---|---|---|
| Säkerhet | `src/routes/returns.ts:12`, `src/services/returnService.ts:16` | Ägarskapet tas från `req.body.customerId`, och ordern hämtas bara på order-id. | En inloggad kund kan ange en annan kunds id och skapa retur på en order som inte ägs av den inloggade kunden. Det är en IDOR/behörighetsbrist. | `/review` med security-reviewer och ett 403-test. Befintlig test-integritetshook fångar inte saknade tester. |
| Säkerhet | `src/services/returnService.ts:3` | En live-liknande frakt-API-nyckel är hårdkodad i källkoden. | Nyckeln kan läcka via Git och bör komma från en skyddad miljövariabel eller secret store. | Security-reviewer och mänsklig granskning. Den nuvarande path-guard skannar sökvägar, inte källkodens innehåll, så detta visar en lucka. |
| Struktur | `src/routes/returns.ts:16-17`, `src/services/returnService.ts:17-18` | Tjänsten kastar exceptions och routen omvandlar alla fel till 500 med rå feltext. | Projektets standard kräver `Result`, `sendError` och rätt statuskod. Saknad order ska exempelvis bli 404, inte 500. | `/review`, manuell arkitekturgranskning och negativa 400/403/404-tester. |
| Struktur | `src/services/returnService.ts:34-36` | Ingen kontroll hindrar flera returer eller flera återbetalningar för samma order. | Samma order kan skickas in upprepade gånger och ge flera refund-poster. | `/review` och ett test för upprepad retur; nuvarande tester kör bara lyckade engångsfall. |
| Kodstandard | `src/services/returnService.ts:6-8,39` | API-resultatet använder `return_id`, `refund_amount` och `label_url`. | Projektets standard kräver camelCase i JSON-svar. | Manuell `/review`; lint fångar inte denna domänregel. |
| Kodstandard | `src/services/returnService.ts:27-30` | Återbetalningen räknas med JavaScript-nummer och `parseFloat`. | Projektets standard förbjuder flyttal för pengar och kräver decimal-/stränghantering. | Manuell review och kodstandarden; nuvarande lint och typecheck fångar inte ekonomiska precisionfel. |
| Kodstandard | `src/routes/returns.ts`, `src/services/returnService.ts`, `tests/returns.test.ts` | `npm run verify` stoppas av Prettier i 4 PR-filer. | Koden följer inte formatteringsregeln trots att lint, typkontroll och tester passerar. | Prettier och pre-commit-hooken. |
| Struktur/test | `tests/returns.test.ts:10-36` | Testerna täcker bara lyckade fall och kontrollerar inte returens innehåll i databasen. | Brister i 400, 401, 403, 404, ägarskap, dubbla returer och felaktigt belopp kan passera. | `/review` och testkravet i `docs/standard.md`; test-integritetshooken kan inte skapa saknade tester. |

## Vad automatiken hittade

- Prettier hittade formatteringsfel i fyra PR-filer.
- Lint och typkontroll passerade.
- Jest passerade med 25/25, vilket visar att den befintliga testmängden inte
  täcker de viktigaste negativa fallen.
- Legacy-testerna passerade med 6/6.

## Vad den manuella granskningen hittade

Den manuella säkerhets- och strukturgranskningen hittade ägarskapsfelet,
hardkodad nyckel, felaktig felmodell, risk för dubbla återbetalningar och
pengar som räknas med flyttal. Dessa fångas inte av den nuvarande automatiska
kvalitetsgrinden.

## Slutsats

PR:n är inte klar att mergas. Den har gröna tester men bryter mot projektets
behörighetsmodell, felmodell, kodstandard för pengar och formatteringskrav.
