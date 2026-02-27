

# Fix: Build & Runtime Errors

## Issues Found

### 1. Build Error: `src/reportWebVitals.ts`
- Imports `web-vitals` which is not installed
- This file is a Create React App leftover and is NOT imported anywhere in the project
- **Fix:** Delete the file

### 2. Runtime Error: `src/lib/supabase.ts` uses `process.env`
- Vite does not define `process.env` — it uses `import.meta.env`
- This causes "process is not defined" crash, breaking the entire app
- The Supabase credentials were provided by the user (project ID: `irergynffqnkertdagbs`)
- **Fix:** Replace `process.env.REACT_APP_*` with hardcoded Supabase URL and anon key (the anon key is safe to embed client-side)

### 3. Dead Code: `src/serviceWorkerRegistration.ts`
- Also uses `process.env.PUBLIC_URL` (CRA pattern)
- Not imported anywhere in the project
- **Fix:** Delete the file to prevent future confusion

## Changes

| File | Action |
|------|--------|
| `src/reportWebVitals.ts` | Delete |
| `src/serviceWorkerRegistration.ts` | Delete |
| `src/lib/supabase.ts` | Replace `process.env` with hardcoded Supabase URL and anon key |

## Result
- Build error resolved (no more `web-vitals` import)
- Runtime error resolved (no more `process is not defined`)
- App will load and connect to Supabase correctly

