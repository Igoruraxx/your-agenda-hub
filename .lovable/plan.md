
# Plano de Melhorias - Agenda, Financeiro, Admin e Trial

## 1. Agenda - Grid com horarios 05h-22h

**Problema atual:** TIME_SLOTS gera apenas 06h-20h (15 slots). Views semanal e diaria nao mostram grid visual com todos os horarios.

**Solucao:**
- Expandir TIME_SLOTS para 05:00 ate 22:00 (18 slots)
- Na view diaria, mostrar grid vertical com cada horario como linha, appointments encaixados no slot correto, slots vazios clicaveis para criar agendamento rapido
- Na view semanal, mesma logica com grid 7 colunas x 18 linhas
- Ao selecionar frequencia do aluno no cadastro (Students.tsx), apos salvar, abrir modal perguntando se deseja criar agendamentos automaticos para as proximas 4 semanas baseado nos dias/horarios selecionados. Se sim, chamar addAppointment em batch para cada ocorrencia

## 2. Painel Financeiro - Refatoracao completa

**Problema atual:** Finance.tsx usa appointments simulados (buildMonthAppointments) e nao tem sistema de pagamentos real. Nao da para dar baixa, nao marca atraso, nao tem cobranca integrada.

**Solucao - Usar tabela `payments` ja existente no schema:**

### 2.1 Hook usePayments
- Criar `src/hooks/usePayments.ts` que faz CRUD na tabela `payments`
- Funcoes: fetchPayments, createPayment, markAsPaid, markAsOverdue
- Ao abrir Finance, gerar automaticamente payments pendentes do mes se ainda nao existirem

### 2.2 Nova interface do Finance
- **Cards resumo:** Receita prevista, Recebido, Pendente, Atrasado
- **Lista por aluno** com status visual (pago/pendente/atrasado):
  - Botao "Dar baixa" (marca paid_at = now, status = paid)
  - Botao "Cobrar via WhatsApp" com mensagem formatada incluindo dias de atraso
  - Badge com dias de atraso (diferenca entre due_date e hoje)
  - Para plano sessao: barra de progresso mostrando sessoes feitas vs totais, valor pendente flutuante
- **Filtros:** Todos / Pendentes / Pagos / Atrasados

### 2.3 Logica de sessoes
- Alunos com plano session: calcular sessoes totais do mes vs session_done
- Mostrar "X de Y sessoes concluidas" com barra
- Valor pendente = sessoes restantes * valor por sessao
- Pagamento so vence quando todas sessoes do ciclo sao concluidas

## 3. Painel Administrativo - Premium com dias, trial e origem

**Mudancas no DB (migracao):**
- Adicionar colunas na tabela `profiles`:
  - `premium_expires_at` (timestamptz, nullable) - quando o premium expira
  - `premium_origin` (text, default 'trial') - valores: 'trial', 'courtesy', 'paid'
  - `trial_started_at` (timestamptz, nullable) - quando o trial comecou

### 3.1 Trial automatico de 7 dias
- No registro (trigger SQL ou no register do AuthContext): setar `plan = 'premium'`, `premium_origin = 'trial'`, `trial_started_at = now()`, `premium_expires_at = now() + 7 days`
- No AuthContext, ao carregar profile, verificar se premium_expires_at ja passou. Se sim, fazer downgrade automatico para free

### 3.2 Admin - Dar dias de premium
- Modal "Adicionar Premium" com campo de dias (ex: 30, 60, 90) e selecao de origem (cortesia/pago)
- Ao confirmar, atualizar premium_expires_at = now() + X dias, plan = premium, premium_origin
- Botao remover premium (setar plan = free, limpar expires)

### 3.3 Admin - Indicadores
- Mostrar para cada personal: plano atual, origem (Trial/Cortesia/Pago), dias restantes de premium, data de expiracao
- Botao de remover personal (soft delete ou delete cascade)
- Badge colorido por origem: azul=trial, amarelo=cortesia, verde=pago

## 4. Cadastro de alunos - Auto-criar agenda

**No Students.tsx:**
- Apos salvar aluno com dias/horarios selecionados, mostrar toast/modal: "Deseja criar agendamentos para as proximas 4 semanas?"
- Se sim, calcular as datas (proximas 4 ocorrencias de cada dia selecionado) e chamar addAppointment para cada

---

## Detalhes Tecnicos

### Migracao SQL necessaria
```text
ALTER TABLE profiles ADD COLUMN premium_expires_at timestamptz;
ALTER TABLE profiles ADD COLUMN premium_origin text DEFAULT 'trial';
ALTER TABLE profiles ADD COLUMN trial_started_at timestamptz;
```

### Arquivos a criar
- `src/hooks/usePayments.ts` - CRUD da tabela payments

### Arquivos a modificar
- `src/pages/Schedule.tsx` - TIME_SLOTS 05-22, grid visual diario/semanal
- `src/pages/Finance.tsx` - Refatoracao completa com payments reais, dar baixa, cobranca, atraso
- `src/pages/Admin.tsx` - Dias premium, origem, remover, trial info
- `src/pages/Students.tsx` - Auto-criar agenda apos salvar
- `src/contexts/AuthContext.tsx` - Verificar expiracao do trial, setar trial no registro
- `src/types/index.ts` - Ajustar tipos se necessario
- `src/types/database.ts` - Adicionar novas colunas de profiles

### Ordem de implementacao
1. Migracao DB (novas colunas em profiles)
2. usePayments hook
3. Schedule (grid 05-22h)
4. Finance (refatoracao completa)
5. Admin (premium com dias, trial, origem)
6. Students (auto-criar agenda)
7. AuthContext (trial/expiracao)
