---
description: Avsluta ett arbetspass med spårbar sessionslogg.
---

# /session-close

Skapa en fil i `sessions/` med:

- datum och arbetspassets mål;
- aktuellt läge;
- körda kommandon och exitkoder;
- vad som fungerade med bevis;
- vad som misslyckades och varför;
- beslut och bortval;
- mätningar: tid, tokens, modell och kostnad om de visas;
- återstående arbete;
- nästa konkreta steg.

Skriv aldrig kunddata, produktionsdata, tokens eller hemligheter i klartext om
verktyget inte uttryckligen visar dem som säkra mätvärden.
