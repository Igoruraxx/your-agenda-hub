

# Plan: Ocean Breeze Theme + Admin Panel Fixes

## 1. Apply Ocean Breeze Theme

Update `src/index.css` CSS variables to match the Ocean Breeze color palette from 21st.dev:

| Variable | Current | New (Ocean Breeze) |
|----------|---------|-------------------|
| --accent | #2563eb (blue) | #22c55e (green) |
| --accent-light | #eff6ff | #d1fae5 |
| --accent-dark | #1d4ed8 | #16a34a |
| --n-0 (white) | #ffffff | #ffffff |
| --n-50 | #f8fafc | #f0f8ff |
| --n-100 (bg) | #f1f5f9 | #f0f8ff |
| --n-200 (border) | #e2e8f0 | #e5e7eb |
| --n-300 | #cbd5e1 | #d1d5db |
| --n-400 | #94a3b8 | #9ca3af |
| --n-500 | #64748b | #6b7280 |
| --n-600 | #475569 | #4b5563 |
| --n-700 | #334155 | #374151 |
| --n-800 | #1e293b | #1f2937 |
| --n-900 | #0f172a | #374151 |
| Font | Inter | DM Sans |

Also update the focus box-shadow color from blue to green (#22c55e).

## 2. Fix AdminPanel Supabase Persistence Bugs

Two functions in `src/pages/AdminPanel.tsx` only update local state but do NOT persist to Supabase:

- **handleUpgradeToPremium** (line 304): Updates `setUsers` locally but never calls `supabase.from('profiles').update(...)`. Will add Supabase persistence.
- **handleDowngradeToFree** (line 340): Same issue -- only local state update. Will add Supabase persistence.

## 3. Update Gradient Accents

The header logo and splash screen use hardcoded `#6366f1` (indigo) gradients. These will be updated to use the Ocean Breeze green palette (`#22c55e` to `#16a34a`).

Files affected: `src/App.tsx` (header and splash screen gradients).

## 4. Admin Tab Visibility

The admin tab is already correctly gated -- it only appears in BottomNavigation when `isAdmin === true`, and `App.tsx` renders `<AdminPanel />` only for admins. No changes needed here.

## Summary of File Changes

| File | Changes |
|------|---------|
| `src/index.css` | Update CSS variables to Ocean Breeze palette + DM Sans font |
| `src/pages/AdminPanel.tsx` | Fix handleUpgradeToPremium and handleDowngradeToFree to persist to Supabase |
| `src/App.tsx` | Update gradient colors from indigo to green |

