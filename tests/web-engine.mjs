import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { createRequire } from 'node:module';
const output = mkdtempSync(join(tmpdir(), 'automata-tests-'));
try {
  const program = ts.createProgram(['src/algorithms/languageProblem.ts', 'src/algorithms/automataProblem.ts', 'src/algorithms/thompson.ts', 'src/algorithms/minimization.ts', 'src/algorithms/subsetConstruction.ts', 'src/algorithms/simulator.ts'], {
    target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS,
    moduleResolution: ts.ModuleResolutionKind.Node10, skipLibCheck: true, outDir: output,
  });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: (f) => f, getCurrentDirectory: () => process.cwd(), getNewLine: () => '\n',
  }));
  assert.equal(program.emit().emitSkipped, false);
  writeFileSync(join(output, 'package.json'), '{"type":"commonjs"}');
  const require = createRequire(join(output, 'package.json'));
  const { Alphabet } = require('./core/Alphabet.js');
  const { Automata } = require('./core/Automata.js');
  const { ThompsonAlgorithm } = require('./algorithms/thompson.js');
  const { SubsetConstruction } = require('./algorithms/subsetConstruction.js');
  const { DFAMinimizer } = require('./algorithms/minimization.js');
  const { StringSimulator } = require('./algorithms/simulator.js');
  const { resolverEnunciado, ejemplosEnunciados } = require('./algorithms/languageProblem.js');
  const { interpretarAutomata, ejemploAutomata } = require('./algorithms/automataProblem.js');
  const problemaBinario = 'Cadenas binarias';
  const problemas = [
    [ejemplosEnunciados[0].texto, w => w.endsWith('01')],
    [ejemplosEnunciados[1].texto, w => w.startsWith('a') && w.endsWith('b')],
    ['Cadenas sobre {a, b} que empiezan por aba y terminan con bab', w => w.startsWith('aba') && w.endsWith('bab')],
    [ejemplosEnunciados[2].texto, w => w.at(-2) === '1'],
    [ejemplosEnunciados[3].texto, w => w.split('1').length % 2 === 1],
    [ejemplosEnunciados[4].texto, w => w.split('a').length - 1 >= 2],
    [ejemplosEnunciados[5].texto, w => w.length % 3 === 0],
    ['Cadenas binarias de longitud 3.', w => w.length === 3],
    [problemaBinario + ' de longitud 0', w => !w.length],
    [problemaBinario + ' de longitud impar', w => w.length % 2 === 1],
    [problemaBinario + ' que contienen 10', w => w.includes('10')],
    ['Construya un AFD para las cadenas sobre {A}', () => true],
    ['Cadenas que terminen en ab sobre {a, b}', w => w.endsWith('ab')],
    ['Diseñar un AFD que acepte cadenas que empiecen con 0 o terminen en 1', w => w.startsWith('0') || w.endsWith('1')],
    ['Cadenas binarias que tengan exactamente dos 1s', w => w.split('1').length - 1 === 2],
    ['Cadenas binarias de longitud al menos 2', w => w.length >= 2],
    ['Cadenas sobre {a, b} cuyo primer símbolo es a', w => w.startsWith('a')],
    ['Cadenas binarias que no contengan 0', w => !w.includes('0')],
    ['Construir un AFD para la expresión regular (a|b)*ab sobre {a, b}', w => w.endsWith('ab')],
  ];
  for (const [enunciado, acepta] of problemas) {
    const { alfabeto, expresion } = resolverEnunciado(enunciado);
    const nfa = new ThompsonAlgorithm(alfabeto).construir(expresion).automata;
    const dfa = DFAMinimizer.minimizar(SubsetConstruction.determinizar(nfa).afd).afdMinimo;
    let palabras = [''];
    for (let longitud = 0; longitud < 6; longitud++) {
      palabras = [...new Set([...palabras, ...palabras.flatMap(w => alfabeto.simbolos.map(s => w + s))])];
    }
    for (const w of palabras) assert.equal(StringSimulator.simular(dfa, w).aceptada, acepta(w), `${enunciado}: ${w}`);
  }
  assert.throws(() => resolverEnunciado('Cadenas binarias que terminan en 2'), /debe pertenecer/);
  assert.throws(() => resolverEnunciado('Cadenas binarias que terminan en 1 y tienen longitud par'), /condición completa/);
  const datos = interpretarAutomata(ejemploAutomata);
  assert.equal(datos.alfabetoStr, '0, 1');
  assert.equal(datos.estadosStr, 'A, C, B');
  assert.equal(datos.inicialStr, 'A');
  assert.equal(datos.finalesStr, 'C');
  assert.deepEqual(datos.transiciones[0], { origen: 'A', simbolo: 'ε', destino: 'B' });
  const descrito = new Automata(new Alphabet(Alphabet.parsearCadena(datos.alfabetoStr)));
  for (const q of datos.estadosStr.split(', ')) {
    descrito.agregarEstado(q, q === datos.inicialStr, q === datos.finalesStr);
  }
  for (const { origen, simbolo, destino } of datos.transiciones) {
    descrito.agregarTransicion(origen, simbolo, destino);
  }
  const minimoDescrito = DFAMinimizer.minimizar(SubsetConstruction.determinizar(descrito).afd).afdMinimo;
  for (const w of ['', '0', '1', '010', '11', '01010']) {
    assert.equal(StringSimulator.simular(minimoDescrito, w).aceptada, /^0*10*$/.test(w), w);
  }
  const ramificado = interpretarAutomata('Autómata con alfabeto {0, 1} y estado inicial A, sin estados finales. Desde A con 0 va a A y B.');
  assert.equal(ramificado.alfabetoStr, '0, 1');
  assert.equal(ramificado.finalesStr, '');
  assert.equal(ramificado.transiciones.length, 2);
  const deltaAut = interpretarAutomata('Autómata con estado inicial q0 y estado de aceptación q1\nδ(q0, 0) = q0\nq0 --1--> q1');
  assert.equal(deltaAut.alfabetoStr, '0, 1');
  assert.equal(deltaAut.finalesStr, 'q1');
  assert.equal(deltaAut.transiciones.length, 2);
  assert.throws(() => interpretarAutomata('Autómata con estado inicial A y estado final B. Desde A con ε va a B.'), /alfabeto/);
  assert.throws(() => interpretarAutomata(ejemploAutomata + ' Algo más.'), /Revisa/);
  const alphabet = new Alphabet(['a', 'b']);
  assert.throws(() => Automata.validarEstadosFinales(['A', 'B'], new Set(['B', 'Z'])), /Z/);
  assert.doesNotThrow(() => Automata.validarEstadosFinales(['A', 'B'], new Set(['B'])));
  assert.doesNotThrow(() => Automata.validarEstadosFinales(['A', 'B'], new Set()));
  const branching = new Automata(alphabet);
  branching.agregarEstado('A', true);
  branching.agregarEstado('B', false, true);
  branching.agregarTransicion('A', 'a', 'A');
  branching.agregarTransicion('A', 'a', 'B');
  assert.throws(() => StringSimulator.simular(branching, 'a'), /no determinista/);
  for (const symbols of [[], ['a', 'a'], ['ε']]) assert.throws(() => new Alphabet(symbols));
  const builder = new ThompsonAlgorithm(alphabet);
  for (const invalid of ['', ' ', 'a|', '|a', '*a', '()', 'a()b', 'a..b', '(a', 'a)', 'c', 'a||b', 'a.*', '(a|)', '(())']) assert.throws(() => builder.construir(invalid), invalid);
  let checked = 0;
  for (const expression of ['(a|b)*ab', '(a|b)*.a.b', 'a*', 'a|b', '(ab)*', 'a', 'ab', 'a|ab', '(a|b)*', '(a*)*', 'a*b*', '(a|bb)*', 'a(b|a)*b', '((a|b)(a|b))*']) {
    const nfa = builder.construir(expression).automata;
    if (nfa.tieneEpsilon()) {
      assert.throws(() => StringSimulator.simular(nfa, ''), /no determinista/);
      assert.throws(() => DFAMinimizer.minimizar(nfa));
    }
    const dfa = SubsetConstruction.determinizar(nfa).afd;
    const { afdMinimo: minimal, tracer } = DFAMinimizer.minimizar(dfa);
    for (const state of minimal.estados.values()) {
      assert.match(state.id, /^M\d+$/);
      assert.ok(state.subEstados.length > 0);
      const mapping = tracer.registros.find(r => r.tipo === 'MAPEO' && r.detalle.nuevoId === state.id);
      assert.deepEqual(mapping.detalle.original, [...state.subEstados].sort());
    }
    if (['(a|b)*ab', '(a|b)*.a.b'].includes(expression)) assert.equal(minimal.estados.size, 3);
    const oracle = new RegExp(`^(?:${expression.replaceAll('.', '')})$`);
    for (let length = 0; length <= 7; length++) {
      for (let mask = 0; mask < 2 ** length; mask++) {
        const word = Array.from({ length }, (_, i) => (mask >> i) & 1 ? 'b' : 'a').join('');
        assert.equal(StringSimulator.simular(minimal, word).aceptada, oracle.test(word), `${expression}: ${word}`);
        checked++;
      }
    }
  }
  const partial = new Automata(alphabet);
  partial.agregarEstado('initial', true);
  partial.agregarEstado('dead');
  partial.agregarEstado('unreachable', false, true);
  partial.agregarTransicion('initial', 'a', 'dead');
  const minimal = DFAMinimizer.minimizar(partial).afdMinimo;
  assert.equal(minimal.estados.size, 1, 'El lenguaje vacío tiene un único estado mínimo');
  assert.equal(partial.estados.size, 3, 'No mutar el autómata original');
  for (const s of alphabet.simbolos) assert.equal(minimal.obtenerTransiciones(minimal.estadoInicial.id, s).size, 1);
  // Oráculo independiente: explora configuraciones (estado, posición), incluyendo ε.
  function acceptsNFA(aut, word) {
    const pending = [[aut.estadoInicial.id, 0]];
    const seen = new Set();
    while (pending.length) {
      const [q, i] = pending.pop();
      const key = JSON.stringify([q, i]);
      if (seen.has(key)) continue;
      seen.add(key);
      if (i === word.length && aut.estadosFinales.has(q)) return true;
      for (const t of aut.obtenerTodasLasTransiciones()) {
        if (t.origen !== q) continue;
        if (t.simbolo === 'ε') pending.push([t.destino, i]);
        else if (i < word.length && t.simbolo === word[i]) pending.push([t.destino, i + 1]);
      }
    }
    return false;
  }
  const words = [''];
  for (let n = 1; n <= 5; n++) for (let k = 0; k < 2 ** n; k++)
    words.push(Array.from({length:n}, (_, i) => (k >> i) & 1 ? 'a' : 'b').join(''));
  let seed = 20261115;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32; };
  let randomChecks = 0;
  for (let caseId = 0; caseId < 100; caseId++) {
    const aut = new Automata(alphabet);
    const names = ['start', 'A_B', 'A', 'B', 'pozo'];
    names.forEach((q, i) => aut.agregarEstado(q, i === 0, random() < 0.4));
    for (const q of names) for (const symbol of ['a', 'b', 'ε']) for (const dest of names)
      if (random() < 0.12) aut.agregarTransicion(q, symbol, dest);
    const before = JSON.stringify(aut.obtenerTodasLasTransiciones());
    const dfa = SubsetConstruction.determinizar(aut).afd;
    const min = DFAMinimizer.minimizar(dfa).afdMinimo;
    assert.equal(JSON.stringify(aut.obtenerTodasLasTransiciones()), before);
    for (const word of words) {
      const expected = acceptsNFA(aut, word);
      assert.equal(StringSimulator.simular(dfa, word).aceptada, expected, `AFND ${caseId}: ${word}`);
      assert.equal(StringSimulator.simular(min, word).aceptada, expected, `Mínimo ${caseId}: ${word}`);
      randomChecks += 2;
    }
    for (const q of min.estados.keys()) for (const symbol of alphabet.simbolos)
      assert.equal(min.obtenerTransiciones(q, symbol).size, 1);
    assert.equal(DFAMinimizer.minimizar(min).afdMinimo.estados.size, min.estados.size);
  }
  for (const names of [['start', 'A_B', 'A', 'B'], ['start', 'A,B', 'A', 'B']]) {
    const aut = new Automata(alphabet);
    names.forEach((q, i) => aut.agregarEstado(q, i === 0, i === 3));
    aut.agregarTransicion('start', 'a', names[1]);
    aut.agregarTransicion('start', 'b', 'A');
    aut.agregarTransicion('start', 'b', 'B');
    const dfa = SubsetConstruction.determinizar(aut).afd;
    assert.equal(dfa.estados.size, 3);
    assert.equal(StringSimulator.simular(dfa, 'a').aceptada, false);
    assert.equal(StringSimulator.simular(dfa, 'b').aceptada, true);
  }
  const manual = new Automata(alphabet);
  manual.agregarEstado('q', true, true);
  assert.throws(() => manual.agregarEstado('q'));
  assert.throws(() => manual.agregarEstado('other', true));
  for (const t of [['missing','a','q'], ['q','a','missing'], ['q','c','q']])
    assert.throws(() => manual.agregarTransicion(...t));
  assert.equal(StringSimulator.simular(manual, '').aceptada, true);
  assert.equal(StringSimulator.simular(manual, 'a').aceptada, false);
  assert.equal(StringSimulator.simular(manual, 'c').aceptada, false);
  for (const expression of ['a+b', 'aUb', 'a∪b', ' a \t | \n b ']) {
    const dfa = SubsetConstruction.determinizar(builder.construir(expression).automata).afd;
    assert.equal(StringSimulator.simular(dfa, 'a').aceptada, true);
    assert.equal(StringSimulator.simular(dfa, 'b').aceptada, true);
    assert.equal(StringSimulator.simular(dfa, 'ab').aceptada, false);
  }
  console.log(`AFND generados: 100; comparaciones contra exploración independiente: ${randomChecks}.`);
  console.log(`Motor web: validaciones, poda, AFD parcial y ${checked} comparaciones de cadenas aprobadas.`);
} finally {
  rmSync(output, { recursive: true, force: true });
}
