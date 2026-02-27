
# Plano de Melhorias - IMPLEMENTADO

## ✅ 1. Agenda - Grid 05h-22h
- TIME_SLOTS expandido para 05:00-22:00 (18 slots)
- View diária com grid visual, slots vazios clicáveis
- View semanal com grid 7x18, slots clicáveis
- Drag and drop entre slots

## ✅ 2. Painel Financeiro - Refatoração completa
- Hook usePayments com CRUD na tabela payments
- Cards resumo: Receita prevista, Recebido, Pendente, Atrasado
- Filtros: Todos/Pendentes/Pagos/Atrasados
- Botão "Dar baixa" em cada pagamento
- Botão "Cobrar" via WhatsApp com dias de atraso
- Barra de progresso para plano sessão
- Geração automática de payments do mês

## ✅ 3. Admin - Premium com dias, trial e origem
- Modal para conceder X dias de premium (7/15/30/60/90)
- Seleção de origem: Cortesia ou Pago
- Badge colorido por origem (Trial/Cortesia/Pago)
- Dias restantes e data de expiração
- Botão remover premium e remover personal

## ✅ 4. Students - Auto-criar agenda
- Após salvar novo aluno, modal pergunta se quer criar 4 semanas
- Lista os dias/horários selecionados
- Cria agendamentos em batch

## ✅ 5. AuthContext - Trial de 7 dias
- No registro, seta plan=premium, trial de 7 dias
- No login, verifica expiração e faz downgrade automático

## ⚠️ Migração SQL pendente
As colunas premium_expires_at, premium_origin, trial_started_at precisam existir na tabela profiles do Supabase.
