# Deployment Inštrukcie - Atlas Online

## Odporúčaná metóda: Vercel (najjednoduchšie, zdarma)

### 1. Príprava projektu

Uisti sa, že:
- `.env` súbor obsahuje správne Supabase kľúče
- Supabase migrácie sú aplikované
- Projekt lokálne funguje (`npm run dev`)

### 2. Vytvorenie GitHub repozitára

1. Choď na https://github.com a prihlás sa
2. Klikni "New repository"
3. Pomenuj ho napr. `atlas-social-network`
4. Nastav na Public (alebo Private, ak chceš)
5. Nechaj "Initialize this repository with a README" odškrtnuté
6. Klikni "Create repository"

### 3. Nahratie kódu na GitHub

V termináli v adresári projektu:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TVOJ-MENO/atlas-social-network.git
git push -u origin main
```

### 4. Deploy na Vercel

1. Choď na https://vercel.com
2. Prihlás sa s GitHub účtom
3. Klikni "Add New Project"
4. Vyber svoj GitHub repozitár `atlas-social-network`
5. V nastaveniach:
   - **Framework Preset**: Vite
   - **Root Directory**: `./project` (ak je projekt v podadresári)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Klikni "Deploy"

### 5. Nastavenie Environment Variables na Vercel

1. Po deploy choď do **Settings > Environment Variables**
2. Pridaj:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: tvoj Supabase URL (z .env)
   - **Environment**: All (Production, Preview, Development)
3. Pridaj:
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: tvoj Supabase anon key (z .env)
   - **Environment**: All
4. Klikni "Save"
5. Redeploy projekt (Settings > General > Redeploy)

### 6. Hotovo!

Tvoja aplikácia bude dostupná na:
- `https://atlas-social-network.vercel.app` (alebo podobnej URL)

---

## Alternatívna metóda: Netlify

### 1. Build projektu lokálne

```bash
npm run build
```

### 2. Deploy na Netlify

1. Choď na https://netlify.com
2. Prihlás sa
3. Drag & drop `project/dist` adresár na Netlify dashboard
4. Site bude okamžite online

### 3. Nastavenie environment variables

1. V Netlify dashboard choď do **Site settings > Environment variables**
2. Pridaj `VITE_SUPABASE_URL` a `VITE_SUPABASE_ANON_KEY`
3. Redeploy

---

## Alternatívna metóda: GitHub Pages

### 1. Nastavenie Vite konfigurácie

Uprav `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/atlas-social-network/', // názov tvojho repozitára
});
```

### 2. Build a deploy

```bash
npm run build
# nahranie dist obsahu do gh-pages vetvy
```

---

## Dôležité bezpečnostné poznámky

### Pre produkčné použitie:

1. **RLS Policies** - Uisti sa, že Row Level Security policies sú správne nastavené v Supabase
2. **Anon Key** - Anon key je verejný, to je OK - RLS ho obmedzuje
3. **Service Role Key** - NIKDY nepoužívaj service role key v frontend kóde
4. **Email Confirmation** - Pre produkciu zapni email confirmation v Supabase
5. **Rate Limiting** - Zvaž rate limiting pre API volania

### Monitoring:

- Vercel poskytuje Analytics zdarma
- Supabase má built-in monitoring v dashboard
- Zvaž pridať error tracking (napr. Sentry)

---

## Aktualizácie po zmene kódu

### Vercel:
- Automaticky sa redeployuje po každom push na GitHub

### Manuálne:
```bash
git add .
git commit -m "Update description"
git push
```

---

## Custom doména (voliteľné)

### Vercel:
1. Settings > Domains
2. Pridaj svoju doménu
3. Aktualizuj DNS records podľa inštrukcií

### Netlify:
1. Domain settings > Add custom domain
2. Aktualizuj DNS records

---

## Troubleshooting

**Aplikácia nefunguje po deploy:**
- Skontroluj či sú environment variables nastavené
- Skontroluj build logy na Vercel/Netlify
- Skontroluj či Supabase URL je accessible

**CORS chyby:**
- V Supabase dashboard > Settings > API pridaj tvoj doménu do "Additional Redirect URLs"

**Build zlyhá:**
- Skontroluj či `npm run build` funguje lokálne
- Skontroluj TypeScript errors (`npm run typecheck`)
