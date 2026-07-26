# Supabase Setup Inštrukcie pre Atlas

## 1. Vytvorenie Supabase projektu

1. Choď na https://supabase.com
2. Prihlás sa alebo si vytvor účet
3. Klikni "New Project"
4. Vyplň:
   - **Name**: atlas-social-network
   - **Database Password**: (zapíš si ho, budeš ho potrebovať)
   - **Region**: vyber najbližšiu (napr. EU West)
5. Počkaj kým sa projekt vytvorí (2-3 minúty)

## 2. Získanie API kľúčov

1. V Supabase dashboard choď do **Settings > API**
2. Skopíruj:
   - **Project URL** (niečo ako `https://xyz.supabase.co`)
   - **anon / public** API key

## 3. Nastavenie .env súboru

Vytvor/edituj súbor `project/.env`:

```env
VITE_SUPABASE_URL=https://tvoj-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=tvoj-anon-key
```

**Dôležité**: .env súbor musí byť v koreňovom adresári projektu (vedľa package.json)

## 4. Aplikovanie migrácií

### Metóda A: cez Supabase Dashboard (odporúčané)

1. Choď do **SQL Editor** v Supabase dashboard
2. Vytvor nový query
3. Skopíruj obsah `supabase/migrations/20260726212906_atlas_core_schema.sql`
4. Klikni "Run" (alebo stlač Ctrl+Enter)
5. Vytvor nový query
6. Skopíruj obsah `supabase/migrations/20260726213042_atlas_social_messaging.sql`
7. Klikni "Run"

### Metóda B: cez Supabase CLI (pre pokročilých)

```bash
npx supabase login
npx supabase link --project-ref tvoj-project-ref
npx supabase db push
```

## 5. Nastavenie Email Provider (voliteľné)

Pre produkčné použitie:

1. Choď do **Authentication > Providers**
2. Nastav Email provider
3. Pre testovanie môžeš použiť "Disable email confirmations" v **Authentication > Settings**

## 6. Overenie

1. Reštartuj development server:
   ```bash
   npm run dev
   ```

2. Otvor http://localhost:5173
3. Skúš zaregistrovať nového používateľa
4. Over v Supabase dashboard > Authentication > Users či sa používateľ vytvoril
5. Over v Supabase dashboard > Table Editor > profiles či sa profil vytvoril

## 7. RLS Policies

Migrácie už obsahujú Row Level Security policies. Nie je potrebné nič extra nastavovať.

## Troubleshooting

**Chyba: "Invalid API key"**
- Skontroluj či máš správne VITE_SUPABASE_URL a VITE_SUPABASE_ANON_KEY v .env
- Reštartuj development server po zmene .env

**Chyba: "Profile not found"**
- Skontroluj či sa aplikovala migrácia s triggerom `handle_new_user()`
- Skontroluj SQL tabuľku `profiles` či existuje

**Chyba: "Relation does not exist"**
- Aplikuj obe migrácie v správnom poradí (core najprv, potom social)
