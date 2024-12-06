import { Ticket } from "../assets/js/ticket.js";

function passed() {
    console.log("%cPASSED", "color: green");
}

function noPassed() {
    console.log("%cNO PASSED", "color: red");
}

console.time("testes");

/************** TESTE DE LIMITE DE CARACTERES  **************/
console.group("TESTE DE LIMITE DE CARACTERES");

console.group("Ticket sem tamanho de caracteres definidos");
try {
    const digitos = 3;
    const teste = new Ticket();

    noPassed();
    console.log(teste.number);
} catch (err) {
    const esperado = "Numero máximo de digitos é obrigatório";
    err.message == esperado ? passed() : noPassed();
}
console.groupEnd();

console.group("Ticket com tamanho de caracteres inteiro");
try {
    const digitos = 3;
    const esperado = "000";
    const teste = new Ticket(digitos);

    teste.number == esperado ? passed() : noPassed();
} catch (err) {
    noPassed();
    console.log(err);
}
console.groupEnd();

console.group("Ticket com tamanho de caracteres inteiro negativo");
try {
    const digitos = -3;
    const teste = new Ticket(digitos);

    noPassed();
    console.log(teste.number);
} catch (err) {
    const esperado = "Apenas numero positivos";
    err.message == esperado ? passed() : noPassed();
}
console.groupEnd();

console.group("Ticket com tamanho de caracteres flutuante");
try {
    const digitos = 1.5;
    const esperado = "000";
    const teste = new Ticket(digitos);

    noPassed();
    console.log(teste.number);
} catch (err) {
    const esperado = "Favor informar apenas numeros inteiros";
    err.message == esperado ? passed() : noPassed();
}
console.groupEnd();

console.group("Ticket com tamanho de caracteres em string");
try {
    const digitos = "57";
    const teste = new Ticket(digitos);

    noPassed();
    console.log(teste.number);
} catch (err) {
    const esperado = "Favor informar apenas numeros inteiros";
    err.message == esperado ? passed() : noPassed();
}
console.groupEnd();

console.group("Ticket com tamanho de caracteres em string alphanumerica");
try {
    const digitos = "asd";
    const teste = new Ticket(digitos);

    noPassed();
    console.log(teste.number);
} catch (err) {
    const esperado = "Favor informar apenas numeros inteiros";
    err.message == esperado ? passed() : noPassed();
}
console.groupEnd();

console.groupEnd();
/************** FIM TESTE DE LIMITE DE CARACTERES  **************/

/************** TESTE DE DEFINIÇÃO E ALTERAÇÃO DO NUMERO  **************/
console.group("TESTE DE DEFINIÇÃO E ALTERAÇÃO DO NUMERO");

console.group("Ticket com valor inteiro definido");
try {
    const digitos = 3;
    const numero = 3;
    const esperado = "003";
    const teste = new Ticket(digitos, numero);

    teste.number == esperado ? passed() : noPassed();
} catch (err) {
    noPassed();
    console.log(err);
}
console.groupEnd();

console.group("Ticket com valor inteiro proximo do limite");
try {
    const digitos = 3;
    const numero = 999;
    const esperado = "999";
    const teste = new Ticket(digitos, numero);

    teste.number == esperado ? passed() : noPassed();
} catch (err) {
    noPassed();
    console.log(err);
}
console.groupEnd();

console.group("Ticket com valor inteiro além do limite");
try {
    const digitos = 3;
    const numero = 1000;
    const teste = new Ticket(digitos, numero);

    noPassed();
    console.log(teste.number);
} catch (err) {
    const esperado = "Numero superior as especificações de digito";
    err.message == esperado ? passed() : noPassed();
}
console.groupEnd();

console.group("Ticket com valor inteiro negativo");
try {
    const digitos = 3;
    const numero = -3;
    const teste = new Ticket(digitos, numero);

    noPassed();
    console.log(teste.number);
} catch (err) {
    const esperado = "Apenas numero positivos";
    err.message == esperado ? passed() : noPassed();
}
console.groupEnd();

console.group("Ticket com valor flutuante");
try {
    const digitos = 3;
    const numero = 9.9;
    const teste = new Ticket(digitos, numero);

    noPassed();
    console.log(teste.number);
} catch (err) {
    const esperado = "Favor informar apenas numeros inteiros";
    err.message == esperado ? passed() : noPassed();
}
console.groupEnd();

console.group("Ticket com valor em string");
try {
    const digitos = 3;
    const numero = "57";
    const teste = new Ticket(digitos, numero);

    noPassed();
    console.log(teste.number);
} catch (err) {
    const esperado = "Favor informar apenas numeros inteiros";
    err.message == esperado ? passed() : noPassed();
}
console.groupEnd();

console.group("Ticket com string alphanumerica");
try {
    const digitos = 3;
    const numero = "asd";
    const teste = new Ticket(digitos, numero);

    noPassed();
    console.log(teste.number);
} catch (err) {
    const esperado = "Favor informar apenas numeros inteiros";
    err.message == esperado ? passed() : noPassed();
}
console.groupEnd();

console.groupEnd();
/************** FIM TESTE DE DEFINIÇÃO E ALTERAÇÃO DO NUMERO  **************/

/************** TESTE DE INCREMENTO  **************/
console.group("TESTE DE INCREMENTO");

console.group("Ticket com valor dentro do limite e incrementado");
try {
    const digitos = 3;
    const numero = 654;
    const esperado = 655;
    const teste = new Ticket(digitos, numero);

    teste.increment();
    teste.number == esperado ? passed() : noPassed();
} catch (err) {
    noPassed();
    console.log(err);
}
console.groupEnd();

console.group("Ticket com valor no limite e incrementado");
try {
    const digitos = 3;
    const numero = 999;
    const teste = new Ticket(digitos, numero);

    teste.increment();
    noPassed();
    console.log(teste.number);
} catch (err) {
    const esperado = "Numero superior as especificações de digito";
    err.message == esperado ? passed() : noPassed();
}
console.groupEnd();

console.groupEnd();
/************** FIM TESTE DE INCREMENTO  **************/

/************** TESTE DE DECREMENTO  **************/
console.group("TESTE DE DECREMENTO");

console.group("Ticket com valor dentro do limite e decrementado");
try {
    const digitos = 3;
    const numero = 89;
    const esperado = 88;
    const teste = new Ticket(digitos, numero);

    teste.decrement();
    teste.number == esperado ? passed() : noPassed();
} catch (err) {
    noPassed();
    console.log(err);
}
console.groupEnd();

console.group("Ticket com valor no limite e decrementado");
try {
    const digitos = 3;
    const numero = 0;
    const teste = new Ticket(digitos);

    teste.decrement();
    noPassed();
    console.log(teste.number);
} catch (err) {
    const esperado = "Apenas numero positivos";
    err.message == esperado ? passed() : noPassed();
}
console.groupEnd();

console.groupEnd();
/************** FIM TESTE DE INCREMENTO  **************/

console.timeEnd("testes");
