# Arbetspass: lokal migrations- och rollbackkontroll

## Läge

Idempotensmigrationens expand- och down-script kördes i den lokala
`butik_test`-databasen.

## Bevis

- Expand-scriptet avslutade med `COMMIT` och tabellen kunde hittas som
  `order_idempotency`.
- Down-scriptet avslutade med `COMMIT` och kontrollen svarade `absent`.
- `npm run db:reset` återställde därefter både `butik` och `butik_test`.
- Inga externa databaser eller produktionsdata användes.

## Beslut

Rollback ska provas i testdatabasen innan en migration anses demonstrerad.
Denna kontroll gäller idempotensmigrationen; legacy-moderniseringens
expand/contract-plan är dokumenterad separat i `docs/legacy-migration-plan.md`
och har ännu inte körts som produktionsmigration.
