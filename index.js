const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const asType = (type, opts = {}) => value => ({ type, value, ...opts });
const deferredType = (type, opts = {}) => {
  const typeFn = asType (type, opts);
  return typeFn (typeFn);
};

const deepCopy = o => {
  if (Array.isArray(o)) {
    return o.map(deepCopy);
  }
  if (Object.prototype.toString.call(o) === '[object Object]') {
    return Object.entries(o).reduce((acc, [k, v]) => {
      acc[k] = deepCopy(v);
      return acc;
    }, {});
  }
  return o;
}

const partition = (pred, a) => a.reduce((acc, cur) => {
  if (pred(cur)) {
    acc[0].push(cur);
  } else {
    acc[1].push(cur);
  }
  return acc;
}, [[], []]);

const specialChars = '\\.^$|?*+()[]{}-'.split('');
const replaceAll = (s, find, replace) => s.replace(new RegExp(`\\${find}`, 'g'), replace);
const escapeSpecial = s => specialChars.reduce((acc, char) => replaceAll(acc, char, `\\${char}`), s);

const namedGroupRegex = /^[a-z]+\w*$/i;
const singleUnicodeCharRegex = /^[^]$/u;
const controlCharRegex = /^[a-z]$/i;
const hexadecimalStringRegex = /^[0-9a-f]+$/i;

const quantifierTable = {
  oneOrMore: '+',
  oneOrMoreLazy: '+?',
  zeroOrMore: '*',
  zeroOrMoreLazy: '*?',
  optional: '?',
  exactly: times => `{${times}}`,
  atLeast: times => `{${times},}`,
  atLeastLazy: times => `{${times},}?`,
  between: times => `{${times[0]},${times[1]}}`,
  betweenLazy: times => `{${times[0]},${times[1]}}?`,
}

const applySubexpressionDefaults = expr => {
  const out = { ...expr };
  out.namespace = ('namespace' in out) ? out.namespace : '';
  out.ignoreFlags = ('ignoreFlags' in out) ? out.ignoreFlags : true;
  out.ignoreStartAndEnd = ('ignoreStartAndEnd' in out) ? out.ignoreStartAndEnd : true;

  assert(typeof out.namespace === 'string', 'namespace must be a string');
  assert(typeof out.ignoreFlags === 'boolean', 'ignoreFlags must be a boolean');
  assert(typeof out.ignoreStartAndEnd === 'boolean', 'ignoreStartAndEnd must be a boolean');

  return out;
}

const t = {
  root: asType('root') (),
  noop: asType('noop') (),
  startOfInput: asType('startOfInput') (),
  endOfInput: asType('endOfInput') (),
  anyChar: asType('anyChar') (),
  whitespaceChar: asType('whitespaceChar', { classCompatible: true }) (),
  nonWhitespaceChar: asType('nonWhitespaceChar', { classCompatible: true }) (),
  digit: asType('digit', { classCompatible: true }) (),
  nonDigit: asType('nonDigit', { classCompatible: true }) (),
  word: asType('word', { classCompatible: true }) (),
  nonWord: asType('nonWord', { classCompatible: true }) (),
  wordBoundary: asType('wordBoundary') (),
  nonWordBoundary: asType('nonWordBoundary') (),
  newline: asType('newline',{ classCompatible: true }) (),
  carriageReturn: asType('carriageReturn', { classCompatible: true }) (),
  tab: asType('tab', { classCompatible: true }) (),
  verticalTab: asType('verticalTab', { classCompatible: true }) (),
  formFeed: asType('formFeed', { classCompatible: true }) (),
  backspace: asType('backspace', { classCompatible: true }) (),
  nullByte: asType('nullByte', { classCompatible: true }) (),
  anyOfChars: asType('anyOfChars', { classCompatible: true }),
  anythingButString: asType('anythingButString'),
  anythingButChars: asType('anythingButChars'),
  anythingButRange: asType('anythingButRange'),
  anythingBut: deferredType('anythingBut', { containsChildren: true }),
  char: asType('char', { classCompatible: true }),
  range: asType('range', { classCompatible: true }),
  string: asType('string', { quantifierRequiresGroup: true }),
  controlChar: asType('controlChar', { classCompatible: true }),
  hexCode: asType('hexCode', { classCompatible: true }),
  utf16Code: asType('utf16Code', { classCompatible: true }),
  unicodeCharCode: asType('unicodeCharCode', { classCompatible: true }),
  unicodeProperty: asType('unicodeProperty', { classCompatible: true }),
  notUnicodeProperty: asType('notUnicodeProperty', { classCompatible: true }),
  namedBackreference: name => deferredType('namedBackreference', { name }),
  backreference: index => deferredType('backreference', { index }),
  capture: deferredType('capture', { containsChildren: true }),
  subexpression: asType('subexpression', { containsChildren: true, quantifierRequiresGroup: true }),
  namedCapture: name => deferredType('namedCapture', { name, containsChildren: true }),
  group: deferredType('group', { containsChildren: true }),
  anyOf: deferredType('anyOf', { containsChildren: true }),
  assertAhead: deferredType('assertAhead', { containsChildren: true }),
  assertNotAhead: deferredType('assertNotAhead', { containsChildren: true }),
  assertBehind: deferredType('assertBehind', { containsChildren: true }),
  assertNotBehind: deferredType('assertNotBehind', { containsChildren: true }),
  exactly: times => deferredType('exactly', { times, containsChild: true }),
  atLeast: times => deferredType('atLeast', { times, containsChild: true }),
  atLeastLazy: times => deferredType('atLeastLazy', { times, containsChild: true }),
  between: (x, y) => deferredType('between', { times: [x, y], containsChild: true }),
  betweenLazy: (x, y) => deferredType('betweenLazy', { times: [x, y], containsChild: true }),
  zeroOrMore: deferredType('zeroOrMore', { containsChild: true }),
  zeroOrMoreLazy: deferredType('zeroOrMoreLazy', { containsChild: true }),
  oneOrMore: deferredType('oneOrMore', { containsChild: true }),
  oneOrMoreLazy: deferredType('oneOrMoreLazy', { containsChild: true }),
  optional: deferredType('optional', { containsChild: true }),
}

const isFusable = element => {
  return element.classCompatible;
};
const fuseElements = elements => {
  const [fusables, rest] = partition(isFusable, elements);
  const fused = fusables.map(el => {
    if (el.type === 'char' || el.type === 'anyOfChars') {
      return el.value;
    } else if (el.type === 'range') {
      return `${el.value[0]}-${el.value[1]}`
    } else if (el.type === 'backspace') {
      return `\\b`;
    }

    return SuperExpressive[evaluate](el);;
  }).join('');
  return [fused, rest];
}

const createStackFrame = type => ({ type, quantifier: null, elements: [] });

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
const mergeSubexpression = Symbol('mergeSubexpression');
const trackNamedGroup = Symbol('trackNamedGroup');

class SuperExpressive {
  constructor() {
    this.state = {
      hasDefinedStart: false,
      hasDefinedEnd: false,
      flags: {
        d: false,
        g: false,
        y: false,
        m: false,
        i: false,
        u: false,
        s: false
      },
      stack: [createStackFrame(t.root)],
      namedGroups: [],
      totalCaptureGroups: 0
    }
  }

  get allowMultipleMatches() {
    const next = this[clone]();
    next.state.flags.g = true;
    return next;
  }

  get lineByLine() {
    const next = this[clone]();
    next.state.flags.m = true;
    return next;
  }

  get caseInsensitive() {
    const next = this[clone]();
    next.state.flags.i = true;
    return next;
  }

  get generateIndices() {
    const next = this[clone]();
    next.state.flags.d = true;
    return next;
  }

  get sticky() {
    const next = this[clone]();
    next.state.flags.y = true;
    return next;
  }

  get unicode() {
    const next = this[clone]();
    next.state.flags.u = true;
    return next;
  }

  get singleLine() {
    const next = this[clone]();
    next.state.flags.s = true;
    return next;
  }

  [matchElement](typeFn) {
    const next = this[clone]();
    next[getCurrentElementArray]().push(next[applyQuantifier](typeFn));
    return next;
  }

  get anyChar() { return this[matchElement](t.anyChar); }
  get whitespaceChar() { return this[matchElement](t.whitespaceChar); }
  get nonWhitespaceChar() { return this[matchElement](t.nonWhitespaceChar); }
  get digit() { return this[matchElement](t.digit); }
  get nonDigit() { return this[matchElement](t.nonDigit); }
  get word() { return this[matchElement](t.word); }
  get nonWord() { return this[matchElement](t.nonWord); }
  get wordBoundary() { return this[matchElement](t.wordBoundary); }
  get nonWordBoundary() { return this[matchElement](t.nonWordBoundary); }
  get newline() { return this[matchElement](t.newline); }
  get carriageReturn() { return this[matchElement](t.carriageReturn); }
  get tab() { return this[matchElement](t.tab); }
  get verticalTab() { return this[matchElement](t.verticalTab); }
  get formFeed() { return this[matchElement](t.formFeed); }
  get backspace() { return this[matchElement](t.backspace); }
  get nullByte() { return this[matchElement](t.nullByte); }

  namedBackreference(name) {
    assert(
      this.state.namedGroups.includes(name),
      `no capture group called "${name}" exists (create one with .namedCapture())`
    );
    return this[matchElement](t.namedBackreference(name));
  }

  backreference(index) {
    assert(typeof index === 'number', 'index must be a number');
    assert(
      index > 0 && index <= this.state.totalCaptureGroups,
      `invalid index ${index}. There are ${this.state.totalCaptureGroups} capture groups on this SuperExpression`
      );

    return this[matchElement](t.backreference(index));
  }

  [frameCreatingElement](typeFn) {
    const next = this[clone]();
    const newFrame = createStackFrame(typeFn);
    next.state.stack.push(newFrame);
    return next;
  }

  get anythingBut() { return this[frameCreatingElement](t.anythingBut); }
  get anyOf() { return this[frameCreatingElement](t.anyOf); }
  get group() { return this[frameCreatingElement](t.group); }
  get assertAhead() { return this[frameCreatingElement](t.assertAhead); }
  get assertNotAhead() { return this[frameCreatingElement](t.assertNotAhead); }
  get assertBehind() { return this[frameCreatingElement](t.assertBehind); }
  get assertNotBehind() { return this[frameCreatingElement](t.assertNotBehind); }

  get capture() {
    const next = this[clone]();
    const newFrame = createStackFrame(t.capture);
    next.state.stack.push(newFrame);
    next.state.totalCaptureGroups++;
    return next;
  }

  [trackNamedGroup](name) {
    assert(typeof name === 'string', `name must be a string (got ${name})`);
    assert(name.length > 0, `name must be at least one character`);
    assert(!this.state.namedGroups.includes(name), `cannot use ${name} again for a capture group`);
    assert(namedGroupRegex.test(name), `name "${name}" is not valid (only letters, numbers, and underscores)`);
    this.state.namedGroups.push(name);
  }

  namedCapture(name) {
    const next = this[clone]();
    const newFrame = createStackFrame(t.namedCapture(name));

    next[trackNamedGroup](name);
    next.state.stack.push(newFrame);
    next.state.totalCaptureGroups++;
    return next;
  }

  [quantifierElement](typeFnName) {
    const next = this[clone]();
    const currentFrame = next[getCurrentFrame]();
    if (currentFrame.quantifier) {
      throw new Error(`cannot quantify regular expression with "${typeFnName}" because it's already being quantified with "${currentFrame.quantifier.type}"`);
    }
    currentFrame.quantifier = t[typeFnName];
    return next;
  }

  get optional() { return this[quantifierElement]('optional'); }
  get zeroOrMore() { return this[quantifierElement]('zeroOrMore'); }
  get zeroOrMoreLazy() { return this[quantifierElement]('zeroOrMoreLazy'); }
  get oneOrMore() { return this[quantifierElement]('oneOrMore'); }
  get oneOrMoreLazy() { return this[quantifierElement]('oneOrMoreLazy'); }

  exactly(n) {
    assert(Number.isInteger(n) && n > 0, `n must be a positive integer (got ${n})`);

    const next = this[clone]();
    const currentFrame = next[getCurrentFrame]();
    if (currentFrame.quantifier) {
      throw new Error(`cannot quantify regular expression with "exactly" because it's already being quantified with "${currentFrame.quantifier.type}"`);
    }
    currentFrame.quantifier = t.exactly(n);
    return next;
  }

  atLeast(n) {
    assert(Number.isInteger(n) && n > 0, `n must be a positive integer (got ${n})`);

    const next = this[clone]();
    const currentFrame = next[getCurrentFrame]();
    if (currentFrame.quantifier) {
      throw new Error(`cannot quantify regular expression with "atLeast" because it's already being quantified with "${currentFrame.quantifier.type}"`);
    }
    currentFrame.quantifier = t.atLeast(n);
    return next;
  }

  atLeastLazy(n) {
    assert(Number.isInteger(n) && n > 0, `n must be a positive integer (got ${n})`);

    const next = this[clone]();
    const currentFrame = next[getCurrentFrame]();
    if (currentFrame.quantifier) {
      throw new Error(`cannot quantify regular expression with "atLeastLazy" because it's already being quantified with "${currentFrame.quantifier.type}"`);
    }
    currentFrame.quantifier = t.atLeastLazy(n);
    return next;
  }

  between(x, y) {
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

  betweenLazy(x, y) {
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

  get startOfInput() {
    assert(!this.state.hasDefinedStart, 'This regex already has a defined start of input');
    assert(!this.state.hasDefinedEnd, 'Cannot define the start of input after the end of input');

    const next = this[clone]();
    next.state.hasDefinedStart = true;
    next[getCurrentElementArray]().push(t.startOfInput);
    return next;
  }

  get endOfInput() {
    assert(!this.state.hasDefinedEnd, 'This regex already has a defined end of input');

    const next = this[clone]();
    next.state.hasDefinedEnd = true;
    next[getCurrentElementArray]().push(t.endOfInput);
    return next;
  }

  anyOfChars(s) {
    const next = this[clone]();

    const elementValue = t.anyOfChars(escapeSpecial(s));
    const currentFrame = next[getCurrentFrame]();

    currentFrame.elements.push(next[applyQuantifier](elementValue));

    return next;
  }

  end() {
    assert(this.state.stack.length > 1, 'Cannot call end while building the root expression.');

    const next = this[clone]();
    const oldFrame = next.state.stack.pop();
    const currentFrame = next[getCurrentFrame]();
    currentFrame.elements.push(next[applyQuantifier](oldFrame.type.value(oldFrame.elements)));
    return next;
  }

  anythingButString(str) {
    assert(typeof str === 'string', `str must be a string (got ${str})`);
    assert(str.length > 0, `str must have least one character`);

    const next = this[clone]();
    const elementValue = t.anythingButString(escapeSpecial(str));
    const currentFrame = next[getCurrentFrame]();
    currentFrame.elements.push(next[applyQuantifier](elementValue));

    return next;
  }

  anythingButChars(chars) {
    assert(typeof chars === 'string', `chars must be a string (got ${chars})`);
    assert(chars.length > 0, `chars must have at least one character`);

    const next = this[clone]();
    const elementValue = t.anythingButChars(escapeSpecial(chars));
    const currentFrame = next[getCurrentFrame]();
    currentFrame.elements.push(next[applyQuantifier](elementValue));

    return next;
  }

  anythingButRange(a, b) {
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

  string(s) {
    assert(typeof s === 'string', `s must be a string (got ${s})`);
    assert(s.length > 0, `s cannot be an empty string`);

    const next = this[clone]();
    const elementValue = s.length > 1 ? t.string(escapeSpecial(s)) : t.char(escapeSpecial(s));
    const currentFrame = next[getCurrentFrame]();
    currentFrame.elements.push(next[applyQuantifier](elementValue));

    return next;
  }

  char(c) {
    assert(typeof c === 'string', `c must be a string (got ${c})`);
    assert(c.length === 1, `char() can only be called with a single character (got ${c})`);

    const next = this[clone]();
    const currentFrame = next[getCurrentFrame]();
    currentFrame.elements.push(next[applyQuantifier](t.char(escapeSpecial(c))));

    return next;
  }

  controlChar(c) {
    assert(typeof c === 'string', `c must be a string (got ${c})`);
    assert(controlCharRegex.test(c), `controlChar() can only be called with a single character from a-z (got ${c})`);

    const next = this[clone]();
    const currentFrame = next[getCurrentFrame]();
    currentFrame.elements.push(next[applyQuantifier](t.controlChar(c.toUpperCase())));

    return next;
  }

  hexCode(hex) {
    assert(typeof hex === 'string', `hex must be a string (got ${hex})`);
    assert(hex.length === 2, `hexCode() can only be called with a 2 character string (got ${hex})`);
    assert(hexadecimalStringRegex.test(hex), `hex can only contain hexadecimal characters (got ${hex})`);

    const next = this[clone]();
    const currentFrame = next[getCurrentFrame]();
    currentFrame.elements.push(next[applyQuantifier](t.hexCode(hex)));

    return next;
  }

  utf16Code(hex) {
    assert(typeof hex === 'string', `hex must be a string (got ${hex})`);
    assert(hex.length === 4, `utf16Code() can only be called with a 4 character string (got ${hex})`);
    assert(hexadecimalStringRegex.test(hex), `hex can only contain hexadecimal characters (got ${hex})`);

    const next = this[clone]();
    const currentFrame = next[getCurrentFrame]();
    currentFrame.elements.push(next[applyQuantifier](t.utf16Code(hex)));

    return next;
  }

  unicodeCharCode(hex) {
    assert(typeof hex === 'string', `hex must be a string (got ${hex})`);
    assert(hex.length === 4 || hex.length === 5, `unicodeCharCode() can only be called with a 4 or 5 character string (got ${hex})`);
    assert(hexadecimalStringRegex.test(hex), `hex can only contain hexadecimal characters (got ${hex})`);

    const next = this[clone]();
    const currentFrame = next[getCurrentFrame]();
    next.state.flags.u = true;
    currentFrame.elements.push(next[applyQuantifier](t.unicodeCharCode(hex)));

    return next;
  }

  unicodeProperty(property) {
    assert(typeof property === 'string', `property must be a string (got ${property})`);
    try { RegExp(`\\p{${property}}`, 'u');
    } catch {
      throw new Error(
        `Property is not a valid Unicode property (got ${property}). ` +
        `For valid properties see: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape`
      );
    }

    const next = this[clone]();
    const currentFrame = next[getCurrentFrame]();
    next.state.flags.u = true;
    currentFrame.elements.push(next[applyQuantifier](t.unicodeProperty(property)));

    return next;
  }

  notUnicodeProperty(property) {
    assert(typeof property === 'string', `property must be a string (got ${property})`);
    try { RegExp(`\\P{${property}}`, 'u');
    } catch {
      throw new Error(
        `Property is not a valid Unicode property (got ${property}). ` +
        `For valid properties see: https://developer.mozilla.org/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape`
      );
    }

    const next = this[clone]();
    const currentFrame = next[getCurrentFrame]();
    next.state.flags.u = true;
    currentFrame.elements.push(next[applyQuantifier](t.notUnicodeProperty(property)));

    return next;
  }

  range(a, b) {
    const strA = a.toString();
    const strB = b.toString();

    assert(singleUnicodeCharRegex.test(strA), `a must be a single character or number (got ${strA})`);
    assert(singleUnicodeCharRegex.test(strB), `b must be a single character or number (got ${strB})`);
    assert(strA.codePointAt(0) < strB.codePointAt(0), `a must have a smaller character value than b (a = ${strA.codePointAt(0)}, b = ${strB.codePointAt(0)})`);

    const next = this[clone]();

    const elementValue = t.range([strA, strB]);
    const currentFrame = next[getCurrentFrame]();

    if (strA.length > 1 || strB.length > 1) {
      next.state.flags.u = true;
    }

    currentFrame.elements.push(next[applyQuantifier](elementValue));

    return next;
  }

  static [mergeSubexpression](el, options, parent, incrementCaptureGroups) {
    let nextEl = deepCopy(el);

    if (nextEl.type === 'backreference') {
      nextEl.index += parent.state.totalCaptureGroups;
    }

    if (nextEl.type === 'capture') {
      incrementCaptureGroups();
    }

    if (nextEl.type === 'namedCapture') {
      const groupName = options.namespace
        ? `${options.namespace}${nextEl.name}`
        : nextEl.name;

      parent[trackNamedGroup](groupName);
      nextEl.name = groupName;
    }

    if (nextEl.type === 'namedBackreference') {
      nextEl.name = options.namespace
        ? `${options.namespace}${nextEl.name}`
        : nextEl.name;
    }

    if (nextEl.containsChild) {
      nextEl.value = SuperExpressive[mergeSubexpression](
        nextEl.value,
        options,
        parent,
        incrementCaptureGroups
      );
    } else if (nextEl.containsChildren) {
      nextEl.value = nextEl.value.map(e =>
        SuperExpressive[mergeSubexpression](
          e,
          options,
          parent,
          incrementCaptureGroups
        )
      );
    }

    if (nextEl.type === 'startOfInput') {
      if (options.ignoreStartAndEnd) {
        return t.noop;
      }

      assert(
        !parent.state.hasDefinedStart,
        'The parent regex already has a defined start of input. ' +
        'You can ignore a subexpressions startOfInput/endOfInput markers with the ignoreStartAndEnd option'
      );

      assert(
        !parent.state.hasDefinedEnd,
        'The parent regex already has a defined end of input. ' +
        'You can ignore a subexpressions startOfInput/endOfInput markers with the ignoreStartAndEnd option'
      );

      parent.state.hasDefinedStart = true;
    }

    if (nextEl.type === 'endOfInput') {
      if (options.ignoreStartAndEnd) {
        return t.noop;
      }

      assert(
        !parent.state.hasDefinedEnd,
        'The parent regex already has a defined start of input. ' +
        'You can ignore a subexpressions startOfInput/endOfInput markers with the ignoreStartAndEnd option'
      );

      parent.state.hasDefinedEnd = true;
    }

    return nextEl;
  }

  subexpression(expr, opts = {}) {
    assert(expr instanceof SuperExpressive, `expr must be a SuperExpressive instance`);
    assert(
      expr.state.stack.length === 1,
      'Cannot call subexpression with a not yet fully specified regex object.' +
      `\n(Try adding a .end() call to match the "${expr[getCurrentFrame]().type.type}" on the subexpression)\n`
    );

    const options = applySubexpressionDefaults(opts);

    const exprNext = expr[clone]();
    const next = this[clone]();
    let additionalCaptureGroups = 0;

    const exprFrame = exprNext[getCurrentFrame]();
    exprFrame.elements = exprFrame.elements.map(e =>
      SuperExpressive[mergeSubexpression](
        e,
        options,
        next,
        () => additionalCaptureGroups++
      )
    );

    next.state.totalCaptureGroups += additionalCaptureGroups;

    if (!options.ignoreFlags) {
      Object.entries(exprNext.state.flags).forEach(([flagName, enabled]) => {
        next.state.flags[flagName] = enabled || next.state.flags[flagName];
      });
    }

    const currentFrame = next[getCurrentFrame]();
    currentFrame.elements.push(next[applyQuantifier](t.subexpression(exprFrame.elements)));

    return next;
  }

  toRegexString() {
    const {pattern, flags} = this[getRegexPatternAndFlags]();
    return `/${pattern}/${flags}`;
  }

  toRegex() {
    const {pattern, flags} = this[getRegexPatternAndFlags]();
    return new RegExp(pattern, flags);
  }

  [getRegexPatternAndFlags]() {
    assert(
      this.state.stack.length === 1,
      'Cannot compute the value of a not yet fully specified regex object.' +
      `\n(Try adding a .end() call to match the "${this[getCurrentFrame]().type.type}")\n`
    );

    const pattern = this[getCurrentElementArray]().map(SuperExpressive[evaluate]).join('');
    const flags = Object.entries(this.state.flags).map(([name, isOn]) => isOn ? name : '');

    return {
      pattern: pattern === '' ? '(?:)' : pattern,
      flags: flags.sort().join('')
    };
  }

  [applyQuantifier](element) {
    const currentFrame = this[getCurrentFrame]();
    if (currentFrame.quantifier) {
      const wrapped = currentFrame.quantifier.value(element);
      currentFrame.quantifier = null;
      return wrapped;
    }
    return element;
  }

  [getCurrentFrame]() {
    return this.state.stack[this.state.stack.length - 1];
  }

  [getCurrentElementArray]() {
    return this[getCurrentFrame]().elements;
  }

  [clone]() {
    const next = new SuperExpressive();
    next.state = deepCopy(this.state);
    return next;
  }

  static [evaluate](el) {
    switch (el.type) {
      case 'noop': return '';
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
      case 'verticalTab': return '\\v';
      case 'formFeed': return '\\f';
      case 'backspace': return '[\\b]';
      case 'nullByte': return '\\0';
      case 'string': return el.value;
      case 'char': return el.value;
      case 'controlChar': return `\\c${el.value}`;
      case 'hexCode': return `\\x${el.value}`;
      case 'utf16Code': return `\\u${el.value}`;
      case 'unicodeCharCode': return `\\u{${el.value}}`;
      case 'unicodeProperty': return `\\p{${el.value}}`;
      case 'notUnicodeProperty': return `\\P{${el.value}}`;
      case 'range': return `[${el.value[0]}-${el.value[1]}]`;
      case 'anythingButRange': return `[^${el.value[0]}-${el.value[1]}]`;
      case 'anyOfChars': return `[${el.value}]`;
      case 'anythingButChars': return `[^${el.value}]`;
      case 'namedBackreference': return `\\k<${el.name}>`;
      case 'backreference': return `\\${el.index}`;
      case 'subexpression': return el.value.map(SuperExpressive[evaluate]).join('');

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
      case 'atLeastLazy':
      case 'exactly': {
        const inner = SuperExpressive[evaluate](el.value);
        const withGroup = el.value.quantifierRequiresGroup
          ? `(?:${inner})`
          : inner;
        return `${withGroup}${quantifierTable[el.type](el.times)}`;
      }

      case 'anythingButString': {
        const chars = el.value.split('').map(c => `[^${c}]`).join('');
        return `(?:${chars})`;
      }

      case 'assertAhead': {
        const evaluated = el.value.map(SuperExpressive[evaluate]).join('');
        return `(?=${evaluated})`;
      }

      case 'assertBehind': {
        const evaluated = el.value.map(SuperExpressive[evaluate]).join('');
        return `(?<=${evaluated})`;
      }

      case 'assertNotAhead': {
        const evaluated = el.value.map(SuperExpressive[evaluate]).join('');
        return `(?!${evaluated})`;
      }

      case 'assertNotBehind': {
        const evaluated = el.value.map(SuperExpressive[evaluate]).join('');
        return `(?<!${evaluated})`;
      }

      case 'anythingBut': {
        const [fused, rest] = fuseElements(el.value);

        if (!rest.length) {
          return `[^${fused}]`;
        }

        const evaluatedRest = rest.map(SuperExpressive[evaluate]);
        return `(?:(?!${evaluatedRest.join('|')})[^${fused}])`;
      }

      case 'anyOf': {
        const [fused, rest] = fuseElements(el.value);

        if (!rest.length) {
          return `[${fused}]`;
        }

        const evaluatedRest = rest.map(SuperExpressive[evaluate]);
        const separator = (evaluatedRest.length > 0 && fused.length > 0) ? '|' : '';
        return `(?:${evaluatedRest.join('|')}${separator}${fused ? `[${fused}]` : ''})`;
      }

      case 'capture': {
        const evaluated = el.value.map(SuperExpressive[evaluate]);
        return `(${evaluated.join('')})`;
      }

      case 'namedCapture': {
        const evaluated = el.value.map(SuperExpressive[evaluate]);
        return `(?<${el.name}>${evaluated.join('')})`;
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

  static create() {
    return new SuperExpressive();
  }
}


module.exports = SuperExpressive.create;
