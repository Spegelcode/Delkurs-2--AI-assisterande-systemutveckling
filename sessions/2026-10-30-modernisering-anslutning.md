# Arbetspass: modernisering – injicerbar anslutning

## Läge

Den tredje refaktoreringen av `src/legacy/price_calc.py` är genomförd.

## Ändring

`calc_price` accepterar nu en valfri `connection`. Utan argument används den
gamla globala anslutningen, vilket bevarar befintliga anrop från CLI,
TypeScript-bryggan och nattjobbet. Testkod eller framtida anrop kan skicka en
egen anslutning.

## Bevis

- `npm run test:legacy`: `6 passed`.
- `npm run verify`: lint, format, typkontroll och `22/22` Jest-tester gröna.
- Ett karakteriseringstest använder den explicita anslutningen och övriga test
  visar att standardvägen fortfarande fungerar.

## Moderniseringsresultat

Tre små refaktoreringar är nu gjorda i separata commits, med gröna tester efter
varje steg: parameteriserad SQL, separerad totalsumma och injicerbar
anslutning.
