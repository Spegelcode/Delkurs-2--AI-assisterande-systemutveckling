# Arbetspass: modernisering – separerad beräkning

## Läge

Den andra refaktoreringen av `src/legacy/price_calc.py` är genomförd.

## Ändring

Totalsumman beräknas nu i `_calculate_totals`. Funktionen bevarar exakt den
tidigare ordningen: först kapas netto till två decimaler, därefter kapas moms,
och totalen är netto plus moms.

## Bevis

- `npm run test:legacy`: `6 passed`.
- `npm run verify`: lint, format, typkontroll och `22/22` Jest-tester gröna.
- Samma karakteriseringstester skyddar även den historiska trunkeringen och
  loggradens totalbelopp.

## Återstår

- Göra databasanslutningen injicerbar.
- Skriva migreringsplanen med reversibla expand/contract-steg.
