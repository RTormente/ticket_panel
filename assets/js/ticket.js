export default class Ticket {
    static MIN_VALUE = 0;
    static MAX_VALUE = 999;

    constructor(type, initial = 0) {
        this.type = type;
        this.current = Ticket.normalize(initial);
    }

    static normalize(value) {
        const number = Number.parseInt(value, 10);

        if (!Number.isFinite(number)) {
            return Ticket.MIN_VALUE;
        }

        return Math.min(Ticket.MAX_VALUE, Math.max(Ticket.MIN_VALUE, number));
    }

    set(value) {
        this.current = Ticket.normalize(value);
    }

    next() {
        this.current++;
        if (this.current > Ticket.MAX_VALUE) this.current = Ticket.MIN_VALUE;
    }

    previous() {
        if (this.current > 0) this.current--;
    }

    get value() {
        return this.current;
    }

    formatted() {
        return this.type === "P"
            ? `P${this.current.toString().padStart(3, "0")}`
            : this.current.toString().padStart(3, "0");
    }

    toJSON() {
        return {
            type: this.type,
            value: this.current,
        };
    }
}
