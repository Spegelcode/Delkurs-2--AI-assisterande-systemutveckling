# Arbetspass: modernisering – databasplan

## Läge

Expand/contract-planen för den äldre prisberäkningen är dokumenterad i
`docs/legacy-migration-plan.md`.

## Beslut

- Nya tabeller och index införs först utan att gamla läsare bryts.
- Backfill sker i små batchar och kan tas bort utan att källdata ändras.
- Läsning byter först efter jämförelse mellan ny och legacy kalkyl.
- Borttagning av fallback eller gamla kolumner kräver separat ADR och backup.

## Bevis och återstår

- Planen pekar ut vilka steg som är reversibla och hur rollback görs.
- Inga ytterligare databasändringar kördes i detta pass; kursprojektet använder
  fortfarande den lokala fiktiva seeddatabasen.
- Moderniseringskravet är nu dokumenterat och demonstrerbart med codemap,
  karakteriseringstester och tre gröna refaktoriseringscommits.
