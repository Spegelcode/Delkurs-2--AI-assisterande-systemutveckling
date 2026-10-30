# Migreringsplan för äldre prisberäkning

Planen gäller den äldre datamodellen som används av
`src/legacy/price_calc.py`. Den är skriven som en expand/contract-plan så att
prisberäkningen kan moderniseras utan att den befintliga läsningen bryts i ett
enda steg.

## Förutsättningar

- Arbetet sker mot lokal, fiktiv seeddata i Docker.
- `orders`, `order_lines` och `discounts` är befintliga tabeller.
- Den äldre modulen fortsätter vara fallback tills den nya vägen är verifierad.
- Varje steg kör `npm run verify` och `npm run test:legacy`.
- Databasändringar körs som separata upp- och nedmigrationer där det är
  möjligt.

## Expand

| Steg | Ändring | Kontroll | Kan backas? |
|---|---|---|---|
| E0 | Ta en lokal databasdump och spara schema-/seedversionen som byggartefakt. | Radantal, order-id och totalsummor från karakteriseringstesterna jämförs. | Ja, genom att återställa dumpen. |
| E1 | Lägg till index på `order_lines(order_id)` och en `NOT VALID`-foreign key från `order_lines.order_id` till `orders.id`. | Kontrollera orphan-rader innan constrainten valideras. | Ja, ta bort index och constraint. |
| E2 | Skapa tabellen `order_totals(order_id, net, vat, total, calculator_version, calculated_at)` utan att ändra gamla tabeller. | Unikhet på `order_id`, decimalprecision och skriv-/läsbehörighet testas. | Ja, tabellen kan tas bort innan den används. |
| E3 | Lägg till en adapter med explicit anslutning och skriv en ny kalkyleringsversion som kan köras parallellt med legacy. | Kör båda kalkylerna på samma order och jämför `net`, `vat` och `total`. Avvikelse stoppar utrullningen. | Ja, fortsätt använda legacy-adaptern. |
| E4 | Backfilla `order_totals` i små batchar från befintliga order. | Varje batch loggar antal, fel och avvikelser. | Ja, radera bara de nya backfill-raderna och kör om. |
| E5 | Validera foreign key och aktivera skrivning av nya totalsummor för nya/ändrade order. | Testa nya order, omkörning och rollback på en lokal kopia. | Ja, stäng av dual-write och radera nya totalsummor. |

## Contract

1. Läsare byter först till `order_totals` via adaptern. Om en rad saknas eller
   versionskontrollen fallerar används legacy som fallback och händelsen
   loggas.
2. Efter en övervakningsperiod utan avvikelser tas fallback bort från läsflödet.
   Detta är ett medvetet driftbeslut och kräver en ny ADR.
3. `price_calc.py` och den gamla globala anslutningen flyttas till ett arkiv-
   eller kompatibilitetspaket, men tas inte bort förrän rollback-fönstret har
   passerat.
4. Först därefter kan gamla kolumner eller tabeller tas bort. Varje borttagning
   kräver en separat backup och återställningsinstruktion.

## Rollback

Rollback före contract sker genom att stänga av den nya adaptern, stoppa
dual-write och läsa från legacy. Nya `order_totals`-rader påverkar inte gamla
order eller orderrader och kan därför tas bort utan att återställa källdata.

Efter contract är rollback en separat migrering: återaktivera adapterns legacy-
fallback, återställ kompatibilitetskod och använd dumpen från E0 om en schema-
ändring redan har kontrakterats. Databorttagning ska aldrig kombineras med
första utrullningen.

## Ändringar som inte ingår ännu

- Rabattens `valid_from`/`valid_to` ska börja påverka priset först efter ett
  uttryckligt beslut, eftersom karakteriseringstestet dokumenterar att legacy
  i dag tillämpar även utgångna rabatter.
- Tabellerna får inte rensas eller ändras på produktionsdata inom kursprojektet.
