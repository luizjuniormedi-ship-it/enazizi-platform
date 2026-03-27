

# Plano: Aba Upload no painel Admin para banco global

## O que existe
- A página `Admin.tsx` já tem um sistema de abas (Tabs) com WhatsApp, Telegram, Feedbacks, Mensagens, BI
- A página `Uploads.tsx` já tem toda a lógica de upload de PDF/TXT com processamento via edge functions (`process-upload`, `populate-questions`)
- O upload já suporta `is_global: true` para admins

## Solução

### Criar componente `AdminUploadsPanel.tsx`
Componente dedicado para a aba de uploads do admin, com:
- Upload de PDF/TXT (reutilizando a lógica existente do `Uploads.tsx`)
- Todos os uploads são marcados como `is_global: true` automaticamente
- Lista de uploads globais existentes com status de processamento
- Botão para reprocessar/popular questões de uploads já feitos
- Contagem de questões geradas por upload

### Editar `Admin.tsx`
- Adicionar nova aba "Uploads" com ícone `Upload` ao TabsList
- Importar e renderizar `AdminUploadsPanel` no TabsContent correspondente
- Ajustar o filtro do TabsContent dos usuários para excluir a nova aba

## Arquivos
- Criar: `src/components/admin/AdminUploadsPanel.tsx`
- Editar: `src/pages/Admin.tsx` (adicionar aba + import)

