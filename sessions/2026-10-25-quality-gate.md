# Kvalitetsgrind och pre-commit-hook – 2026-10-25

## Mål

Göra kodstandardens grundkontroller körbara med ett kommando och stoppa en
commit när koden inte uppfyller kontrollerna.

## Ändringar

1. Befintliga TypeScript- och testfiler formaterades med Prettier.
2. `package.json` fick kommandona:
   - `npm run verify` för lint, format-check, typecheck och Jest.
   - `npm run verify:legacy` för Python-testerna separat tills legacy-delen har
     karakteriseringstester.
3. `.githooks/pre-commit` skapades.
4. Repoets lokala `core.hooksPath` sattes till `.githooks`.

## Verifiering

`npm run verify` avslutades med exitkod 0:

- ESLint: godkänd.
- Prettier: alla TypeScript- och testfiler följer formatet.
- TypeScript: godkänd.
- Jest: 16 av 16 tester passerade.

## Negativt test av hooken

Ett avsiktligt syntaxfel lades till i `src/result.ts` och stageades. En testcommit
kördes lokalt. Hooken stoppade committen med exitkod 1 på ESLint-felet:

`Parsing error: Expression expected`

Ingen commit skapades. Syntaxfelet togs bort och filen avstageades därefter.

## Begränsningar

- Hooken är kopplad lokalt med Git-konfiguration och behöver beskrivas i
  projektets setup för andra utvecklare.
- `npm run verify` kör ännu inte `npm run test:legacy`, eftersom legacy-delen
  inte har några Python-tester och pytest annars avslutar med exitkod 5.
- Testskydd, hemlighetskontroll och sessions-hookar återstår.

## Nästa steg

1. Lägga till testskydd som stoppar borttagning eller skip av tester.
2. Skapa `/tdd`-skillen.
3. Skapa subagenterna och projektets agentinställningar.
4. Fortsätta med researchfasen för idempotenta beställningar.

