export const EPSILON = "ε";

export enum TipoAutomata {
  AFD = "Autómata Finito Determinista (AFD)",
  AFND = "Autómata Finito No Determinista (AFND)",
  AFND_EPSILON = "AFND con Transiciones Épsilon (ε-AFND)"
}

export interface Estado {
  id: string;
  esInicial: boolean;
  esFinal: boolean;
  subEstados?: string[]; // Conjunto de estados originales {q1, q2} en determinización/minimización
}

export interface Transicion {
  origen: string;
  simbolo: string;
  destino: string;
}

export interface TrazaRegistro {
  tipo: "ETAPA" | "MAPEO" | "INFO" | "ADVERTENCIA" | "PARTICION";
  mensaje: string;
  detalle?: any;
}

export interface SimulacionPaso {
  paso: number;
  estadoActual: string;
  simboloConsumido?: string;
  cadenaRestante: string;
  siguienteEstado?: string;
  descripcion: string;
}

export interface ResultadoSimulacion {
  aceptada: boolean;
  pasos: SimulacionPaso[];
  mensajeFinal: string;
}
