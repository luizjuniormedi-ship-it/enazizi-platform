

# Atualização Automática da Extensão Chrome

## Limitação técnica

Extensões instaladas como "unpacked" (fora da Chrome Web Store) **não suportam auto-update nativo do Chrome**. Só extensões publicadas na Web Store recebem updates automáticos.

## Solução viável: Verificação de versão + download assistido

A extensão consulta periodicamente o servidor ENAZIZI para verificar se existe uma versão mais nova. Se sim, exibe um alerta e oferece o download do ZIP atualizado com um clique.

```text
Extensão (background.js)          ENAZIZI (public/)
┌─────────────────────┐           ┌──────────────────┐
│ A cada 1h, fetch    │──GET────→ │ /extension-      │
│ /extension-meta.json│           │  meta.json        │
│                     │←─────────→│ { version: "1.2" }│
│ Se version > local  │           │                   │
│ → mostra badge 🔴   │           │ /enazizi-whatsapp-│
│ → popup: "Atualizar"│           │  extension.zip    │
│ → download ZIP      │           └──────────────────┘
└─────────────────────┘
```

## Implementação

### 1. Arquivo de metadados — `public/extension-meta.json`
```json
{
  "version": "1.0.0",
  "download_url": "/enazizi-whatsapp-extension.zip",
  "changelog": "Versão inicial"
}
```
Atualizado a cada nova versão da extensão.

### 2. Lógica no `background.js` da extensão
- A cada 1 hora, faz `fetch("https://enazizi.com/extension-meta.json")`
- Compara `remote.version` com `chrome.runtime.getManifest().version`
- Se versão remota for maior:
  - Mostra badge vermelho no ícone da extensão
  - No popup, exibe "Nova versão disponível — Baixar agora"
  - Botão baixa o ZIP diretamente

### 3. Popup da extensão (`popup.html`)
- Exibe versão atual
- Se desatualizada: botão "Baixar atualização" + instruções rápidas
- Instruções: "Descompacte o ZIP, vá em chrome://extensions, clique Recarregar"

### 4. Painel admin ENAZIZI
- No `WhatsAppPanel.tsx`, detectar versão da extensão via postMessage
- Se desatualizada, mostrar banner: "Extensão desatualizada — baixe a nova versão"

## Arquivos

| Arquivo | Ação |
|---------|------|
| `public/extension-meta.json` | Criar — metadados de versão |
| `extension/background.js` | Adicionar verificação periódica de versão |
| `extension/popup.html` | Adicionar indicador de atualização disponível |
| `src/components/admin/WhatsAppPanel.tsx` | Adicionar detecção de versão desatualizada |

## Resultado

O admin nunca ficará com uma versão velha sem saber. A cada hora a extensão verifica, e se houver update, avisa com destaque visual tanto na extensão quanto no painel admin.

## Nota sobre Chrome Web Store

Se no futuro quiser update 100% automático (sem nenhuma ação do admin), o caminho é publicar na Chrome Web Store. Isso requer uma conta de desenvolvedor ($5 uma vez) e revisão pela Google. Posso preparar isso como próximo passo se quiser.

