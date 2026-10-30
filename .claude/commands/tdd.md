---
description: Arbeta testdrivet från krav till verifierad kod.
---

# /tdd

Följ alltid denna ordning:

1. Läs relevant krav, plan och befintlig kod.
2. Skriv eller uppdatera ett test för ett enda beteende.
3. Kör testet och visa det röda resultatet.
4. Implementera minsta ändring som gör testet grönt.
5. Kör relevanta tester.
6. Kör `npm run verify`.
7. Granska diffen manuellt.
8. Skriv en sessionslogg med bevis, beslut och nästa steg.

Regler:

- Ta aldrig bort eller hoppa över ett test för att få grönt resultat.
- Ändra inte flera lager samtidigt utan att först beskriva varför.
- Stanna efter två misslyckade försök utan ny information och gå tillbaka till research.
- Lägg inga hemligheter, kunddata eller produktionsdata i filer eller loggar.
