

## Plano: Botao de Upload direto no Resumidor de Conteudo

### Problema
O Resumidor de Conteudo ja mostra materiais previamente enviados na pagina de Uploads, mas nao permite enviar arquivos diretamente da tela do agente. O usuario precisa sair, ir ate a pagina de Uploads, enviar o arquivo, esperar processar, e so depois voltar ao Resumidor.

### Solucao
Adicionar um botao de upload inline no componente `AgentChat`, visivel quando a prop `showUploadButton` estiver ativa. O fluxo:

1. **Botao de upload** ao lado do indicador de materiais — abre um file input para PDF/TXT
2. **Upload direto** para o bucket `user-uploads`, cria registro na tabela `uploads`
3. **Processa em background** chamando a edge function `process-upload`
4. **Polling de status** ate o arquivo ser processado
5. **Auto-seleciona** o material recem-enviado como contexto do chat

### Arquivos a editar

1. **`src/components/agents/AgentChat.tsx`**
   - Adicionar prop `showUploadButton?: boolean`
   - Adicionar estado para upload em andamento e progresso
   - Adicionar `<input type="file" accept=".pdf,.txt">` hidden com ref
   - Botao de upload (icone Upload) ao lado do indicador de materiais
   - Logica de upload: storage upload → insert na tabela `uploads` → invoke `process-upload` → polling ate `status=processed` → adicionar ao `availableUploads` e selecionar automaticamente
   - Mostrar indicador de progresso durante processamento

2. **`src/pages/ContentSummarizer.tsx`**
   - Passar `showUploadButton={true}` para o `AgentChat`

### Detalhes tecnicos
- Reutiliza a mesma logica de upload da pagina `Uploads.tsx` (storage path: `{userId}/{timestamp}_{filename}`)
- Limite: 20MB, apenas PDF e TXT
- Polling a cada 3s na tabela `uploads` ate `status !== 'processing'`
- Nao requer migracao de banco — usa tabelas e buckets existentes

