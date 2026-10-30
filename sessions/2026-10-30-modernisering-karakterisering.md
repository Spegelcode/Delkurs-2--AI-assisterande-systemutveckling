# Arbetspass: modernisering – codemap och karakteriseringstester

## Läge

Moderniseringen av `src/legacy/price_calc.py` är påbörjad. Codemapen beskriver
moduler, dataflöde, beroenden och risker före refaktorering.

## Fungerade, med bevis

- `npm run test:legacy` körde `python -m pytest -q`.
- Resultat: `6 passed in 0.18s`.
- Karakteriseringstesterna täcker order utan rabatt, rabatt med historisk
  kapning, utgången rabatt, tom order, saknad order och loggskrivning.
- `git diff --check` rapporterade inga whitespacefel.

## Beslut

- Testerna använder projektets fiktiva lokala seeddata och skriver logg till
  pytests temporära katalog. Ingen kund- eller produktionsdata används.
- Den nuvarande trunkeringen och att även utgångna rabattkoder tillämpas är
  dokumenterade som observerat legacy-beteende. De ändras inte i första steget.
- `test:legacy` använder modulstart via Python för att vara körbar i denna
  Windowsmiljö.

## Misslyckades eller återstår

- Den tidigare direkta `pytest -q`-starten kunde blockeras av Device Guard;
  modulstarten löser det i den här miljön.
- SQL-frågorna är fortfarande interpolerade och ska parameteriseras i nästa
  arbetspass.
- Därefter återstår två ytterligare små refaktoreringar och en reversibel
  expand/contract-plan för databasen.
