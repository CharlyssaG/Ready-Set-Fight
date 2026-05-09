# The House Fight Game v3

No Next.js. No framework. Just serverless functions + static HTML.

## Deploy to Vercel

### 1. Push to GitHub (fresh repo)
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/house-fight-game.git
git push -u origin main
```

### 2. Add environment variables in Vercel
Before deploying, add these in your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SITE_URL` (your Vercel URL)

### 3. IMPORTANT — Edit index.html before deploying
Replace these two placeholder values with your actual Supabase credentials:
- `REPLACE_SUPABASE_URL` → your Supabase project URL
- `REPLACE_SUPABASE_ANON_KEY` → your Supabase anon key

### 4. Supabase setup
- Run supabase/schema.sql in Supabase SQL editor
- Enable Google OAuth in Authentication → Providers
- Set Site URL and redirect URL to your Vercel domain

## Why no Next.js?
Vercel keeps blocking builds due to Next.js CVE policies. This version uses
plain Vercel serverless functions (Node.js) + a static HTML file. Zero
framework dependencies = zero CVE blockers = it just works.
