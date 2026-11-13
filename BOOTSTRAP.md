# Bootstrap

Roteiro da primeira sessão com o Claude Code num repositório criado a partir deste template.
Para começar, abra o Claude Code na pasta do repositório e diga: **"leia o BOOTSTRAP.md e siga"**.

- **Entra aqui:** a entrevista inicial e os passos para transformar o template num app.
- **Não entra aqui:** regras do app (vão para `docs/spec/`) e decisões técnicas (`docs/adr/`).

Este arquivo é apagado no fim do bootstrap.

## Instruções para o Claude

Faça a entrevista abaixo numa mensagem só, com as perguntas numeradas, e espere as respostas.
Pergunte de novo só o que ficar ambíguo. Depois siga os passos, numa branch `bootstrap`, e abra um PR.

## 1. Entrevista

**O app**
1. Qual é o nome do app? (O endereço sai dele: veja "Endereço" no passo 1.)
2. Que problema ele resolve, e para quem? É só para você ou para outras pessoas também?
3. O que você faz nele todo dia (o ciclo principal), em duas ou três frases?
4. Qual é a menor versão que já seria útil? E o que vem depois, em fases?
5. Que palavras você usa para as coisas do app? (Elas viram o glossário e os textos da interface.)

**Rede e dados**
6. O app pode falar com algum servidor, ou é local-only (os dados nunca saem do navegador)?
   - Se é local-only: onde os dados ficam (IndexedDB, localStorage) e como a pessoa faz backup?
   - Se fala com servidores: quais (endereços) e para quê? Há login? Quem guarda os dados?
7. Os dados são sensíveis (trabalho, saúde, dinheiro)? Há alguma regra de empresa ou de compliance a seguir?
8. Precisa ser instalável na tela de início? (O app já abre sem internet depois da primeira visita, ADR-005.)

**Onde e como**
9. Em que aparelhos e navegadores: só computador, celular também?
10. A interface é em português? Algum outro idioma?
11. O repositório vai ser público ou privado? (Repositório privado no plano gratuito do GitHub não
    tem proteção de branch; o CI continua rodando, mas o merge não fica bloqueado.)

**Como você trabalha**
12. Quer que eu teste no navegador depois de cada mudança, ou só com o typecheck e os testes?
13. Quer que eu faça o merge dos meus PRs quando o build passar?

## 2. Passos depois da entrevista

1. **Nome:** `package.json` (`name`), `wrangler.jsonc` (`name`), `index.html` (`<title>`),
   `public/manifest.webmanifest`, `strings.appName` em `src/domain/strings.ts`, títulos do
   `CLAUDE.md` e do `README.md`.
   **Endereço:** não pergunte. O nome do Worker é o nome do app em minúsculas, sem acentos e com
   hífens no lugar de espaços e pontuação ("Estuda, Henrique" vira `estuda-henrique`), e o
   subdomínio da conta da dona no Cloudflare é sempre `souza.pereira.valeria`. O endereço é
   `https://<nome do Worker>.souza.pereira.valeria.workers.dev`: escreva-o na seção "Deployment"
   do `CLAUDE.md`.
2. **Rede:** preencha `network-policy.ts` com as origens permitidas (vazio = local-only). Reescreva
   `docs/SEGURANCA.md` com as regras do caso escolhido e apague a seção do outro caso. Copie de 3 a 5
   regras duras para o `CLAUDE.md`. Registre a escolha num ADR novo.
3. **Produto:** escreva o `docs/SPEC.md` (o que o app é, as fases) e um arquivo em `docs/spec/` por
   feature da primeira fase, a partir de `docs/spec/_modelo.md`, em primeira pessoa e na voz da dona.
   As dúvidas que sobrarem vão para o "Em aberto" de cada arquivo.
4. **Termos:** `docs/GLOSSARIO.md` com as palavras da pergunta 5.
5. **Roadmap:** `docs/ROADMAP.md` com as features da primeira fase como "falta construir".
6. **Arquitetura:** o parágrafo de abertura e a seção "Architecture Overview" do `CLAUDE.md`;
   o modelo de dados inicial em `docs/ARQUITETURA.md`. Uma dependência nova (como um banco no
   navegador) ganha um ADR.
7. **Identidade:** siga a skill `visual-identity` (`.claude/skills/visual-identity/SKILL.md`).
   Ela mostra três ou quatro direções lado a lado e grava a escolhida só como valores em
   `src/ui/theme/tokens.css`, sem renomear tokens, e nas cores do `index.html`, do manifest e dos
   ícones. As regras de interface estão em `docs/UI.md` e o `npm test` confere as automáticas.
8. **Preferências:** ajuste "Working with the owner" no `CLAUDE.md` com as respostas 12 e 13.
9. **Exemplo:** a tela de `src/ui/App.tsx` e `src/domain/greeting.ts` são de exemplo; troque pela
   primeira tela de verdade quando ela existir.
10. **Repositório:** rode `npm run setup:repo` (labels, merge automático, proteção da `main`).
11. **Verificação:** `npm run build` e `npm run docs:check` passam.
12. **Fim:** apague este arquivo e a seção "Usar o template" do `README.md`, e abra o PR.

## 3. O que só a dona faz

Abra uma issue `t:debito-tecnico` para cada item que ficar pendente:

- **Cloudflare** (dash.cloudflare.com > Workers & Pages > Create > Import a repository): conectar o
  repositório; build `npm run build`, deploy `npx wrangler deploy`, com builds de branches ligados
  (cada branch ganha uma prévia). O plano Workers Free basta (ADR-004).
- **Conferir** no celular dela o que o Claude não consegue testar: a instalação na tela de início
  e o app abrindo em modo avião depois da primeira visita.
