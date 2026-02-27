

# Plano de Melhorias Completas - FitPro Agenda Personal

## 1. Agenda - Visualizacoes e Drag and Drop

### 1.1 Tres modos de visualizacao
- **Por dia**: Visualizacao atual com lista de horarios do dia selecionado
- **Por semana**: Grade visual com colunas (Seg-Dom) e linhas de horario (06h-20h), mostrando cards nos slots
- **Lista semanal vertical**: Lista corrida de todos os agendamentos da semana, agrupados por dia, com scroll vertical

Adicionar toggle com 3 botoes no topo da pagina Schedule (Dia / Semana / Lista).

### 1.2 Drag and Drop nos horarios
- Usar a biblioteca `@dnd-kit/core` + `@dnd-kit/sortable` para arrastar agendamentos entre horarios
- Na vista semanal, arrastar cards entre slots de horario/dia
- Ao soltar, chamar `updateAppointment` com nova data/hora
- Feedback visual com ghost element e indicador de drop zone

## 2. Clientes - Campos e Funcionalidades

### 2.1 Melhorias no cadastro
- Nome e telefone ja existem
- Data de vencimento (billingDay) ja existe
- Valor total ja existe
- Frequencia semanal ja existe (weeklyFrequency 1-6)
- Limitar selecao de dias ao numero da frequencia selecionada (se freq=3, so pode marcar 3 dias)
- Aluno de consultoria nao aparece na agenda (ja implementado com `isConsulting`)

### 2.2 Botao WhatsApp na listagem
- Ja existe parcialmente. Melhorar com icone WhatsApp verde visivel e link `https://wa.me/` com numero limpo

## 3. Evolucao - Melhorias

### 3.1 Fotos de evolucao
- Ja implementado (frente, lado, costas). Manter como esta.

### 3.2 Bioimpedancia com foto
- Adicionar campo de upload de foto/arquivo no modal de bioimpedancia (ja existe `imageFile` no hook, falta o input no modal)
- Ao preencher dados, comparar automaticamente com o ultimo registro do aluno e mostrar deltas (setas cima/baixo com cores verde/vermelho)

### 3.3 Dobras cutaneas e medidas corporais
- Ja implementado no modal de medidas. Manter padrao atual.

### 3.4 Evolucao grafica com Recharts
- Adicionar aba "Graficos" na pagina Evolution
- Graficos de linha para: peso, % gordura, massa muscular, dobras cutaneas ao longo do tempo
- Usar Recharts (ja instalado)

### 3.5 Evolucao escrita
- Ao lado dos graficos, mostrar resumo textual: "Desde a primeira avaliacao: perdeu X kg de gordura, ganhou Y kg de massa muscular"
- Comparacao com a ultima sessao

### 3.6 Vincular evolucao ao aluno
- Ja implementado com seletor de aluno. Manter.

## 4. Financas - Melhorias

### 4.1 Aluno inativo nao entra na contagem
- Ja implementado (filtra `isActive`). Manter.

### 4.2 Plano por sessao com pagamento flutuante
- Calcular sessoes totais do plano vs sessoes realizadas (session_done)
- Mostrar sessoes restantes e valor pendente
- Pagamento vence quando todas as sessoes sao concluidas
- Indicador visual de progresso (barra) por aluno

### 4.3 Botao de cobranca WhatsApp
- Adicionar botao WhatsApp ao lado de cada aluno no financeiro
- Mensagem pre-formatada: "Ola [nome], seu pagamento de R$ [valor] referente a [mes] esta pendente."

## 5. Perfil do Personal - Melhorias

### 5.1 Informacoes do plano
- Mostrar qual plano atual (Free/Premium) - ja existe
- Numero total de agendamentos do dia - ja existe
- Numero total de alunos - ja existe

### 5.2 Lista de atendidos no dia
- Adicionar secao "Atendidos hoje" mostrando alunos com `session_done = true` no dia atual
- Separar visualmente dos agendamentos pendentes

## 6. Painel Administrativo

### 6.1 Nova pagina Admin
- Acessivel apenas por usuarios com `is_admin = true`
- Listar todos os personais cadastrados (todos os profiles)
- Mostrar: nome, email, plano, qtd de alunos, data de cadastro
- Acoes: alterar plano (free/premium), ativar/desativar usuario

### 6.2 Aba Admin no BottomNavigation
- Ja existe condicionalmente (`isAdmin`). Conectar a nova pagina.

---

## Detalhes Tecnicos

### Novas dependencias
- `@dnd-kit/core` e `@dnd-kit/sortable` para drag and drop

### Arquivos a criar
- `src/pages/Admin.tsx` - Painel administrativo

### Arquivos a modificar
- `src/pages/Schedule.tsx` - 3 modos de visualizacao + drag and drop + botao WhatsApp
- `src/pages/Students.tsx` - Limitar dias pela frequencia + melhorar WhatsApp
- `src/pages/Evolution.tsx` - Upload foto bioimpedancia + comparacao automatica + graficos Recharts + evolucao escrita + aba graficos
- `src/pages/Finance.tsx` - Sessoes restantes + pagamento flutuante + botao cobranca WhatsApp
- `src/pages/UserPanel.tsx` - Lista de atendidos no dia
- `src/components/BottomNavigation.tsx` - Conectar aba Admin
- `src/App.tsx` - Lazy load Admin page
- `src/hooks/useAppointments.ts` - Suportar phone nos appointments para WhatsApp

### Ordem de implementacao
1. Instalar @dnd-kit
2. Schedule (3 views + drag and drop + WhatsApp)
3. Students (limitar dias + WhatsApp)
4. Evolution (foto bio + comparacao + graficos + texto)
5. Finance (sessoes flutuantes + WhatsApp cobranca)
6. UserPanel (atendidos do dia)
7. Admin page

