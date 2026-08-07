# Julia Stille — Mäklarplattform

En komplett arbetsyta för fastighetsmäklaren **Julia Stille**: objekt, kunder, visningar, budgivning, uppgifter, dokument, mallar, statistik och en AI-assistent som körs mot Claude.

Byggd med Next.js 14 (App Router), TypeScript, Tailwind CSS, Supabase och Anthropic Claude.

**Developed by Stilledev.**

---

## Innehåll

1. [Snabbstart](#snabbstart)
2. [Miljövariabler](#miljövariabler)
3. [Supabase — databas](#supabase--databas)
4. [Claude — AI-assistenten](#claude--ai-assistenten)
5. [Push till GitHub](#push-till-github)
6. [Deploy till Vercel](#deploy-till-vercel)
7. [Funktioner](#funktioner)
8. [Projektstruktur](#projektstruktur)
9. [Vanliga frågor](#vanliga-frågor)

---

## Snabbstart

Du behöver **Node.js 18.18 eller nyare** (rekommenderat: Node 20).

```bash
# 1. Öppna mappen i VS Code
cd julia-stille
code .

# 2. Installera paket
npm install

# 3. Skapa din miljöfil
cp .env.example .env.local

# 4. Starta
npm run dev
```

Öppna http://localhost:3000 — du möts av inloggningen.

**Lösenord: `Loppan123`**

Appen fungerar direkt utan Supabase och utan Claude-nyckel. Då körs den på inbyggd demodata så att inget kraschar. När du fyller i nycklarna växlar den automatiskt över till din riktiga databas.

### Kommandon

| Kommando            | Gör                                       |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Utvecklingsläge med hot reload            |
| `npm run build`     | Produktionsbygge                          |
| `npm run start`     | Kör produktionsbygget lokalt              |
| `npm run typecheck` | Kontrollerar TypeScript utan att bygga    |

---

## Miljövariabler

Alla ligger i `.env.local` (lokalt) och under **Settings → Environment Variables** (Vercel).

| Variabel                        | Krävs | Beskrivning                                                            |
| ------------------------------- | ----- | ---------------------------------------------------------------------- |
| `APP_PASSWORD`                  | Ja    | Lösenordet Julia loggar in med. Standard: `Loppan123`                   |
| `AUTH_SECRET`                   | Ja    | Signerar sessionskakan. Minst 32 tecken.                                |
| `NEXT_PUBLIC_APP_USER`          | Nej   | Namnet som visas i appen. Standard: `Julia Stille`                      |
| `NEXT_PUBLIC_SUPABASE_URL`      | Nej   | Din Supabase-projekt-URL                                                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Nej   | Publik anon-nyckel                                                      |
| `SUPABASE_SERVICE_ROLE_KEY`     | Nej   | service_role-nyckeln. **Endast server-side — dela aldrig publikt.**     |
| `ANTHROPIC_API_KEY`             | Nej   | Din Claude-nyckel. Utan den visar assistenten ett vänligt meddelande.   |
| `ANTHROPIC_MODEL`               | Nej   | Standard: `claude-sonnet-4-5-20250929`                                  |

Generera en säker `AUTH_SECRET`:

```bash
openssl rand -base64 48
```

> Byt lösenord genom att ändra `APP_PASSWORD` — ingen kod behöver röras.

---

## Supabase — databas

Hela databasen ligger färdigskriven i mappen `supabase/`.

### Steg för steg

1. Skapa ett projekt på [supabase.com](https://supabase.com).
2. Gå till **SQL Editor → New query**.
3. Klistra in hela innehållet i **`supabase/migration.sql`** och kör. Den skapar:
   - 11 enum-typer (objektstatus, kundtyp, budstatus, m.m.)
   - 11 tabeller med relationer och `on delete cascade`
   - 15 index för snabba sökningar
   - RLS aktiverat på samtliga tabeller
   - Storage-bucketen `media` för bilder och dokument
   - En profilrad för Julia
4. Vill du ha exempeldata: kör även **`supabase/seed.sql`** (idempotent — går att köra flera gånger).
5. Gå till **Project Settings → API** och kopiera:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`
6. Starta om dev-servern. Appen läser nu från Supabase.

### Om säkerheten

RLS är aktiverat på alla tabeller och **inga policies är påslagna som standard**. All läsning och skrivning sker server-side genom `service_role`-nyckeln, som aldrig lämnar servern. Det är det säkraste upplägget för en enanvändarapp: ingen kan nå datan direkt från webbläsaren.

Om du senare vill lägga till fler användare finns förberedda, bortkommenterade policies längst ned i `migration.sql`.

### Tabeller

`profile` · `properties` · `contacts` · `viewings` · `viewing_attendees` · `bids` · `tasks` · `documents` · `notes` · `templates` · `conversations` · `messages`

---

## Claude — AI-assistenten

Assistenten heter **Stille AI** och ligger på `/assistent`.

1. Skapa en nyckel på [console.anthropic.com](https://console.anthropic.com/settings/keys).
2. Lägg in den som `ANTHROPIC_API_KEY` i `.env.local` och i Vercel.
3. Starta om.

Assistenten har sex lägen, alla med egen systemprompt på svenska:

| Läge            | Gör                                                             |
| --------------- | --------------------------------------------------------------- |
| **Fri chatt**   | Bollplank för allt mäklarrelaterat                               |
| **Annonstext**  | Skriver säljande objektbeskrivningar                             |
| **Kundmail**    | Formulerar mail till spekulanter och säljare                     |
| **Sociala medier** | Instagram- och Facebook-inlägg                                |
| **Värdering**   | Resonerar kring prisbild och utgångspris                         |
| **Coach**       | Säljcoachning och invändningshantering                           |

**Min data**-knappen skickar med en sammanfattning av objekt, kunder, visningar och bud så att svaren blir konkreta. Svaren strömmas in i realtid och markdown renderas snyggt.

Utan nyckel kraschar ingenting — assistenten visar bara ett meddelande om att Claude inte är kopplad än.

---

## Push till GitHub

```bash
cd julia-stille
git init
git add .
git commit -m "Julia Stille — mäklarplattform"
git branch -M main
git remote add origin https://github.com/DITT-NAMN/julia-stille.git
git push -u origin main
```

`.env.local` ligger i `.gitignore` och följer aldrig med — dina nycklar är säkra.

---

## Deploy till Vercel

1. Gå till [vercel.com/new](https://vercel.com/new) och importera GitHub-repot.
2. Vercel känner igen Next.js automatiskt — rör inte build-inställningarna.
3. Öppna **Environment Variables** och lägg in minst:
   - `APP_PASSWORD` = `Loppan123`
   - `AUTH_SECRET` = din genererade sträng
   - Supabase-nycklarna (om du kopplat databasen)
   - `ANTHROPIC_API_KEY` (om du vill ha AI-assistenten)
4. Klicka **Deploy**.

Projektet innehåller redan `vercel.json` med region `arn1` (Stockholm) för snabbast svarstider i Sverige.

> Ändrar du en miljövariabel i efterhand måste du göra en **Redeploy** för att den ska slå igenom.

---

## Funktioner

### Översikt
Hälsning efter tid på dygnet, nyckeltal (aktiva objekt, sålt i år, provision, kunder), progressbar mot årsmålet, aktiva objekt, dagens och veckans visningar samt uppgifter som är försenade.

### Objekt
Kort- eller listvy, fritextsök på adress, område och rubrik, filtrering på status (kommande, till salu, budgivning, såld, tillbakadragen), sortering, och kr/m² uträknat automatiskt. Fullständigt formulär med validering för allt från utgångspris och provision till byggår, tomtarea och nyckelord.

**Detaljsidan** samlar bild, beskrivning, ekonomi, säljare, bokade visningar, kopplade uppgifter, dokument och budhistorik — plus knappar för att registrera bud och kopiera hela underlaget till urklipp.

### Kunder
Register över säljare, köpare, spekulanter och leads med status, intressegrad, budget, sökområde, kopplade objekt och anteckningar. Klickbara telefon- och mail-länkar.

### Visningar
Veckokalender och listvy. Bokade visningar med typ (öppen visning, privatvisning, digital), antal besökare, kopplat objekt och anmälda spekulanter.

### Budgivning
Bud grupperade per objekt, sorterade högst först, med budgivarens namn, belopp, villkor och tidpunkt. Acceptera eller avslå direkt i listan — högsta bud och skillnad mot utgångspris räknas ut automatiskt.

### Uppgifter
Att göra-lista med prioritet, förfallodatum, kopplat objekt och statusväxling i ett klick. Försenade uppgifter markeras tydligt.

### Dokument
Arkiv för avtal, besiktningar, planritningar, foton och ekonomi. Filtrering per typ och per objekt, filstorlekar och nedladdning.

### Mallar
Färdiga texter för annonser, mail, SMS, checklistor och sociala medier med platshållare som `{{kund}}` och `{{adress}}`. Kopiera till urklipp med ett klick.

### Statistik
Årsöversikt med sålda objekt, förmedlad volym, arvode och snittbesökare per visning. Diagram över försäljning per månad, prisnivå per område, pipeline och visningsstatistik.

### Genomgående
- Ljust och mörkt läge som minns ditt val
- Kommandopalett med ⌘K / Ctrl+K — sök objekt, kunder och sidor, navigera med piltangenter
- Responsiv från 375 px till stor skärm
- Toasts, laddningslägen, tomma lägen och bekräftelsedialoger överallt
- All text på svenska, alla belopp i svenskt format

---

## Projektstruktur

```
julia-stille/
├── src/
│   ├── app/
│   │   ├── (app)/              # Skyddade sidor
│   │   │   ├── page.tsx        # Översikt
│   │   │   ├── objekt/
│   │   │   ├── kunder/
│   │   │   ├── visningar/
│   │   │   ├── budgivning/
│   │   │   ├── uppgifter/
│   │   │   ├── dokument/
│   │   │   ├── mallar/
│   │   │   ├── statistik/
│   │   │   ├── installningar/
│   │   │   └── assistent/
│   │   ├── api/
│   │   │   ├── auth/           # Login / logout
│   │   │   ├── data/[table]/   # CRUD
│   │   │   ├── ai/chat/        # Claude, streamande
│   │   │   ├── profile/
│   │   │   ├── upload/
│   │   │   └── status/
│   │   ├── logga-in/
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/             # Shell, kort, formulär, UI
│   ├── lib/                    # db, auth, ai, types, utils, seed
│   └── middleware.ts           # Skyddar alla rutter
├── supabase/
│   ├── migration.sql           # Schema, index, RLS, storage
│   └── seed.sql                # Exempeldata
├── public/                     # Bilder och ikoner
├── .env.example
└── vercel.json
```

---

## Vanliga frågor

**Hur byter Julia lösenord?**
Ändra `APP_PASSWORD` i `.env.local` (och i Vercel) och gör en redeploy.

**Hur länge gäller inloggningen?**
30 dagar, i en signerad HttpOnly-kaka. Sedan får hon logga in igen.

**Vad händer om jag hoppar över Supabase?**
Allt fungerar, men på demodata i serverminnet. Ändringar försvinner när servern startas om. Fyll i nycklarna när du är redo.

**Kan jag lägga till fler användare?**
Ja. Byt ut lösenordsinloggningen mot Supabase Auth och slå på de förberedda RLS-policyerna i `migration.sql`.

**Kan jag byta Claude-modell?**
Sätt `ANTHROPIC_MODEL` till valfri modell från Anthropic.

---

Developed by **Stilledev** — med kärlek, för Julia.
