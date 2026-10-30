# Review: idempotenta orderförsök

## Omfattning

Reviewen gäller ändringarna i `POST /orders`, idempotens-tabellen, migrationen,
testerna och kvalitetskontrollerna. Den är en intern review av vår user story,
inte den separata pull request-granskningen från kursledaren.

## Resultat

Inga blockerande fynd kvarstår efter korrigeringen av testets seed-data-antagande.
`npm run verify` är grönt med 22 av 22 tester.

## Säkerhet

### Godkänt: kundidentitet kommer från autentiserad request

Route använder `requireCustomer` och skickar `customerId` från
`AuthedRequest`. Idempotensposten jämför därefter kund-id innan en tidigare
order returneras.

### Godkänt: SQL är parametriserad

Idempotensnyckel, kund-id och request-hash skickas som query-parametrar. Ingen
requestdata byggs in i SQL-strängar.

### Godkänt: hela requesten lagras inte

Endast hash av normaliserade orderfält sparas. Nyckelkonflikt returnerar inte
den befintliga orderns innehåll till en annan kund.

## Struktur

### Godkänt: transaktionsgränsen ligger i tjänstelagret

Claim, order, orderrader och koppling till `order_idempotency` sker i samma
transaktion i `src/services/orderService.ts`.

### Godkänt: route ansvarar för HTTP-status

Route väljer `201` för ny order och `200` för identiskt omförsök. Tjänsten
returnerar domänresultat och konflikter med projektets `Result`-modell.

### Uppföljning: retention saknas

Idempotensnycklar rensas inte automatiskt. Det är inte ett blockerande fel för
kursens user story, men produktion skulle behöva retention/TTL och en policy för
hur länge en klient får retry:a.

## Kodstandard

- ESLint: godkänd.
- Prettier: godkänd.
- TypeScript typecheck: godkänd.
- `git diff --check`: inga whitespacefel.
- Testskyddet stoppar `describe.skip` och borttagna testfiler.

## Testbevis

Tester täcker:

- första requesten;
- identiskt omförsök;
- annan body med samma nyckel;
- annan kund med samma nyckel;
- saknad och för lång nyckel;
- samtidiga identiska requests;
- befintliga order- och kundflöden.

## Automatiken jämfört med människan

Automatiken hittade formatteringsfel och stoppade avsiktligt syntaxfel samt
`describe.skip` under tidigare verifieringar. Den manuella reviewn identifierade
retention som en framtida driftfråga och kontrollerade att konfliktvägen inte
läcker orderdata.

## Slutsats

User storyns implementation är redo för en lokal commit. Retention och den
separata granskningen av kursledarens pull request kvarstår som senare arbete.

