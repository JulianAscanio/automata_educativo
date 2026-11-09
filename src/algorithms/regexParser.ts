import { Alphabet } from "../core/Alphabet";

export class RegexParser {
  private alfabeto: Alphabet;
  private static readonly PRECEDENCIA: Record<string, number> = {
    "*": 3,
    ".": 2,
    "|": 1,
  };

  constructor(alfabeto: Alphabet) {
    this.alfabeto = alfabeto;
  }

  normalizar(regex: string): string {
    const limpia = regex.replace(/\s+/g, "");
    if (!limpia) {
      throw new Error("RF-02: La expresión regular no puede estar vacía.");
    }

    const operadoresValidos = new Set(["|", "*", "(", ")"]);

    // Validar símbolos (RF-02)
    for (const char of limpia) {
      if (!this.alfabeto.pertenece(char) && !operadoresValidos.has(char)) {
        throw new Error(
          `RF-02 Violado: El símbolo '${char}' en la expresión regular no pertenece al alfabeto [${this.alfabeto.simbolos.join(", ")}] ni es un operador permitido (| * ( )).`
        );
      }
    }

    // Inserción de concatenación explícita '.'
    const res: string[] = [];
    for (let i = 0; i < limpia.length; i++) {
      const c1 = limpia[i];
      res.push(c1);

      if (i + 1 < limpia.length) {
        const c2 = limpia[i + 1];

        const c1EsOperando = this.alfabeto.pertenece(c1) || c1 === "*" || c1 === ")";
        const c2EsOperando = this.alfabeto.pertenece(c2) || c2 === "(";

        if (c1EsOperando && c2EsOperando) {
          res.push(".");
        }
      }
    }

    return res.join("");
  }

  aPostfija(regex: string): string {
    const normalizada = this.normalizar(regex);
    const pilaOp: string[] = [];
    const salida: string[] = [];

    for (let i = 0; i < normalizada.length; i++) {
      const token = normalizada[i];

      if (this.alfabeto.pertenece(token)) {
        salida.push(token);
      } else if (token === "(") {
        pilaOp.push(token);
      } else if (token === ")") {
        while (pilaOp.length > 0 && pilaOp[pilaOp.length - 1] !== "(") {
          salida.push(pilaOp.pop()!);
        }
        if (pilaOp.length === 0) {
          throw new Error("Sintaxis inválida: Paréntesis desbalanceados en la expresión regular.");
        }
        pilaOp.pop(); // Quitar '('
      } else {
        // Operador (*, ., |)
        const precActual = RegexParser.PRECEDENCIA[token] || 0;
        while (
          pilaOp.length > 0 &&
          pilaOp[pilaOp.length - 1] !== "(" &&
          (RegexParser.PRECEDENCIA[pilaOp[pilaOp.length - 1]] || 0) >= precActual
        ) {
          salida.push(pilaOp.pop()!);
        }
        pilaOp.push(token);
      }
    }

    while (pilaOp.length > 0) {
      const op = pilaOp.pop()!;
      if (op === "(") {
        throw new Error("Sintaxis inválida: Paréntesis desbalanceados en la expresión regular.");
      }
      salida.push(op);
    }

    return salida.join("");
  }
}
