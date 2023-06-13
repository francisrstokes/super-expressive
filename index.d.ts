// Type definitions for Super Expressive 1.0.0
// Project: https://github.com/francisrstokes/super-expressive/
// Definitions by:
//  - Jimmy Affatigato <https://github.com/jimmyaffatigato/>
//  - Francis Stokes <https://github.com/francisrstokes/

declare type SubexpressionOptions = {
    /**
     * Namespace to use on all named capture groups in the subexpression, to avoid naming collisions with your own named groups
     */
    namespace?: string;

    /**
     * If set to true, any flags this subexpression specifies should be disregarded
     */
    ignoreFlags?: boolean;

    /**
     * If set to true, any startOfInput/endOfInput asserted in this subexpression specifies should be disregarded
     */
    ignoreStartAndEnd?: boolean;
}

declare class SuperExpressive {
    /**
     * Uses the `g` flag on the regular expression, which indicates that it should match multiple values when run on a string.
     */
    allowMultipleMatches: SuperExpressive;

    /**
     * Uses the `m` flag on the regular expression, which indicates that it should treat the `.startOfInput` and `.endOfInput` markers as the start and end of lines.
     */
    lineByLine: SuperExpressive;

    /**
     * Uses the `i` flag on the regular expression, which indicates that it should treat ignore the uppercase/lowercase distinction when matching.
     */
    caseInsensitive: SuperExpressive;

    /**
     * Uses the `y` flag on the regular expression, which indicates that it should create a stateful regular expression that can be resumed from the last match.
     */
    sticky: SuperExpressive;

    /**
     * Uses the `u` flag on the regular expression, which indicates that it should use full unicode matching.
     */
    unicode: SuperExpressive;

    /**
     * Uses the `s` flag on the regular expression, which indicates that the input should be treated as a single line, where the `.startOfInput` and `.endOfInput` markers explicitly mark the start and end of input, and `.anyChar` also matches newlines.
     */
    singleLine: SuperExpressive;

    /**
     * Matches any single character. When combined with `.singleLine`, it also matches newlines.
     */
    anyChar: SuperExpressive;

    /**
     * Matches any whitespace character, including the special whitespace characters: `\r\n\t\f\v`.
     */
    whitespaceChar: SuperExpressive;

    /**
     * Matches any non-whitespace character, excluding also the special whitespace characters: `\r\n\t\f\v`.
     */
    nonWhitespaceChar: SuperExpressive;

    /**
     * Matches any digit from `0-9`.
     */
    digit: SuperExpressive;

    /**
     * Matches any non-digit.
     */
    nonDigit: SuperExpressive;

    /**
     * Matches any alpha-numeric (`a-z`, `A-Z`, `0-9`) characters, as well as `_`.
     */
    word: SuperExpressive;

    /**
     * Matches any non alpha-numeric (`a-z`, `A-Z`, `0-9`) characters, excluding `_` as well.
     */
    nonWord: SuperExpressive;

    /**
     * Matches (without consuming any characters) immediately between a character matched by `.word` and a character not matched by `.word` (in either order).
     */
    wordBoundary: SuperExpressive;

    /**
     * Matches (without consuming any characters) at the position between two characters matched by `.word`.
     */
    nonWordBoundary: SuperExpressive;

    /**
     * Matches a `\n` character.
     */
    newline: SuperExpressive;

    /**
     * Matches a `\r` character.
     */
    carriageReturn: SuperExpressive;

    /**
     * Matches a `\t` character.
     */
    tab: SuperExpressive;

    /**
     * Matches a `\v` character.
     */
    verticalTab: SuperExpressive;

    /**
     * Matches a `\f` character.
     */
    formFeed: SuperExpressive;

    /**
     * Matches a `\b` character.
     */
    backspace: SuperExpressive;

    /**
     * Matches a `\u0000` character (ASCII `0`).
     */
    nullByte: SuperExpressive;

    /**
     * Matches a choice between specified elements. Needs to be finalised with `.end()`.
     */
    anyOf: SuperExpressive;

    /**
     * Matches a character that doesn't match any of the specified elements. Needs to be finalised with `.end()`.
     */
    anythingBut: SuperExpressive;

    /**
     * Creates a capture group for the proceeding elements. Needs to be finalised with `.end()`.
     */
    capture: SuperExpressive;

    /**
     * Creates a named capture group for the proceeding elements. Needs to be finalised with `.end()`. Can be later referenced with namedBackreference or backreference.
     * @param name
     */
    namedCapture(name:string): SuperExpressive;

    /**
     * Creates a non-capturing group of the proceeding elements. Needs to be finalised with `.end()`.
     */
    group: SuperExpressive;

    /**
     * Matches exactly what was previously matched by a namedCapture.
     * @param name
     */
    namedBackreference(name:string): SuperExpressive;

    /**
     * Matches exactly what was previously matched by a capture or namedCapture using a positional index. Note regex indexes start at 1, so the first capture group has index 1.
     * @param index
     */
    backreference(index:number): SuperExpressive;

    /**
     * Signifies the end of a SuperExpressive grouping, such as `.anyOf`, `.group`, or `.capture`.
     */
    end(): SuperExpressive;

    /**
     * Assert that the proceeding elements are found without consuming them. Needs to be finalised with `.end()`.
     */
    assertAhead: SuperExpressive;

    /**
     * Assert that the proceeding elements are not found without consuming them. Needs to be finalised with `.end()`.
     */
    assertNotAhead: SuperExpressive;

    /**
     * Assert that the elements contained within are found immediately before this point in the string. Needs to be finalised with `.end()`.
     */
    assertBehind: SuperExpressive;

    /**
     * Assert that the elements contained within are not found immediately before this point in the string. Needs to be finalised with `.end()`.
     */
    assertNotBehind: SuperExpressive;

    /**
     * Assert that the proceeding element may or may not be matched.
     */
    optional: SuperExpressive;

    /**
     * Assert that the proceeding element may not be matched, or may be matched multiple times.
     */
    zeroOrMore: SuperExpressive;

    /**
     * Assert that the proceeding element may not be matched, or may be matched multiple times, but as few times as possible.
     */
    zeroOrMoreLazy: SuperExpressive;

    /**
     * Assert that the proceeding element may be matched once, or may be matched multiple times.
     */
    oneOrMore: SuperExpressive;

    /**
     * Uses the g flag on the regular expression, which indicates that it should match multiple values when run on a string.
     */
    oneOrMoreLazy: SuperExpressive;

    /**
     * Assert that the proceeding element will be matched exactly `n` times.
     * @param {number} n
     */
    exactly(n: number): SuperExpressive;

    /**
     * Assert that the proceeding element will be matched at least `n` times.
     */
    atLeast(n: number): SuperExpressive;

    /**
     * Assert that the proceeding element will be matched somewhere between `x` and `y` times.
     */
    between(x: number, y: number): SuperExpressive;

    /**
     * Assert that the proceeding element will be matched somewhere between `x` and `y` times, but as few times as possible.
     */
    betweenLazy(x: number, y: number): SuperExpressive;

    /**
     * Assert the start of input, or the start of a line when `.lineByLine` is used.
     */
    startOfInput: SuperExpressive;

    /**
     * Assert the end of input, or the end of a line when `.lineByLine` is used.
     */
    endOfInput: SuperExpressive;

    /**
     * Matches any of the characters in the provided string `chars`.
     */
    anyOfChars(chars: string): SuperExpressive;

    /**
     * Matches any character, except any of those in the provided string `chars`.
     */
    anythingButChars(chars: string): SuperExpressive;

    /**
     * Matches any string the same length as `str`, except the characters sequentially defined in `str`
     */
    anythingButString(str: string): SuperExpressive;

    /**
     * Matches any character, except those that would be captured by the `.range` specified by `a` and `b`.
     */
    anythingButRange(a: number, b: number): SuperExpressive;

    /**
     * Matches the exact string `s`.
     */
    string(s: string): SuperExpressive;

    /**
     * Matches the exact character `c`.
     */
    char(c: string): SuperExpressive;

    /**
     * Matches a control code for the latin character `c`.
     */
    controlChar(c: string): SuperExpressive;

    /**
     * Matches a character with the code `hex`.
     * @param hex A 2 digit hexadecimal string.
     */
    hexCode(hex: string): SuperExpressive;

    /**
     * Matches a UTF-16 code unit with the code `hex`.
     * @param hex A 4 digit hexadecimal string.
     */
    utf16Code(hex: string): SuperExpressive;

    /**
     * Matches a unicode character with the value `hex`.
     * Enables the unicode `u` flag when used.
     * @param hex A 4 or 5 digit hexadecimal string.
     */
    unicodeCharCode(hex: string): SuperExpressive;

    /**
     * Matches a Unicode character with the given Unicode property.
     * Invalid Unicode properties or values will cause .toRegex() to throw an error.
     * Enables the unicode `u` flag when used.
     * @param property A Unicode character property in the form `loneProperty` or `property=value`.
     * For valid properties see the MDN Docs:
     * https://developer.mozilla.org/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape
     */
    unicodeProperty(property: string): SuperExpressive;

    /**
     * Matches a Unicode character without the given Unicode property.
     * Invalid Unicode properties or values will cause .toRegex() to throw an error.
     * Enables the unicode `u` flag when used.
     * @param property A Unicode character property in the form `loneProperty` or `property=value`.
     * For valid properties see the MDN Docs:
     * https://developer.mozilla.org/docs/Web/JavaScript/Reference/Regular_expressions/Unicode_character_class_escape
     */
    notUnicodeProperty(property: string): SuperExpressive;

    /**
     * Matches any character that falls between `a` and `b`. Ordering is defined by a characters ASCII or unicode value.
     * The `u` flag is automatically enabled if either `a` or `b` are unicode characters larger than 2 bytes.
     */
    range(a: string, b: string): SuperExpressive;

    /**
     * Matches another SuperExpressive instance.
     * @param {SuperExpressive} expr
     * @param {SubexpressionOptions} opts
     * @param {string} opts.namespace - default = ''
     * @param {boolean} opts.ignoreFlags - default = true
     * @param {boolean} opts.ignoreStartAndEnd - default = true
     */
    subexpression(expr: SuperExpressive, opts?: SubexpressionOptions): SuperExpressive;

    /**
     * Outputs a string representation of the regular expression that this SuperExpression models.
     */
    toRegexString(): string;

    /**
     * Outputs the regular expression that this SuperExpression models.
     */
    toRegex(): RegExp;
}

/**
 * Creates an instance of SuperExpressive.
 */
declare function SuperExpressive(): SuperExpressive;

export = SuperExpressive;
