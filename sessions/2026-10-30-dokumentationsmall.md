# Arbetspass: dokumentationsmall och mätningar

## Läge

Mätunderlag och en ifylld Markdown-version av kursmallen är skapade:

- `docs/matningar.md`
- `docs/kursdokumentation.md`

## Bevis

Dokumentationen hänvisar till research, plan, ADR, implementation, tester,
hooks, subagenter, sessionsloggar och moderniseringscommits. Den redovisar
22/22 Jest-tester, 6/6 Python-tester och kontrollfynd från baslinjen.

## Begränsningar

- Namn måste fyllas i före PDF-export.
- Tokens och kronor är inte exponerade i verktygsmiljön och är därför inte
  påhittade.
- Den separata pull requesten från kursledaren saknas fortfarande och kan inte
  granskas utan dess innehåll.

## Nästa steg

1. Exportera dokumentationen till PDF och kontrollera layouten.
2. Ta emot kursledarens PR och fyll tre reviewfynd med radnummer.
3. Kör slutlig verifiering, skapa lokal tagg `inlamning` och förbered demo.
