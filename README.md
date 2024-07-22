# Painel de Senha

Um painel de senhas simples, abrangendo senhas comuns e preferenciais.

Possui as funcionalidades mínimas para um uso, como: avançar e retroceder senhas de forma incremental, repetir a senha atual e permite alterar as senhas manualmente.

Há alerta sonoro e leitura dos números. Para leitura é usada a API Speech Synthesis, padrão dos navegadores, que se utiliza das vozes já presentes no dispositivo, portanto estas vozes variam entre dispositivos com base nos seus sistemas operacionais.

Neste estado inicial o projeto roda de forma integral no local de abertura, não contando com a arquitetura cliente-servidor que, por exemplo, conectaria um painel com guichês, porém, se for usado se forma prática, basta usar um acesso remoto no dispositivo de painel ou um teclado numérico sem fio conectado neste

<div align="center">

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

</div>

<div align="center">

![screaming_capture](./readme/screaming_capture.gif)

</div>

## Instrução de uso

É possível usá-lo diretamente neste endereço:

Ou localmente usando estes comandos:

```bash
git clone https://github.com/RTormente/ticket_panel.git
cd ticket_panel
```

Agora, basta abrir o `index.html` no navegador de preferência.

Em versões reduzidas do Linux, para se ter a leitura dos números, será necessária a instalação do pacote `speech-dispatcher`

O Firefox faz uso da barra `/` para buscas rápidas, portanto, nele, inicialmente terá que desabilitar este recurso ou apertar `Esc` sempre que for voltar uma senha comum.

## Features

-   [x] Avançar e retornar senhas de forma incremental.
-   [x] Chamar novamente a senha atual.
-   [x] Beep de alerta para a senha chamada.
-   [x] Leitura da senha chamada de forma opcional.
-   [ ] Organização do código e melhor distribuição entre arquivos.
-   [ ] Alterações dos botões para comandos.
-   [ ] Cliente-Servidor contando com o campo dos guichês.
