# Åtgärd – plattformsberoende Python-kommando

## Läget före ändringen

Baslinjen hade ett fel i `GET /orders/1042/price` på Windows:

- 15 av 16 Jest-tester passerade.
- Pris-testet fick HTTP `404` i stället för `200`.
- `src/pricing/legacyPrice.ts` startade alltid `python3`.
- På denna Windows-miljö var `python3` ett Microsoft Store-alias och Python
  startade inte från Node-processen.

## Ändring

I `src/pricing/legacyPrice.ts` används nu:

- `python` på Windows (`process.platform === "win32"`);
- `python3` på övriga plattformar.

Ingen affärslogik eller test togs bort eller stängdes av.

## Bevis efter ändringen

| Kontroll | Resultat |
|---|---|
| Ordertester | 9 av 9 passerade |
| Jest totalt | 16 av 16 passerade |
| ESLint | Godkänd |
| TypeScript typecheck | Godkänd |
| Prettier för ändrad fil | Godkänd |
| Legacy-tester | Exitkod 5 eftersom inga Python-tester finns |

## Kvarstående problem

- `npm run format:check` är fortfarande inte grönt för hela projektet eftersom
  15 befintliga filer behöver formateras.
- `npm run test:legacy` hittar inga tester.
- Docker måste vara igång för databasbaserade tester.

## Beslut och nästa steg

Ändringen är tillräckligt liten för att kunna vara en separat commit:

`fix: use platform Python command for legacy pricing`

Nästa steg är att bygga den första kvalitetssamlingen och riggens hooks. Den
fullständiga Prettier-avvikelsen ska hanteras som ett separat beslut, inte
blandas ihop med denna plattformsfix.

