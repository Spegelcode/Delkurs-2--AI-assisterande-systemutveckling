# Kursprojekt: En rigg för en kodbas

## Grunduppgifter

- **Namn:** fyll i före PDF-inlämning
- **Kodbas:** övningsprojektets TypeScript-REST-API med PostgreSQL och äldre
  Python-modul för prisberäkning
- **Repo och tagg:** lokal Git-kopia på `main`; taggen `inlamning` skapas först
  efter slutkontroll. Ingen extern Git-remote finns.

## Kodbas, krav och beslut

### Vilken kodbas, och varför

Kodbasen valdes eftersom den har både en testad nyare del och en äldre,
odokumenterad prisberäkningsmodul. Det gör det möjligt att visa både ny
funktionalitet och säker modernisering utan kund- eller produktionsdata.
Se [README.md](../README.md), [legacy-codemap.md](./legacy-codemap.md) och
[research-order-idempotency.md](./research-order-idempotency.md).

### User story och acceptanskriterier

**Som kund vill jag kunna skicka om en beställning när nätet strular utan att
samma beställning läggs två gånger.**

- **Givet** en giltig order och en ny `Idempotency-Key`, **När** kunden skickar
  ordern, **Så** skapas exakt en order och svaret är `201`.
- **Givet** samma kund, samma nyckel och samma orderinnehåll, **När** requesten
  skickas igen, **Så** skapas ingen ny order och samma order returneras med `200`.
- **Givet** samma nyckel men annat innehåll eller annan kund, **När** requesten
  skickas, **Så** returneras `409` utan att orderdata läcker.
- **Givet** saknad, tom eller längre än 255 tecken lång nyckel, **När** requesten
  skickas, **Så** returneras `400`.
- **Givet** två samtidiga identiska requests, **När** båda når servern, **Så**
  skapas högst en order och båda svaren refererar till samma order.

Bevis finns i [tests/orders.test.ts](../tests/orders.test.ts) och
[adr/0001-idempotent-orders.md](./adr/0001-idempotent-orders.md).

### API-kontrakt

- **Endpoint:** `POST /orders`
- **Header:** `X-Customer-Id` för lokal autentisering och obligatoriska
  `Idempotency-Key` för deduplicering
- **201:** ny order skapad
- **200:** identiskt lyckat omförsök, samma order
- **400:** ogiltig eller saknad idempotensnyckel eller orderdata
- **401/403:** autentisering/behörighet enligt befintligt API
- **409:** nyckeln används av annan kund eller annat orderinnehåll
- **500:** oväntat server- eller databasfel

Detaljer finns i [api.md](./api.md).

### ADR och bortval

Beslutet är en separat `order_idempotency`-tabell med unik nyckel, hash av
normaliserat innehåll och transaktion runt claim plus order. Klientbaserad
deduplicering och enbart applikationskontroll valdes bort eftersom de inte
skyddar mot timeout efter commit eller samtidiga requests. ADR:n finns i
[0001-idempotent-orders.md](./adr/0001-idempotent-orders.md).

### Antaganden

- Testdata är fiktiv och lokal.
- En idempotensnyckel får återanvändas av samma kund endast för samma
  orderinnehåll.
- PostgreSQL är den lokala källan för samtidighetsgarantin.
- Retention/TTL för gamla nycklar är ett dokumenterat uppföljningsbeslut, inte
  en del av första user storyn.

## Riggens delar

### Skills och kommandon

| Del | Funktion och bevis |
|---|---|
| `/tdd` | Research, rött test, minsta gröna implementation, verifiering och sessionslogg. Se [.claude/commands/tdd.md](../.claude/commands/tdd.md). |
| `/review` | Säkerhet, struktur, kodstandard och testgranskning. Se [.claude/commands/review.md](../.claude/commands/review.md). |
| `/modernize` | Codemap, karakteriseringstester och tre små gröna refaktoreringar. Se [.claude/commands/modernize.md](../.claude/commands/modernize.md). |
| `/session-close` | Sparar bevis, beslut och nästa steg efter arbetspass. Se [.claude/commands/session-close.md](../.claude/commands/session-close.md). |

### Subagenter

| Namn | Uppgift | Verktyg | Modell |
|---|---|---|---|
| `researcher` | Kodkarta, krav och beroenden | Läsning, sökning | `haiku` |
| `tester` | TDD, negativa tester och regression | Läsning, testkörning, ändringsförslag | `sonnet` |
| `security-reviewer` | SQL, ägarskap, hemligheter och dataläckage | Läsning, sökning, verifiering | `sonnet` |
| `modernization-reviewer` | Legacy-codemap och stegvis refaktorering | Läsning, testkörning | `haiku` |

Definitionerna finns i [.claude/agents/](../.claude/agents/).

### Hooks

1. **SessionStart:** laddar senaste sessionsläget.
2. **PreToolUse Write/Edit:** path-guard stoppar `.env`, produktion, tokens och
   person-/kunddata.
3. **PreToolUse Bash:** command-guard stoppar `git push` och extern
   repo-koppling.
4. **Stop:** sparar sessionsläge till `sessions/session-state.jsonl`.
5. **Git pre-commit:** test-integritet och hela `npm run verify` måste vara
   gröna.
6. **Git commit-msg:** första raden måste beskriva ändringen.

Kod finns i [scripts/hooks/](../scripts/hooks/),
[.githooks/pre-commit](../.githooks/pre-commit) och
[.githooks/commit-msg](../.githooks/commit-msg). Utan dessa kontroller kunde
tester hoppas över, skyddade filer ändras eller en commit göras utan gröna
tester. Kommando-hooken testades genom att `git push` stoppades med exitkod 2.

### Bortval

En större hook- och agentrigg med fler automatiska steg valdes bort eftersom
den skulle bli svårare att förklara. Den valda riggen har fyra kommandon, fyra
subagenter och sex tydliga hooktyper som går att demonstrera lokalt.

## Behörigheter och sandlåda

- **Allow:** läsning, sökning, lint, typkontroll, formatkontroll, tester,
  verifiering och lokal Git-status/diff.
- **Ask:** installationer, Docker, commits, ändringar i databas och ändringar i
  agentkonfiguration.
- **Deny:** push, att lägga till/ändra remote, `.env`, produktion och skyddade
  datafiler.

Reglerna finns i [.claude/settings.json](../.claude/settings.json). Agenten kör
i den lokala Windows-workspacen med Docker för PostgreSQL. Ingen extern remote
finns, och kommando-hooken kompletterar deny-reglerna.

## Arbetsslingan och kontexten

Krav → researchfil → plan → ADR → test först → implementation → review →
verifiering → sessionslogg → liten commit. Planen ligger i
[kursprojekt-plan.md](./kursprojekt-plan.md). Kontext rensas genom att varje
fas lämnar en fil; sessionsloggarna bär över läge, bevis och beslut.

Exempel: commit `6a40ee9` implementerar idempotenta orderförsök. Den kan spåras
till [research-order-idempotency.md](./research-order-idempotency.md),
[plan-order-idempotency.md](./plan-order-idempotency.md), ADR:n,
[tests/orders.test.ts](../tests/orders.test.ts), migrationen och
[sessions/2026-10-30-idempotent-orders.md](../sessions/2026-10-30-idempotent-orders.md).

## Orkestrering och modellval

| Fas | Fil mellan faser |
|---|---|
| Research | `docs/research-order-idempotency.md` |
| Plan | `docs/plan-order-idempotency.md` |
| Beslut | `docs/adr/0001-idempotent-orders.md` |
| Bygg/test | kod och tester |
| Review | `docs/review-order-idempotency.md` |
| Modernisering | `docs/legacy-codemap.md`, tester och sessionsloggar |

`haiku` används för avgränsad research och codemap; `sonnet` för test- och
säkrare granskningsarbete. En större modell i alla faser valdes bort av
kostnadsskäl, men faktisk token/kronamätning saknas i denna miljö.

Om ett test misslyckas görs högst två informativa försök enligt kommandona;
därefter går arbetet tillbaka till research. Stoppvillkoren är grönt test,
spårbar fil och liten commit, eller ett dokumenterat miljö-/externblockerande
fel. Arbetet kördes sekventiellt i samma lokala workspace; worktrees valdes
bort eftersom uppgiften är individuell och ingen extern PR ska skapas.

## Styrd kodgenerering och granskning

- ESLint stoppar TypeScript-syntax och kodstandard.
- Prettier stoppar formatteringsavvikelser.
- TypeScript stoppar typfel.
- Jest och pytest stoppar regressionsfel.
- Test-integritet stoppar borttagna, skipade och exklusiva tester.
- Path- och command-guards stoppar skyddade datafiler och extern publicering.

Felmeddelanden visar kontroll, orsak och rättning. Människan granskar krav,
ADR, diff, reviewfynd och commit innan arbetet går vidare. Automatiken fångar
reproducerbara regelbrott; människan avgör exempelvis retention, rimliga
antaganden och om en arkitekturell förändring är säker.

## Granskning av agentgenererad kod

Den separata pull request som kursledaren ska dela ut fanns inte i den lokala
workspacen när dokumentet skrevs. Därför ska följande fyllas i efter att PR:n
har gjorts tillgänglig; [review-order-idempotency.md](./review-order-idempotency.md)
är den interna granskningen av vår egen implementation och ersätter inte PR:n.

| Typ | Rad/fynd | Varför | Kontroll |
|---|---|---|---|
| Säkerhet | fyll i från kursledarens PR | SQL, ägarskap, hemlighet eller dataläckage | security-reviewer, command/path-guard eller test |
| Struktur | fyll i från kursledarens PR | ansvar, transaktion eller felmodell | `/review` och mänsklig review |
| Kodstandard | fyll i från kursledarens PR | lint, format, typ eller parametrisering | `npm run verify` och pre-commit |

## Modernisering

Codemapen finns i [legacy-codemap.md](./legacy-codemap.md). Sex
karakteriseringstester finns i
[tests/legacy/test_price_calc.py](../tests/legacy/test_price_calc.py): order utan
rabatt, decimaltrunkering, utgången rabatt, tom order, saknad order och
loggning. De låser även historiska beteenden som inte får ändras oavsiktligt.

Tre separata gröna steg finns i commits:

1. `4987cb6` – parameterisera legacy-SQL.
2. `17320b1` – separera totalsumman.
3. `5964581` – gör anslutningen injicerbar.

Databasens expand/contract- och rollbackplan finns i
[legacy-migration-plan.md](./legacy-migration-plan.md).

## Mätningar

Se [matningar.md](./matningar.md). Viktigaste siffrorna är 22/22 Jest-tester,
6/6 Python-tester, cirka 2,4 sekunder för senaste fulla verifiering och 97
sekunder mellan de fyra moderniseringscommitsen. Tokens och kronor är inte
exponerade av verktyget och anges därför inte som om de vore uppmätta.

## Riggen i ett team

Första steget i ett team på fem är att lägga till repots `.claude/`, aktivera
`.githooks` och köra `npm run verify` i en ren lokal miljö. En person äger
riggen, men ändringar ska granskas i commit och ses över varje kurs-/release-
cykel. Jag väntar med fler automatiska regler tills befintliga felmeddelanden
och hookar är välkända.

Om modell eller verktyg byts ut följer repo-filerna, kommandona, testerna,
sessionsloggarna och `npm run verify` med. Endast modellnamn och adapter behöver
ändras.

## Risker

1. Agenten lägger in hemligheter eller kunddata. **Upptäckt:** path-guard och
   mänsklig diff. **Åtgärd:** stopp, ta bort data och logga händelsen.
2. Agenten tar bort eller skippar test. **Upptäckt:** test-integritetshook.
   **Åtgärd:** återställ och skriv rätt test.
3. Samtidiga retries skapar dubbla order. **Upptäckt:** concurrency-test.
   **Åtgärd:** unik databasnyckel och transaktion.
4. Legacy-refaktorering ändrar ekonomi eller avrundning. **Upptäckt:**
   karakteriseringstester och jämförelse av totalsummor. **Åtgärd:** backa ett
   litet commitsteg.
5. Agenten publicerar lokala filer externt. **Upptäckt:** ingen remote,
   settings deny och command-guard. **Åtgärd:** stoppa kommando och fortsätt
   lokalt.

## Lärdomar

Med en extra vecka skulle jag först lägga till automatisk mätning av tokens,
modellkostnad och väggtid per arbetspass, därefter ta emot kursledarens PR och
fylla den separata reviewtabellen. Jag skulle också göra migrationsplanen
körbar i en isolerad testdatabas i stället för att bara dokumentera stegen.
