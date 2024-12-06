const alertBar = document.createElement("span");
alertBar.textContent = "Pagina de Teste!!!";
alertBar.style = `
    z-index: 999;
    position: fixed;
    top: 0;
    left: 0;
    width: 99.7vw;
    text-align: center;
    background-color: lightpink; padding: 5px; color: red; font-weight: bold;`;

document.getElementsByTagName("body")[0].prepend(alertBar);