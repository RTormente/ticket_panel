/**
 * Creates a new Ticket.
 * @class Ticket
 * @classdesc A ticket for a service queue.
 */
export class Ticket {
    /** @global */
    #maxDigit;
    #number;

    /**
     * @constructs Ticket
     * @param {Number} maxDigit [Required]
     * @param {Number} number
     */
    constructor(maxDigit, number = 0) {
        this.#setmaxDigit(maxDigit);
        this.number = number;
    }

    /******************************************/

    /**
     * @param {Number} value [Required]
     */
    #setmaxDigit(value) {
        if (!value) throw new Error("Numero máximo de digitos é obrigatório");
        if (!Number.isInteger(value)) throw new Error("Favor informar apenas numeros inteiros");
        if (value < 0) throw new Error("Apenas numero positivos");
        if (value > Number.MAX_SAFE_INTEGER) throw new Error("Numero máximo de digitos  inserido é muito grande");

        this.#maxDigit = value;
    }

    /**
     * @returns {String}
     */
    get number() {
        return this.#number.toString().padStart(this.#maxDigit, "0");
    }

    /**
     * @param {Number} value [Required]
     */
    set number(value) {
        if (value.toString().length > this.#maxDigit) throw new Error("Numero superior as especificações de digito");
        if (!Number.isInteger(value)) throw new Error("Favor informar apenas numeros inteiros");
        if (value < 0) throw new Error("Apenas numero positivos");

        this.#number = value;
    }

    /******************************************/

    increment() {
        this.number = this.#number + 1;
    }

    decrement() {
        this.number = this.#number - 1;
    }
}
