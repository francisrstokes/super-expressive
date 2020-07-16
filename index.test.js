const {expect} = require('chai');
const SuperExpressive = require('.');

const testRegexEquality = (description, regex, superExpression) => it(description, () => {
  const regexStr = regex.toString();
  const superExpressionStr = superExpression.toRegexString();
  expect(regexStr).to.equal(superExpressionStr);

  const doubleConversion = superExpression.toRegex().toString();
  expect(regexStr).to.equal(doubleConversion);
});

const testRegexEqualityOnly = (description, regex, superExpression) => it.only(description, () => {
  const regexStr = regex.toString();
  const superExpressionStr = superExpression.toRegexString();
  expect(regexStr).to.equal(superExpressionStr);
});

const testErrorConditition = (description, errorMsg, superExpressionFn) => it(description, () => {
  expect(superExpressionFn).to.throw(errorMsg);
});

describe('SuperExpressive', () => {
  testRegexEquality('Empty regex', /(?:)/, SuperExpressive());

  testRegexEquality('Flag: g', /(?:)/g, SuperExpressive().allowMultipleMatches );
  testRegexEquality('Flag: m', /(?:)/m, SuperExpressive().lineByLine );
  testRegexEquality('Flag: i', /(?:)/i, SuperExpressive().caseInsensitive );
  testRegexEquality('Flag: y', /(?:)/y, SuperExpressive().sticky);
  testRegexEquality('Flag: u', /(?:)/u, SuperExpressive().unicode);
  testRegexEquality('Flag: s', /(?:)/s, SuperExpressive().singleLine);

  testRegexEquality('anyChar', /./, SuperExpressive().anyChar);
  testRegexEquality('whitespaceChar', /\s/, SuperExpressive().whitespaceChar);
  testRegexEquality('nonWhitespaceChar', /\S/, SuperExpressive().nonWhitespaceChar);
  testRegexEquality('digit', /\d/, SuperExpressive().digit);
  testRegexEquality('nonDigit', /\D/, SuperExpressive().nonDigit);
  testRegexEquality('word', /\w/, SuperExpressive().word);
  testRegexEquality('nonWord', /\W/, SuperExpressive().nonWord);
  testRegexEquality('wordBoundary', /\b/, SuperExpressive().wordBoundary);
  testRegexEquality('nonWordBoundary', /\B/, SuperExpressive().nonWordBoundary);
  testRegexEquality('newline', /\n/, SuperExpressive().newline);
  testRegexEquality('carriageReturn', /\r/, SuperExpressive().carriageReturn);
  testRegexEquality('tab', /\t/, SuperExpressive().tab);
  testRegexEquality('nullByte', /\0/, SuperExpressive().nullByte);

  testRegexEquality(
    'anyOf: basic',
    /(?:hello|\d|\w|[\.#])/,
    SuperExpressive()
      .anyOf
        .string('hello')
        .digit
        .word
        .char('.')
        .char('#')
      .end()
  );

  testRegexEquality(
    'anyOf: range fusion',
    /[a-zA-Z0-9\.#]/,
    SuperExpressive()
      .anyOf
        .range('a', 'z')
        .range('A', 'Z')
        .range('0', '9')
        .char('.')
        .char('#')
      .end()
  );

  testRegexEquality(
    'anyOf: range fusion with other choices',
    /(?:XXX|[a-zA-Z0-9\.#])/,
    SuperExpressive()
      .anyOf
        .range('a', 'z')
        .range('A', 'Z')
        .range('0', '9')
        .char('.')
        .char('#')
        .string('XXX')
      .end()
  );

  testRegexEquality(
    'capture',
    /(hello \w!)/,
    SuperExpressive()
      .capture()
        .string('hello ')
        .word
        .char('!')
      .end()
  );

  testRegexEquality(
    'capture named',
    /(?<myname> hello \w!)/,
    SuperExpressive()
      .capture('myname')
        .string('hello ')
        .word
        .char('!')
      .end()
  );

  testRegexEquality(
    'group',
    /(?:hello \w!)/,
    SuperExpressive()
      .group
        .string('hello ')
        .word
        .char('!')
      .end()
  );

  testErrorConditition(
    'end: error when called with no stack',
    'Cannot call end while building the root expression',
    () => SuperExpressive().end()
  );

  testRegexEquality(
    'assertAhead',
    /(?=[a-f])[a-z]/,
    SuperExpressive()
      .assertAhead
        .range('a', 'f')
      .end()
      .range('a', 'z')
  );

  testRegexEquality(
    'assertNotAhead',
    /(?![a-f])[0-9]/,
    SuperExpressive()
      .assertNotAhead
        .range('a', 'f')
      .end()
      .range('0', '9')
  );

  testRegexEquality('optional', /\w?/, SuperExpressive().optional.word);
  testRegexEquality('zeroOrMore', /\w*/, SuperExpressive().zeroOrMore.word);
  testRegexEquality('zeroOrMoreLazy', /\w*?/, SuperExpressive().zeroOrMoreLazy.word);
  testRegexEquality('oneOrMore', /\w+/, SuperExpressive().oneOrMore.word);
  testRegexEquality('oneOrMoreLazy', /\w+?/, SuperExpressive().oneOrMoreLazy.word);
  testRegexEquality('exactly', /\w{4}/, SuperExpressive().exactly(4).word);
  testRegexEquality('atLeast', /\w{4,}/, SuperExpressive().atLeast(4).word);
  testRegexEquality('between', /\w{4,7}/, SuperExpressive().between(4, 7).word);
  testRegexEquality('betweenLazy', /\w{4,7}?/, SuperExpressive().betweenLazy(4, 7).word);

  testRegexEquality('startOfInput', /^/, SuperExpressive().startOfInput);
  testRegexEquality('endOfInput', /$/, SuperExpressive().endOfInput);
  testRegexEquality('anyOfChars', /[aeiou\.\-]/, SuperExpressive().anyOfChars('aeiou.-'));
  testRegexEquality('anythingButChars', /[^aeiou\.\-]/, SuperExpressive().anythingButChars('aeiou.-'));
  testRegexEquality('anythingButRange', /[^0-9]/, SuperExpressive().anythingButRange('0', '9'));
  testRegexEquality('string', /hello/, SuperExpressive().string('hello'));
  testRegexEquality('char', /h/, SuperExpressive().string('h'));
  testErrorConditition(
    'char: more than one',
    'char() can only be called with a single character (got hello)',
    () => SuperExpressive().char('hello')
  );

  testRegexEquality('range', /[a-z]/, SuperExpressive().range('a', 'z'));
  testRegexEquality('range', /[a-z]/, SuperExpressive().range('a', 'z'));



});