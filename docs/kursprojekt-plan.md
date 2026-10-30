# Arbetsplan: En rigg för en kodbas

## Syfte

Den här planen är arbetsunderlag för kursprojektet *En rigg för en kodbas*.
Den ska följas under arbetet och uppdateras när ett beslut, ett mätresultat eller
en avvikelse gör att planen ändras.

Målet är en liten, körbar och spårbar agentrigg för detta projekt:

- TypeScript-API:t för kunder och beställningar.
- den äldre prisberäkningsmodulen i `src/legacy/price_calc.py`.
- lokal Git-historik utan extern remote eller push.

Målet är att kunna lämna in:

1. riggen i repot, taggad `inlamning`;
2. ifylld kursdokumentation som PDF;
3. underlag för muntlig redovisning och live-demo.

## Arbetssätt och regler

Följande regler gäller under hela projektet:

- Allt som styr agenten ska ligga i repot.
- Varje arbetspass avslutas med en fil i `sessions/`.
- Tester får aldrig tas bort eller hoppas över för att få grönt resultat.
- Agenten får föreslå teständringar, men ändringar ska granskas av människan.
- Ingen kunddata, produktionsdata, hemlighet eller token får läggas i repot.
- Ingen extern Git-remote får läggas tillbaka och ingen `git push` får köras.
- Varje större beslut ska ha en ADR eller en hänvisning till en sessionslogg.
- Varje commit ska vara liten nog att kunna förklaras i redovisningen.

## Nuläge

Kontrollerat vid planens start:

- Repo: `C:/Users/Dator/Documents/projectAiSkola/ovningsprojekt`.
- Lokal branch: `main`.
- Extern Git-remote: borttagen.
- Testkod finns i `tests/`.
- Kodstandard finns i `docs/standard.md`, men alla regler kontrolleras ännu inte automatiskt.
- Agentmappar finns i `.claude/agents/` och `.claude/skills/`, men innehåller ännu bara `.gitkeep`.
- Sessionsmapp finns i `sessions/`, men behöver fyllas med riktiga arbetspass.
- Den äldre modulen är `src/legacy/price_calc.py`.
- Den äldre modulen används av `src/pricing/legacyPrice.ts` och `jobs/nightly_report.py`.

## Val av user story

Vald user story:

> Som kund vill jag kunna skicka om en beställning när nätet strular,
> utan att samma beställning läggs två gånger.

Preliminärt API-beslut:

- Endpoint: `POST /orders`.
- Klienten skickar headern `Idempotency-Key`.
- Första lyckade anropet skapar ordern och svarar `201`.
- Samma kund med samma nyckel och samma beställningsinnehåll får samma orderresultat.
- Samma nyckel med annat innehåll svarar `409`.
- Saknad eller ogiltig nyckel svarar `400`.
- En annan kund får inte återanvända eller läsa en nyckel som tillhör någon annan.

Detta är ett preliminärt beslut. Det ska verifieras mot kodbasen i researchfasen
och fastställas i en ADR innan implementationen börjar.

## Övergripande faser

| Fas | Resultatfil eller bevis | Klar när |
|---|---|---|
| 0. Baslinje | `sessions/baseline.md` | Test, lint, format och typkontroll är körda och resultatet är sparat. |
| 1. Research | `docs/research-order-idempotency.md` | Kodflöde, databas och risker är kartlagda. |
| 2. Plan | `docs/plan-order-idempotency.md` | Acceptanskriterier, API och teststrategi är beslutade. |
| 3. ADR | `docs/adr/0001-idempotent-orders.md` | Viktigaste beslutet och bortvalet är dokumenterat. |
| 4. Kodstandard | `scripts/quality/` och uppdaterad konfiguration | Kontrollerna går att köra med ett kommando och ger begripliga fel. |
| 5. Agentrigg | `.claude/` och hooks | Skills, subagenter, hooks och behörigheter kan demonstreras. |
| 6. Ny funktion | kod, migration och tester | User storyns kriterier är gröna. |
| 7. Agentgranskning | `docs/review-agentkod.md` | Säkerhet, struktur och kodstandard är granskade. |
| 8. Modernisering | `docs/legacy-codemap.md`, tester och migration | Fem karakteriseringstester och tre gröna refaktoreringar finns. |
| 9. Mätning | `docs/matningar.md` och sessionsloggar | Tider, tokens, kostnad och fångade fel har verkliga belägg. |
| 10. Inlämning | PDF, lokal tagg och demo-underlag | Alla mallrutor har hänvisningar och slutkontrollen är grön. |

## Fas 0: Baslinje

Kör från projektroten:

```text
npm install
npm test
npm run lint
npm run format:check
npm run typecheck
npm run test:legacy
```

Spara för varje kommando:

- datum och tid;
- kommando;
- exitkod;
- antal tester och resultat;
- felmeddelande, om något misslyckas;
- vad som krävs för att rätta felet.

Skapa `sessions/baseline.md`. Baslinjen får inte skrivas om i efterhand utan
att ändringen förklaras i en ny sessionslogg.

## Fas 1: Research

Kartlägg följande innan kod ändras:

1. request-flödet från `src/routes/orders.ts` till `src/services/orderService.ts`;
2. hur `Result`, `sendResult` och `sendError` används;
3. databasens tabeller, constraints och transaktioner;
4. hur testerna skapar och återställer testdata;
5. hur behörighet kontrolleras via `requireCustomer`;
6. risk för race conditions vid två samtidiga beställningar;
7. vilken databasändring som krävs och hur den kan backas;
8. vilka loggar eller felmeddelanden som kan läcka personuppgifter.

Skriv resultatet i `docs/research-order-idempotency.md` med fil- och
symbolhänvisningar.

## Fas 2: Krav och testplan

Skriv acceptanskriterier i Givet/När/Så-form. Minst följande fall ska finnas:

1. giltigt första anrop skapar exakt en order;
2. samma request upprepad med samma nyckel skapar inte en andra order;
3. samma nyckel med ändrat innehåll svarar `409`;
4. saknad nyckel svarar `400`;
5. ogiltig nyckel svarar `400`;
6. en annan kund kan inte återanvända nyckeln;
7. två samtidiga anrop ger högst en order;
8. ett misslyckat anrop lämnar inte kvar en halv order;
9. befintliga orderflöden fortsätter fungera.

Testplanen ska skilja på:

- route/integrationstester;
- servicelagerstester;
- databas-/constraintbeteende;
- säkerhets- och behörighetstester;
- regressionstester.

## Fas 3: ADR

Skapa `docs/adr/0001-idempotent-orders.md` med:

- kontext och problem;
- beslutet om `Idempotency-Key`;
- datamodell och unik constraint;
- transaktionsgräns;
- statuskoder och felmodell;
- alternativ som valdes bort;
- konsekvenser och återställningsstrategi;
- hur beslutet verifieras av tester.

Alternativ som ska jämföras:

- klienten försöker själv undvika dubbla anrop;
- kontroll i applikationskod utan databasconstraint;
- separat idempotency-tabell;
- kolumn på `orders`.

För Väl godkänt ska bortvalet stödjas av verkliga mätningar eller tydliga
kontrollresultat, till exempel antal tester, tid, fel eller antal extra
databasfrågor.

## Fas 4: Kodstandard och kvalitetsskript

Utgå från `docs/standard.md` och gör reglerna körbara där det är rimligt.

Minimikontroller:

- ESLint;
- Prettier check;
- TypeScript typecheck;
- Jest-tester;
- Python-tester;
- kontroll mot testskip och borttagna tester;
- kontroll av hemligheter och oönskade `.env`-filer;
- kontroll av felaktig eller uppenbart icke-parametriserad SQL.

Varje kontroll ska ha ett felmeddelande med:

1. vad som är fel;
2. var felet finns;
3. varför regeln finns;
4. hur felet rättas;
5. hur kontrollen körs igen.

Lägg gemensamma kontroller i exempelvis `scripts/quality/` och samla dem i
ett tydligt npm-kommando, exempelvis `npm run verify`.

## Fas 5: Skills och kommandon

Implementera minst följande:

### `/tdd`

Arbetsordning:

1. läs krav och befintlig kod;
2. skriv eller uppdatera ett test;
3. kör testet och visa rött resultat;
4. implementera minsta ändring;
5. kör relevanta tester;
6. kör hela verifieringen;
7. skriv sessionslogg.

Stoppvillkor: två misslyckade försök på samma fel utan ny information leder till
paus och research, inte fler blinda ändringar.

### `/review`

Granska säkerhet, struktur, kodstandard, testtäckning, migration och API-
kompatibilitet. Resultatet ska vara en fil med prioriterade fynd och bevis.

### `/modernize`

Kräv codemap, karakteriseringstest före refaktorering, ett litet steg i taget
och gröna tester efter varje steg.

### `/session-close`

Skapa sessionslogg med läge, bevis, misslyckanden, återstående arbete, beslut,
mätningar och nästa steg.

## Fas 6: Subagenter

Skapa minst fyra subagenter i `.claude/agents/`.

| Namn | Uppgift | Tillåtna verktyg | Förväntat resultat |
|---|---|---|---|
| `researcher` | Kartlägga kod, API, databas och beroenden. | Läsning, sökning, testkörning. | Researchfil med filhänvisningar. |
| `tester` | Föreslå och implementera tester enligt `/tdd`. | Läsning, testfiler, testkörning. | Tester och testresultat. |
| `security-reviewer` | Kontrollera behörighet, SQL, hemligheter och dataflöden. | Läsning, sökning, kvalitetsskript. | Prioriterad säkerhetsgranskning. |
| `modernization-reviewer` | Granska legacy-modulens beteende och refaktorering. | Läsning, Python-tester, codemap. | Codemap, testförslag och risker. |

Varje subagent ska ange modell, stoppvillkor och vad den inte får göra.
Specialistmodeller ska användas där uppgiften är avgränsad. En större modell
används bara när research visar att det behövs, och skillnaden ska mätas.

## Fas 7: Hooks och minneskedja

Implementera och demonstrera minst fem hooks:

1. **Session start:** läser senaste relevanta fil i `sessions/`.
2. **Plan check:** stoppar implementation om plan eller acceptanskriterier saknas.
3. **File guard:** stoppar åtkomst till `.env`, produktionsdata och förbjudna filer.
4. **Quality gate:** kör lint, format-check, typecheck och tester före commit.
5. **Test protection:** stoppar borttagning, skip eller avstängning av tester.
6. **Session save:** sparar resultat, beslut och nästa steg efter arbetspass.

För varje hook ska det finnas ett positivt och ett negativt testfall. Dokumentera:

- händelse;
- kommando eller script;
- vad som stoppas;
- förväntat felmeddelande;
- bevis på körning;
- känd begränsning.

## Fas 8: Behörigheter och sandlåda

Projektets inställningar ska uttryckligen ange:

### Allow

- läsa filer i repot;
- söka i repot;
- köra tester, lint, format-check och typecheck;
- skapa sessionsloggar och analysfiler.

### Ask

- ändra databas-schema eller migration;
- installera paket;
- ändra agentkonfiguration;
- skapa commits;
- ändra testdata eller Docker-konfiguration.

### Deny

- `git push`;
- återläggning av extern remote;
- åtkomst till `.env`;
- produktionsdata;
- radering eller avstängning av tester;
- destruktiva databasoperationer utan uttryckligt godkännande.

Dokumentera var agenten körs och vilka begränsningar den miljön ger.

## Fas 9: Implementera user storyn

Implementation ska ske i följande ordning:

1. skriv migrationsplanen;
2. skriv röda tester;
3. lägg till databasändring i reversibla steg;
4. implementera service-logik;
5. implementera route- och felhantering;
6. testa behörighet och samtidighet;
7. kör hela verifieringen;
8. granska diffen manuellt;
9. skapa små commits.

Varje commit ska ha ett meddelande som förklarar ett steg, exempelvis:

- `docs: define idempotent order contract`
- `test: cover repeated order requests`
- `db: add order idempotency constraint`
- `feat: return existing order for repeated request`
- `test: verify idempotency conflict and ownership`

Efter varje commit ska sessionsloggen kunna svara på vad som ändrades, varför,
vilka kontroller som kördes och vad resultatet blev.

## Fas 10: Granskning av agentgenererad kod

När kursledarens pull request finns ska den granskas utan att lita på att
testerna är tillräckliga.

Rapporten `docs/review-agentkod.md` ska ha minst en brist inom varje kategori:

- **Säkerhet:** exempelvis bristande ägarskapskontroll, SQL eller läckta data.
- **Struktur:** exempelvis fel lager, duplicerad logik eller felaktig transaktion.
- **Kodstandard:** exempelvis fel felmodell, namn, formattering eller testskip.

Varje fynd ska innehålla:

- fil och rad;
- observation;
- varför det är ett problem;
- konsekvens;
- vilken hook eller kontroll som borde stoppa det;
- vad endast människan kunde avgöra.

Om pull requesten inte har levererats ännu ska rapportmallen och testmetoden
förberedas, men inga påhittade fynd får skrivas som verkliga resultat.

## Fas 11: Modernisering av legacy-modulen

Skapa `docs/legacy-codemap.md` med:

- moduler och ansvar;
- inkommande och utgående beroenden;
- databasåtkomst;
- anrop från API och nattlig rapport;
- risker vid ändring.

Skriv minst fem karakteriseringstester innan refaktorering. Testerna ska fånga
verkligt nuvarande beteende, inklusive misstänkta eller oväntade beteenden.

Gör minst tre separata refaktoreringar. Efter varje steg ska följande sparas:

- commit;
- testkommando;
- grönt resultat;
- eventuell ändrad förståelse.

Skriv en expand/contract-plan för databasen:

1. expand: lägg till kompatibelt schema;
2. migrera eller fyll data;
3. byt kod till nya fält eller tabeller;
4. verifiera;
5. contract: ta bort gammalt först när det är säkert.

Markera för varje steg om det går att backa och hur.

## Fas 12: Mätningar

Skapa `docs/matningar.md` och fyll på efter varje verkligt arbete.

Mät per arbete:

- start och sluttid;
- antal agentvarv;
- tokens, om verktyget visar värdet;
- modell och eventuell kostnad;
- antal körda kontroller;
- antal fel som automatiken fångade;
- antal fel som människan fångade;
- antal omarbetningar;
- testernas körtid.

Jämför minst två val och dokumentera kvalitetskostnaden. Exempel:

- specialiserad subagent mot större generell modell;
- tidig hook mot senare manuell granskning;
- kort sessionskontext mot plan + sessionslogg.

Mätvärden som inte kan observeras ska markeras som okända, inte uppskattas.

## Fas 13: Dokumentation enligt mallen

Samla underlaget i en dokumentationsfil, exempelvis
`docs/kursprojekt-dokumentation.md`, med följande rubriker:

1. Kodbas, krav och beslut.
2. Riggens delar.
3. Behörigheter och sandlåda.
4. Arbetsslingan och kontexten.
5. Orkestrering och modellval.
6. Styrd kodgenerering.
7. Granskning av agentgenererad kod.
8. Modernisering.
9. Mätningar.
10. Riggen i ett team.
11. Risker.
12. Lärdomar.

Varje ruta ska ha minst en repo-hänvisning till fil, commit eller sessionslogg.
Alla påståenden om fungerande kontroller ska ha ett körbevis.

## Fas 14: Slutkontroll och inlämning

Slutkontroll:

```text
npm run verify
npm test
npm run test:legacy
git status --short --branch
git remote -v
git tag --list
```

Kontrollera dessutom:

- inga remotes finns;
- inga hemligheter eller kunddata finns;
- alla sessionsloggar finns;
- plan, research, ADR och mätningar finns;
- minst fyra subagenter finns;
- minst tre skills/kommandon finns;
- minst fem hooks är demonstrerade;
- allow, ask och deny är dokumenterade;
- minst fem karakteriseringstester finns;
- minst tre moderniseringssteg har gröna resultat;
- kursledarens pull request är granskad om den är tillgänglig;
- dokumentationen pekar på konkreta bevis.

Skapa därefter den lokala taggen:

```text
git tag inlamning
```

Taggen får skapas först när slutkontrollen är dokumenterad. Den ska inte
pushas någonstans.

## Stoppvillkor

Arbetet ska pausas och dokumenteras i sessionsloggen när:

- samma fel kvarstår efter två försök utan ny information;
- en databasändring riskerar dataförlust;
- en hook kan kringgås utan att det är avsiktligt dokumenterat;
- ett test behöver tas bort eller hoppas över för att bli grönt;
- kursledarens krav kräver ett externt underlag som saknas;
- ett mätvärde inte kan verifieras.

Vid stopp ska nästa steg vara research, användarfråga eller avgränsning, inte
fler blinda implementationer.

## Förväntade risker

| Risk | Upptäckt | Åtgärd |
|---|---|---|
| Agenten ändrar för mycket | Stor eller svårförklarad diff | Mindre uppgift, stoppvillkor och commit. |
| Tester döljer regression | Saknade negativa fall | Testmatris och manuell granskning. |
| Idempotens fungerar inte vid samtidighet | Dubbel order i concurrency-test | Databasconstraint och transaktion. |
| Hook körs inte i rätt miljö | Negativt test passerar obehindrat | Dokumentera integration och lägg kontroll i verifieringskommando. |
| Sessionslogg saknar bevis | Påstående utan kommando eller resultat | Session-close-hook och obligatoriska fält. |

## Definition of Done

Projektet är klart först när:

- user storyn är implementerad med gröna tester;
- agentriggen är körbar och demonstrerbar;
- tre verkliga arbeten är dokumenterade, eller återstående delar är tydligt
  markerade med orsak;
- kontrollernas styrkor och begränsningar är mätta;
- dokumentationen följer kursmallen;
- varje relevant påstående går att spåra till repo, commit eller sessionslogg;
- lokal tagg `inlamning` finns;
- ingen extern remote eller push har använts.
