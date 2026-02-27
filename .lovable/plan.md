
# Fix: Login nao carrega perfil (Race Condition no React StrictMode)

## Causa Raiz

O bug esta no `mountedRef` dentro do `AuthContext.tsx`. Em React 18 StrictMode, o `useEffect` executa assim:

1. Monta -> efeito roda (`mountedRef.current = true`)
2. Desmonta (cleanup) -> `mountedRef.current = false`
3. Remonta -> efeito roda novamente, MAS `mountedRef.current` continua `false` porque nunca e resetado

Resultado: quando o `onAuthStateChange` dispara o evento `SIGNED_IN` apos o login, a condicao `if (mountedRef.current && profile)` na linha 127/151 e **sempre falsa**. O perfil e buscado com sucesso do Supabase, mas **nunca e setado no state** (`setCurrentUser` nunca e chamado).

Isso explica por que:
- O login funciona (sessao OK, `isAuthenticated = true`)
- Mas `currentUser` permanece como `EMPTY_USER` (id vazio, name vazio, plan "free")
- Hooks como `useStudents` e `useAppointments` verificam `currentUser.id` e nao carregam dados

## Correcao

### Arquivo: `src/contexts/AuthContext.tsx`

**Mudanca 1** - Resetar `mountedRef` no inicio do efeito (linha 107):

```typescript
useEffect(() => {
  mountedRef.current = true; // <-- ADICIONAR: reset no re-mount do StrictMode
  let resolved = false;
  // ... resto do efeito
```

**Mudanca 2** - Adicionar logs de debug no `fetchProfile` para diagnosticar falhas silenciosas de RLS (temporario, pode ser removido depois):

```typescript
const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error("[Auth] fetchProfile error:", error.message, error.code);
      return null;
    }
    if (data) {
      console.log("[Auth] Profile loaded:", data.id, data.name);
      return data as Profile;
    }
  } catch (e) {
    console.error("Error fetching profile:", e);
  }
  return null;
}, []);
```

**Mudanca 3** - Garantir que o `initSession` tambem respeita o novo reset:

Sem mudanca adicional necessaria - o reset do `mountedRef.current = true` no inicio do efeito ja resolve.

## Resumo de Mudancas

| Arquivo | Mudanca |
|---------|---------|
| `src/contexts/AuthContext.tsx` | Adicionar `mountedRef.current = true` no inicio do useEffect + melhorar logs do fetchProfile |

## Resultado Esperado

- Login carrega o perfil corretamente do Supabase
- `currentUser` e populado com nome, plano, isAdmin, etc.
- Hooks dependentes (`useStudents`, `useAppointments`) recebem `currentUser.id` valido e carregam dados
- Funciona tanto em StrictMode (dev) quanto em producao
