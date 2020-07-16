interface Element {
  type: string;
  value?: any; // Not sure how to type it
  metadata?: any;
  quantifierRequiresGroup?: boolean;
}

const asType: (type: string, opts?: {}) => (value?: unknown) => Element = 
    (type, opts = {}) => value => ({ type, value, ...opts });

const deferredType = (type: string) => {
  const typeFn = asType (type);
  return typeFn (typeFn);
};

const deepCopy = <T extends any>(o: T): T => {
  if (Array.isArray(o)) {
    return o.map(deepCopy) as T;
  }
  if (Object.prototype.toString.call(o) === '[object Object]') {
    return Object.entries(o as object).reduce((acc, [k, v]) => {
      acc[k] = deepCopy(v);
      return acc;
    }, {} as any) as T;
  }
  return o;
}

// TS doesn't yet support the following to be written as:
// type Predicate<T1> = (arg: T1) => arg is T2;
// i.e. a user-defined type guard as a type alias.
type Predicate<T> = (arg: T) => boolean;
const partition = <T1, T2>(pred: Predicate<T1 | T2>, a: (T1 | T2)[]) => a.reduce((acc, cur) => {
  if (pred(cur)) {
    acc[0].push(cur as T1);
  } else {
    acc[1].push(cur as T2);
  }
  return acc;
}, [[], []] as [T1[], T2[]]);

const specialChars = '\\.^$|?*+()[]{}-'.split('');
const replaceAll = (s: string, find: unknown, replace: string) => s.replace(new RegExp(`\\${find}`, 'g'), replace);
const escapeSpecial = (s: string) => specialChars.reduce((acc, char) => replaceAll(acc, char, `\\${char}`), s);

const quantifierTable = {
  oneOrMore: '+',
  oneOrMoreLazy: '+?',
  zeroOrMore: '*',
  zeroOrMoreLazy: '*?',
  optional: '?',
  exactly: (metadata: number) => `{${metadata}}`,
  atLeast: (metadata: number) => `{${metadata},}`,
  between: (metadata: [number, number]) => `{${metadata[0]},${metadata[1]}}`,
  betweenLazy: (metadata: [number, number]) => `{${metadata[0]},${metadata[1]}}?`,
}

const t = {
  root: asType('root') (),
  startOfInput: asType('startOfInput') (),
  endOfInput: asType('endOfInput') (),
  capture: deferredType('capture'),
  group: deferredType('group'),
  anyOf: deferredType('anyOf'),
  assertAhead: deferredType('assertAhead'),
  assertNotAhead: deferredType('assertNotAhead'),
  exactly: (times: number) => ({ ...deferredType('exactly'), metadata: times }),
  atLeast: (times: number) => ({ ...deferredType('atLeast'), metadata: times }),
  between: (x: number, y: number) => ({ ...deferredType('between'), metadata: [x, y] }),
  betweenLazy: (x: number, y: number) => ({ ...deferredType('betweenLazy'), metadata: [x, y] }),
  anyChar: asType('anyChar') (),
  whitespaceChar: asType('whitespaceChar') (),
  nonWhitespaceChar: asType('nonWhitespaceChar') (),
  digit: asType('digit') (),
  nonDigit: asType('nonDigit') (),
  word: asType('word') (),
  nonWord: asType('nonWord') (),
  wordBoundary: asType('wordBoundary') (),
  nonWordBoundary: asType('nonWordBoundary') (),
  newline: asType('newline') (),
  carriageReturn: asType('carriageReturn') (),
  tab: asType('tab') (),
  nullByte: asType('nullByte') (),
  string: asType('string', { quantifierRequiresGroup: true }),
  anyOfChars: asType('anyOfChars'),
  anythingButString: asType('anythingButString'),
  anythingButChars: asType('anythingButChars'),
  anythingButRange: asType('anythingButRange'),
  char: asType('char'),
  range: asType('range'),
  zeroOrMore: deferredType('zeroOrMore'),
  zeroOrMoreLazy: deferredType('zeroOrMoreLazy'),
  oneOrMore: deferredType('oneOrMore'),
  oneOrMoreLazy: deferredType('oneOrMoreLazy'),
  optional: deferredType('optional'),
}

interface FusableElement {
  type: 'range' | 'char' | 'anyOfChars';
  value: any; // Not sure how to type it.
}
const isFusable = (element: Element): element is FusableElement => {
  return element.type === 'range' ||
    element.type === 'char' ||
    element.type === 'anyOfChars';
};
const fuseElements = (elements: Element[]) => {
  const [fusables, rest] = partition<FusableElement, Element>(isFusable, elements);
  const fused = fusables.map(el => {
    if (el.type === 'char' || el.type === 'anyOfChars') {
      return el.value;
    }
    return `${el.value[0]}-${el.value[1]}`;
  }).join('');
  return [fused, rest];
}

interface Frame {
  type: Element;
  quantifier: Element | null;
  elements: Element[];
}

const createStackFrame = (type: Element): Frame => ({ type, quantifier: null, elements: [] });

const assert = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

// Symbols are used to create private methods
const clone = Symbol('clone');
const getCurrentFrame = Symbol('getCurrentFrame');
const getCurrentElementArray = Symbol('getCurrentElementArray');
const applyQuantifier = Symbol('applyQuantifier');
const evaluate = Symbol('evaluate');
const getRegexPatternAndFlags = Symbol('getRegexBody');
const matchElement = Symbol('matchElement');
const frameCreatingElement = Symbol('frameCreatingElement');
const quantifierElement = Symbol('quantifierElement');

type Flag = 'g' | 'y' | 'm' | 'i' | 'u' | 's';
interface SuperExpressiveState {
  hasDefinedStart: boolean;
  hasDefinedEnd: boolean;
  flags: { [K in Flag]: boolean };
  stack: Frame[];
  namedGroups: unknown[];
}

class SuperExpressive {
  private state: SuperExpressiveState;

  constructor() {
    this.state = {
      hasDefinedStart: false,
      hasDefinedEnd: false,
      flags: {
        g: false,
        y: false,
        m: false,
        i: false,
        u: false,
        s: false
      },
      stack: [createStackFrame(t.root)],
      namedGroups: []
    }
  }

  get allowMultipleMatches(): SuperExpressive {
    const next = this[clone]();
    next.state.flags.g = true;
    return next;
  }

  get lineByLine(): SuperExpressive {
    const next = this[clone]();
    next.state.flags.m = true;
    return next;
  }

  get caseInsensitive(): SuperExpressive {
    const next = this[clone]();
    next.state.flags.i = true;
    return next;
  }

  get sticky(): SuperExpressive {
    const next = this[clone]();
    next.state.flags.y = true;
    return next;
  }

  get unicode(): SuperExpressive {
    const next = this[clone]();
    next.state.flags.u = true;
    return next;
  }

  get singleLine(): SuperExpressive {
    const next = this[clone]();
    next.state.flags.s = true;
    return next;
  }

  [matchElement](typeFn: Element): SuperExpressive {
    const next = this[clone]();
    next[getCurrentElementArray]().push(next[applyQuantifier](typeFn));
    return next;
  }

  get anyChar(): SuperExpressive { return this[matchElement](t.anyChar); }
  get whitespaceChar(): SuperExpressive { return this[matchElement](t.whitespaceChar); }
  get nonWhitespaceChar(): SuperExpressive { return this[matchElement](t.nonWhitespaceChar); }
  get digit(): SuperExpressive { return this[matchElement](t.digit); }
  get nonDigit(): SuperExpressive { return this[matchElement](t.nonDigit); }
  get word(): SuperExpressive { return this[matchElement](t.word); }
  get nonWord(): SuperExpressive { return this[matchElement](t.nonWord); }
  get wordBoundary(): SuperExpressive { return this[matchElement](t.wordBoundary); }
  get nonWordBoundary(): SuperExpressive { return this[matchElement](t.nonWordBoundary); }
  get newline(): SuperExpressive { return this[matchElement](t.newline); }
  get carriageReturn(): SuperExpressive { return this[matchElement](t.carriageReturn); }
  get tab(): SuperExpressive { return this[matchElement](t.tab); }
  get nullByte(): SuperExpressive { return this[matchElement](t.nullByte); }

  [frameCreatingElement](typeFn: Element): SuperExpressive {
    const next = this[clone]();
    const newFrame = createStackFrame(typeFn);
    next.state.stack.push(newFrame);
    return next;
  }

  get anyOf(): SuperExpressive { return this[frameCreatingElement](t.anyOf); }
  get capture(): SuperExpressive { return this[frameCreatingElement](t.capture); }
  get group(): SuperExpressive { return this[frameCreatingElement](t.group); }
  get assertAhead(): SuperExpressive { return this[frameCreatingElement](t.assertAhead); }
  get assertNotAhead(): SuperExpressive { return this[frameCreatingElement](t.assertNotAhead); }

  [quantifierElement](typeFnName: keyof typeof t): SuperExpressive {
    const next = this[clone]();
    const currentFrame = next[getCurrentFrame]();
    if (currentFrame.quantifier) {
      throw new Error(`cannot quantify regular expression with "${typeFnName}" because it's already being quantified with "${currentFrame.quantifier.type}"`);
    }
    currentFrame.quantifier = t[typeFnName] as Element;
    return next;
  }

  get optional() { return this[quantifierElement]('optional'); }
  get zeroOrMore() { return this[quantifierElement]('zeroOrMore'); }
  get zeroOrMoreLazy() { return this[quantifierElement]('zeroOrMoreLazy'); }
  get oneOrMore() { return this[quantifierElement]('oneOrMore'); }
  get oneOrMoreLazy() { return this[quantifierElement]('oneOrMoreLazy'); }

  exactly(n: number): SuperExpressive {
    assert(Number.isInteger(n) && n > 0, `n must be a positive integer (got ${n})`);

    const next = this[clone]();
    const currentFrame = next[getCurrentFrame]();
    if (currentFrame.quantifier) {
      throw new Error(`cannot quantify regular expression with "exactly" because it's already being quantified with "${currentFrame.quantifier.type}"`);
    }
    currentFrame.quantifier = t.exactly(n);
    return next;
  }

  atLeast(n: number): SuperExpressive {
    assert(Number.isInteger(n) && n > 0, `n must be a positive integer (got ${n})`);

    const next = this[clone]();
    const currentFrame = next[getCurrentFrame]();
    if (currentFrame.quantifier) {
      throw new Error(`cannot quantify regular expression with "atLeast" because it's already being quantified with "${currentFrame.quantifier.type}"`);
    }
    currentFrame.quantifier = t.atLeast(n);
    return next;
  }

  between(x: number, y: number): SuperExpressive {
    assert(Number.isInteger(x) && x >= 0, `x must be an integer (got ${x})`);
    assert(Number.isInteger(y) && y > 0, `y must be an integer greater than 0 (got ${y})`);
    assert(x < y, `x must be less than y (x = ${x}, y = ${y})`);

    const next = this[clone]();
    const currentFrame = next[getCurrentFrame]();
    if (currentFrame.quantifier) {
      throw new Error(`cannot quantify regular expression with "between" because it's already being quantified with "${currentFrame.quantifier.type}"`);
    }
    currentFrame.quantifier = t.between(x, y);
    return next;
  }

  betweenLazy(x: number, y: number): SuperExpressive {
    assert(Number.isInteger(x) && x >= 0, `x must be an integer (got ${x})`);
    assert(Number.isInteger(y) && y > 0, `y must be an integer greater than 0 (got ${y})`);
    assert(x < y, `x must be less than y (x = ${x}, y = ${y})`);

    const next = this[clone]();
    const currentFrame = next[getCurrentFrame]();
    if (currentFrame.quantifier) {
      throw new Error(`cannot quantify regular expression with "betweenLazy" because it's already being quantified with "${currentFrame.quantifier.type}"`);
    }
    currentFrame.quantifier = t.betweenLazy(x, y);
    return next;
  }

  get startOfInput(): SuperExpressive {
    assert(!this.state.hasDefinedStart, 'This regex already has a defined start of input');
    assert(!this.state.hasDefinedEnd, 'Cannot define the start of input after the end of input');

    const next = this[clone]();
    next.state.hasDefinedStart = true;
    next[getCurrentElementArray]().push(t.startOfInput);
    return next;
  }

  get endOfInput(): SuperExpressive {
    if (this.state.hasDefinedEnd) {
      throw new Error('This regex already has a defined end of input');
    }
    const next = this[clone]();
    next.state.hasDefinedEnd = true;
    next[getCurrentElementArray]().push(t.endOfInput);
    return next;
  }

  anyOfChars(s: string): SuperExpressive {
    const next = this[clone]();

    const elementValue = t.anyOfChars(escapeSpecial(s));
    const currentFrame = next[getCurrentFrame]();

    currentFrame.elements.push(next[applyQuantifier](elementValue));

    return next;
  }

  end(): SuperExpressive {
    const next = this[clone]();
    if (next.state.stack.length === 1) {
      throw new Error(`Cannot call end while building the root expression.`);
    }

    const oldFrame = next.state.stack.pop()!;
    const currentFrame = next[getCurrentFrame]();
    currentFrame.elements.push(next[applyQuantifier](oldFrame.type.value(oldFrame.elements)));
    return next;
  }

  anythingButString(str: string): SuperExpressive {
    assert(typeof str === 'string', `str must be a string (got ${str})`);
    assert(str.length > 0, `str must have least one character`);

    const next = this[clone]();
    const elementValue = t.anythingButString(escapeSpecial(str));
    const currentFrame = next[getCurrentFrame]();
    currentFrame.elements.push(next[applyQuantifier](elementValue));

    return next;
  }

  anythingButChars(chars: string): SuperExpressive {
    assert(typeof chars === 'string', `chars must be a string (got ${chars})`);
    assert(chars.length > 0, `chars must have at least one character`);

    const next = this[clone]();
    const elementValue = t.anythingButChars(escapeSpecial(chars));
    const currentFrame = next[getCurrentFrame]();
    currentFrame.elements.push(next[applyQuantifier](elementValue));

    return next;
  }

  anythingButRange(a: string | number, b: string | number): SuperExpressive {
    const strA = a.toString();
    const strB = b.toString();

    assert(strA.length === 1, `a must be a single character or number (got ${strA})`);
    assert(strB.length === 1, `b must be a single character or number (got ${strB})`);
    assert(strA.charCodeAt(0) < strB.charCodeAt(0), `a must have a smaller character value than b (a = ${strA.charCodeAt(0)}, b = ${strB.charCodeAt(0)})`);

    const next = this[clone]();
    const elementValue = t.anythingButRange([a, b]);
    const currentFrame = next[getCurrentFrame]();
    currentFrame.elements.push(next[applyQuantifier](elementValue));

    return next;
  }

  string(s: string): SuperExpressive {
    assert(typeof s === 'string', `s must be a string (got ${s})`);
    assert(s.length >= 0, `s cannot be an empty string`);

    const next = this[clone]();
    const elementValue = s.length > 1 ? t.string(escapeSpecial(s)) : t.char(s);
    const currentFrame = next[getCurrentFrame]();
    currentFrame.elements.push(next[applyQuantifier](elementValue));

    return next;
  }

  char(c: string): SuperExpressive {
    assert(typeof c === 'string', `c must be a string (got ${c})`);
    assert(c.length === 1, `char() can only be called with a single character (got ${c})`);

    const next = this[clone]();
    const currentFrame = next[getCurrentFrame]();
    currentFrame.elements.push(next[applyQuantifier](t.char(escapeSpecial(c))));

    return next;
  }

  range(a: string | number, b: string | number) {
    const strA = a.toString();
    const strB = b.toString();

    assert(strA.length === 1, `a must be a single character or number (got ${strA})`);
    assert(strB.length === 1, `b must be a single character or number (got ${strB})`);
    assert(strA.charCodeAt(0) < strB.charCodeAt(0), `a must have a smaller character value than b (a = ${strA.charCodeAt(0)}, b = ${strB.charCodeAt(0)})`);

    const next = this[clone]();

    const elementValue = t.range([strA, strB]);
    const currentFrame = next[getCurrentFrame]();

    currentFrame.elements.push(this[applyQuantifier](elementValue));

    return next;
  }

  toRegexString(): string {
    const {pattern, flags} = this[getRegexPatternAndFlags]();
    return `/${pattern}/${flags}`;
  }

  toRegex(): RegExp {
    const {pattern, flags} = this[getRegexPatternAndFlags]();
    return new RegExp(pattern, flags);
  }

  [getRegexPatternAndFlags](): { pattern: string; flags: string } {
    assert(
      this.state.stack.length === 1,
      'Cannot compute the value of a not yet fully specified regex object.' +
      `\n(Try adding a .end() call to match the "${this[getCurrentFrame]().type.type}")\n`
    );

    const pattern = this[getCurrentElementArray]().map(SuperExpressive[evaluate]).join('');
    const flags = Object.entries(this.state.flags).map(([name, isOn]) => isOn ? name : '').join('');

    return {
      pattern: pattern === '' ? '(?:)' : pattern,
      flags
    };
  }

  [applyQuantifier](element: Element): Element {
    const currentFrame = this[getCurrentFrame]();
    if (currentFrame.quantifier) {
      const wrapped = currentFrame.quantifier.value(element);
      wrapped.metadata = currentFrame.quantifier.metadata;
      currentFrame.quantifier = null;
      return wrapped;
    }
    return element;
  }

  [getCurrentFrame](): Frame {
    return this.state.stack[this.state.stack.length - 1];
  }

  [getCurrentElementArray](): Element[] {
    return this[getCurrentFrame]().elements;
  }

  [clone](): SuperExpressive {
    const next = new SuperExpressive();
    next.state = deepCopy(this.state);
    return next;
  }

  static [evaluate](el: Element): string {
    switch (el.type) {
      case 'anyChar': return '.';
      case 'whitespaceChar': return '\\s';
      case 'nonWhitespaceChar': return '\\S';
      case 'digit': return '\\d';
      case 'nonDigit': return '\\D';
      case 'word': return '\\w';
      case 'nonWord': return '\\W';
      case 'wordBoundary': return '\\b';
      case 'nonWordBoundary': return '\\B';
      case 'startOfInput': return '^';
      case 'endOfInput': return '$';
      case 'newline': return '\\n';
      case 'carriageReturn': return '\\r';
      case 'tab': return '\\t';
      case 'nullByte': return '\\0';
      case 'string': return el.value;
      case 'char': return el.value;
      case 'range': return `[${el.value[0]}-${el.value[1]}]`;
      case 'anythingButRange': return `[^${el.value[0]}-${el.value[1]}]`;
      case 'anyOfChars': return `[${el.value}]`;
      case 'anythingButChars': return `[^${el.value}]`;

      case 'optional':
      case 'zeroOrMore':
      case 'zeroOrMoreLazy':
      case 'oneOrMore':
      case 'oneOrMoreLazy': {
        const inner = SuperExpressive[evaluate](el.value);
        const withGroup = el.value.quantifierRequiresGroup
          ? `(?:${inner})`
          : inner;
        const symbol = quantifierTable[el.type];
        return `${withGroup}${symbol}`;
      }

      case 'betweenLazy':
      case 'between':
      case 'atLeast':
      case 'exactly': {
        const inner = SuperExpressive[evaluate](el.value);
        const withGroup = el.value.quantifierRequiresGroup
          ? `(?:${inner})`
          : inner;
        return `${withGroup}${quantifierTable[el.type](el.metadata)}`;
      }

      case 'anythingButString': {
        const chars = el.value.split('').map((c: string) => `[^${c}]`).join('');
        return `(?:${chars})`;
      }

      case 'assertAhead': {
        const evaluated = el.value.map(SuperExpressive[evaluate]).join('');
        return `(?=${evaluated})`;
      }

      case 'assertNotAhead': {
        const evaluated = el.value.map(SuperExpressive[evaluate]).join('');
        return `(?!${evaluated})`;
      }

      case 'anyOf': {
        const [fused, rest] = fuseElements(el.value);

        if (!rest.length) {
          return `[${fused}]`;
        }

        const evaluatedRest = (rest as Element[]).map(SuperExpressive[evaluate]);
        const separator = (evaluatedRest.length > 0 && fused.length > 0) ? '|' : '';
        return `(?:${evaluatedRest.join('|')}${separator}${fused ? `[${fused}]` : ''})`;
      }

      case 'capture': {
        const evaluated = el.value.map(SuperExpressive[evaluate]);
        return `(${evaluated.join('')})`;
      }

      case 'group': {
        const evaluated = el.value.map(SuperExpressive[evaluate]);
        return `(?:${evaluated.join('')})`;
      }

      default: {
        throw new Error(`Can't process unsupported element type: ${el.type}`);
      }
    }
  }

  static create(): SuperExpressive {
    return new SuperExpressive();
  }
}

export = SuperExpressive.create;
