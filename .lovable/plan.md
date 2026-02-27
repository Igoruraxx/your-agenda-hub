

# Correcao: Login com perfil em branco e Google Auth

## Problemas Identificados

### 1. Erro "Lock broken by another request with the 'steal' option"
O Supabase Auth usa Web Locks API para gerenciar sessoes. No ambiente de preview (iframe), isso causa conflitos. A solucao e desabilitar o lock na configuracao do cliente Supabase.

### 2. Perfil em branco apos login
Quando o usuario ja existia antes da reconstrucao do banco (SQL rebuild), a tabela `profiles` foi recriada vazia. O trigger `handle_new_user` so cria perfil para **novos** signups. Usuarios existentes no `auth.users` ficam sem linha em `profiles`, causando o erro no `fetchUserData` e deixando `currentUser` como `EMPTY_USER`.

A correcao e fazer o `AuthContext` criar o perfil automaticamente (upsert) caso ele nao exista quando o usuario faz login.

### 3. Google Auth nao funciona
O Google OAuth precisa de configuracao no **Supabase Dashboard** (Authentication > Providers > Google) com Client ID e Secret do Google Cloud Console. Alem disso, a URL de redirect do preview precisa estar nas URLs autorizadas. Isso NAO e um problema de codigo — e configuracao externa.

---

## Mudancas no Codigo

### Arquivo 1: `src/lib/supabase.ts`
- Adicionar `lock: false` na configuracao de auth para evitar o erro de Web Locks no iframe

### Arquivo 2: `src/contexts/AuthContext.tsx`
- No `fetchUserData`: se o perfil nao existir (erro 406/PGRST116), fazer **upsert** automatico usando dados do `auth.users` (session user metadata)
- Adicionar o `session` como parametro para poder acessar `user.user_metadata` (name, email)
- Isso garante que usuarios existentes que fizeram login apos o rebuild do banco tenham seu perfil criado automaticamente

---

## Configuracao Manual (Google Auth)

Para o Google funcionar, voce precisa:
1. No **Google Cloud Console**: criar credenciais OAuth 2.0 (Web application)
2. Adicionar a URL de callback do Supabase: `https://irergynffqnkertdagbs.supabase.co/auth/v1/callback`
3. No **Supabase Dashboard** > Authentication > Providers > Google: colar o Client ID e Client Secret
4. Em Authentication > URL Configuration: adicionar a URL do seu app nas Redirect URLs

---

## Secao Tecnica

### supabase.ts - mudanca:
```typescript
auth: {
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: true,
  storageKey: 'fitpro-auth-token',
  storage: window.localStorage,
  lock: false,  // evita erro de Web Locks no iframe
}
```

### AuthContext.tsx - fetchUserData com auto-criacao de perfil:
```typescript
const fetchUserData = useCallback(async (userId: string, userMeta?: { name?: string; email?: string }): Promise<User | null> => {
  try {
    const [profileRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('user_roles').select('role').eq('user_id', userId),
    ]);

    let profile = profileRes.data as Profile | null;

    // Se perfil nao existe, criar automaticamente
    if (profileRes.error && profileRes.error.code === 'PGRST116') {
      const newProfile = {
        id: userId,
        name: userMeta?.name || userMeta?.email?.split('@')[0] || '',
        email: userMeta?.email || '',
      };
      const { data, error } = await supabase.from('profiles').upsert(newProfile).select().single();
      if (error) { console.error('[Auth] Auto-create profile error:', error.message); return null; }
      profile = data as Profile;
      // Tambem criar role padrao
      await supabase.from('user_roles').upsert({ user_id: userId, role: 'user' });
    } else if (profileRes.error) {
      console.error('[Auth] fetchProfile error:', profileRes.error.message);
      return null;
    }

    if (!profile) return null;
    const roles = (rolesRes.data || []) as UserRole[];
    const hasAdmin = roles.some(r => r.role === 'admin');
    return profileToUser(profile, hasAdmin);
  } catch (e) {
    console.error('[Auth] Error fetching user data:', e);
    return null;
  }
}, []);
```

As chamadas a `fetchUserData` serao atualizadas para passar os metadados do usuario:
- `fetchUserData(s.user.id, { name: s.user.user_metadata?.name || s.user.user_metadata?.full_name, email: s.user.email })`

## Resultado Esperado

- Login por email funciona e carrega o perfil corretamente (criando-o se necessario)
- Erro de "Lock broken" desaparece
- Google Auth: o codigo esta pronto, mas precisa da configuracao manual no Supabase Dashboard e Google Cloud Console

