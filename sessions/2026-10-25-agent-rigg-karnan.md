# Agentriggens kärna – 2026-10-25

## Mål

Implementera grunddelarna som saknades enligt kurskraven: slash-kommandon,
subagenter, behörigheter, testskydd, path-guard och sessionsminne.

## Skapade delar

### Kommandon

- `.claude/commands/tdd.md`
- `.claude/commands/review.md`
- `.claude/commands/modernize.md`
- `.claude/commands/session-close.md`

### Subagenter

- `researcher` – research och kodkarta, modell `haiku`.
- `tester` – TDD och negativa tester, modell `sonnet`.
- `security-reviewer` – säkerhet och dataflöden, modell `sonnet`.
- `modernization-reviewer` – legacy och refaktorering, modell `haiku`.

### Behörigheter och agenthooks

`.claude/settings.json` innehåller allow, ask och deny samt hooks för:

- SessionStart: ladda senaste sessionsläge.
- PreToolUse på Write/Edit: path-guard.
- Stop: spara sessionsläge.

### Git- och kvalitetshooks

`.githooks/pre-commit` kör:

1. `scripts/hooks/check-test-integrity.js`;
2. `npm run verify`.

`npm run verify` kör lint, Prettier-check, typecheck och Jest.

## Verifiering

- `npm run verify`: exitkod 0.
- Jest: 16 av 16 tester passerade.
- ESLint: godkänd.
- Prettier: godkänd.
- TypeScript: godkänd.
- `check-test-integrity.js`: godkänd med normala tester.
- `check-sensitive-path.js`: godkände `src/app.ts` och stoppade `.env` med exitkod 2.
- `session-state.js --load`: läste senaste sessionsloggen.
- `session-state.js --save`: sparade `sessions/session-state.jsonl`.

## Negativt test av testskyddet

`describe.skip` lades till tillfälligt i `tests/orders.test.ts` och stageades.
En testcommit stoppades av pre-commit-hooken med exitkod 1 innan verifieringen
körde. Ändringen togs sedan bort och filen avstageades.

## Begränsningar

- Kommandona och konfigurationen är skapade men ska senare demonstreras i
  agentens faktiska session.
- Sessionsloggarnas automatiska innehåll är begränsat till status, tid och
  senaste logg; mänsklig sammanfattning behövs fortfarande.
- Den fullständiga kursdokumentationen saknas.
- User storyn, PR-granskningen och legacy-moderniseringen återstår.

## Nästa steg

1. Kontrollera agentkonfigurationen i praktisk användning.
2. Skriv researchfil och ADR för idempotenta beställningar.
3. Använd `/tdd` på user storyn.
4. Lägg till testskydd och verifiering för migrationer och hemligheter där det behövs.

