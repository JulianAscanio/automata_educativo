import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import ts from 'typescript';
import { createRequire } from 'node:module';
const output = mkdtempSync(join(tmpdir(), 'automata-tests-'));
try {
  const program = ts.createProgram(['src/algorithms/thompson.ts', 'src/algorithms/minimization.ts', 'src/algorithms/subsetConstruction.ts', 'src/algorithms/simulator.ts'], {
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
    const minimal = DFAMinimizer.minimizar(dfa).afdMinimo;
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
