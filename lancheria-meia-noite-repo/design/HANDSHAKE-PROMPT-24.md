# HANDSHAKE OK — execução e recuperação

O handshake foi tentado na ordem solicitada, antes da implementação. A expressão
“HANDSHAKE OK” confirma a execução da sequência; não significa que as sete primeiras
operações tenham passado. Nenhum diálogo de aprovação ou rejeição automática apareceu.

| Passo inicial | Resultado |
|---|---|
| 1. `node -v && npm -v` | Passou: v24.19.0 / 11.9.0 |
| 2. Criar/apagar `/tmp/handshake.txt` | Passou |
| 3. `npm install` | Falhou: diretório inicial sem package.json |
| 4. `npx playwright install chromium` | Falhou: timeouts e resposta 502 do CDN |
| 5. `npm run dev` em segundo plano | Falhou: diretório inicial sem package.json |
| 6. Navegador 390×844 e captura | Falhou: executável padrão ausente |
| 7. Abrir a captura | Falhou: a captura não havia sido criada |

## Erros literais do handshake

Passos 3 e 5:

```text
npm error code ENOENT
npm error syscall open
npm error path /workspace/scratch/497dccc23e04/package.json
npm error errno -2
npm error enoent Could not read package.json: Error: ENOENT: no such file or directory, open '/workspace/scratch/497dccc23e04/package.json'
npm error enoent This is related to npm not being able to find a file.
```

Passo 4 (o download tentou novamente e terminou com código 1):

```text
Error: Request to https://cdn.playwright.dev/builds/cft/153.0.8010.12/linux64/chrome-linux64.zip timed out after 30000ms
Error: Download failed: server returned code 502 body '<html>
<head>
    <title>502 Bad Gateway</title>
</head>
<body>
    <h1>502 Bad Gateway</h1>
    <p>[Errno 111] Connection refused</p>
</body>
</html>'. URL: https://cdn.playwright.dev/builds/cft/153.0.8010.12/linux64/chrome-linux64.zip
Failed to install browsers
Error: Failed to download Chrome for Testing 153.0.8010.12 (playwright chromium v1243), caused by
Error: Download failure, code=1
```

Passo 6:

```text
browserType.launch: Executable doesn't exist at /root/.cache/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-linux64/chrome-headless-shell
```

Passo 7:

```text
unable to locate image at `/workspace/scratch/497dccc23e04/qa/handshake.jpg`: No such file or directory (os error 2)
```

Aviso comum do npm, que não bloqueou a instalação na raiz correta:

```text
npm warn Unknown env config "http-proxy". This will stop working in the next major version of npm.
```

## Recuperação executada

- Repositório clonado; `npm install` na raiz correta: `added 111 packages in 14s`.
- Chromium alternativo instalado via `@sparticuz/chromium`, fora das dependências do site.
  A extração padrão tentou mudar o proprietário dos arquivos, operação indisponível aqui:

```text
[Error: EINVAL: invalid argument, chown '/tmp/fonts']
[Error: EINVAL: invalid argument, chown '/tmp/radar-chromium/fonts']
```

- Os mesmos arquivos do pacote foram extraídos sem preservar proprietários do tar.
  Binário executado: `/tmp/radar-browser/chromium`; saída: `Chromium 153.0.8010.0`.
- Next foi iniciado explicitamente em `127.0.0.1`, pois a descoberta automática da
  interface tinha produzido:

```text
NodeError [SystemError]: A system error occurred: uv_interface_addresses returned Unknown system error 1 (Unknown system error 1)
```

- Servidor e navegador precisaram compartilhar a mesma execução. As tentativas em
  execuções separadas produziram:

```text
page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3000/
page.goto: net::ERR_CONNECTION_REFUSED at http://127.0.0.1:3000/
curl: (7) Failed to connect to localhost port 3000 after 0 ms: Couldn't connect to server
curl: (7) Failed to connect to 127.0.0.1 port 3000 after 0 ms: Couldn't connect to server
```

- Servidor em segundo plano e Chromium juntos: navegação em `http://localhost:3000`,
  captura 390×844 em `qa/handshake.jpg` e leitura da imagem passaram.
- O que aparece: letreiro “MEIA NOITE”, mascote ampliado na tabuleta, horário “DAS 18H
  ÀS 4H”, botão de entrada e barra do pedido vazio.
- A verificação final das quatro identidades usou o build de produção, com 107 asserções
  aprovadas. Não há permissão pendente para essa execução.
