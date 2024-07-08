export type PathEntry =
    | {
          type: 'object';
          key: string;
      }
    | {
          type: 'array';
          index: number;
      }
    | {
          type: 'string';
          index: number;
      };

export type PathToCursor = PathEntry[];

export type JsonCursorPathOptions = {
    /**
     * If the cursor position is within a string, whether to specify the string index in the path.
     */
    specifyStringIndex: boolean;
};

type ParseStepResult = {
    endIndex: number;
    found: boolean;
    path?: PathToCursor;
};

export class JsonCursorPath {
    private options: JsonCursorPathOptions;

    /**
     * Internal reference to the code being parsed
     */
    private readonly code: string;

    /**
     * Internal cursor position, used during parsing
     */
    private cursorPosition: number = 0;

    /**
     * Current path to the cursor. used during parsing
     */
    private path: PathToCursor = [];

    constructor(code: string, options?: JsonCursorPathOptions) {
        this.code = code;
        this.options = {
            specifyStringIndex: false,
            ...options,
        };
    }

    get(cursorPosition: number, returnRawPath: true): PathToCursor | null;
    get(cursorPosition: number, returnRawPath?: false): string | null;
    get(cursorPosition: number, returnRawPath?: boolean): PathToCursor | string | null {
        this.cursorPosition = cursorPosition;
        this.path = [];

        const result = this.parseValue(0);

        if (!result.found) {
            return null;
        }

        const path = [...this.path];

        // Reset internal state for cleanup
        this.cursorPosition = 0;
        this.path = [];

        return returnRawPath ? path : this.rawPathToString(path);
    }

    /**
     * Convert a path to a string representation.
     * This should be compatible with third party libraries eg
     */
    rawPathToString(path: PathToCursor): string {
        let pathStr = '$';
        for (const element of path) {
            if (element.type === 'array' || element.type === 'string') {
                pathStr += `[${element.index}]`;
            }

            if (element.type === 'object') {
                if (/[^\w]/.test(element.key) || element.key === '') {
                    pathStr += `["${element.key}"]`;
                } else {
                    pathStr += `.${element.key}`;
                }
            }
        }

        return pathStr;
    }

    /**
     * Parse an array. Place the index at the end square bracket or stop as soon as the cursor is found.
     */
    private parseArray(startIndex: number, index: number = 0): ParseStepResult {
        // Check whether the array is empty
        if (index === 0) {
            const firstTokenIndex = this.parseUntilToken(
                startIndex + 1,
                '{["0123456789tf]'.split(''),
            );
            if (this.code[firstTokenIndex] === ']') {
                return {
                    endIndex: firstTokenIndex,
                    found: this.cursorWithin(startIndex, firstTokenIndex),
                };
            }
        }

        // TODO: If not empty array, teleport index to `firstTokenIndex` to avoid double traversal

        this.path.push({
            type: 'array',
            index,
        });

        // Parse a single value in the array
        const result = this.parseValue(startIndex + 1);
        if (result.found) {
            return result;
        }

        this.path.pop();

        if (this.code[result.endIndex] === ']') {
            return result;
        }

        // Parse next value if there is one
        return this.parseArray(result.endIndex + 1, index + 1);
    }

    /**
     * Parse an object. Place the index at the end curly bracket or stop as soon as the cursor is found.
     */
    private parseObject(openBracketIndex: number): ParseStepResult {
        const keyResult = this.parseObjectKey(openBracketIndex);
        if (typeof keyResult.key === 'undefined') {
            return keyResult;
        }

        this.path.push({
            type: 'object',
            key: keyResult.key,
        });

        if (keyResult.found) {
            return keyResult;
        }

        const result = this.parseValue(keyResult.endIndex + 1);
        if (result.found) {
            return result;
        }

        this.path.pop();

        if (this.code[result.endIndex] === '}') {
            return result;
        }

        // Handle next key or stop if there are no more
        return this.parseObject(result.endIndex + 1);
    }

    /**
     * Parse an object key. Place the index at the `:` before the value.
     */
    private parseObjectKey(startIndex: number): ParseStepResult & { key?: string } {
        const keyStart = this.parseUntilToken(startIndex, ['"', '}']);
        if (this.code[keyStart] === '}') {
            // No entries in the object
            return {
                endIndex: keyStart,
                found: this.cursorWithin(startIndex, keyStart),
            };
        }
        const keyEnd = this.parseUntilToken(keyStart + 1, '"', true);
        const key = this.code.slice(keyStart + 1, keyEnd);

        const colonIndex = this.parseUntilToken(keyEnd, ':');

        return {
            key,
            endIndex: colonIndex,
            found: this.cursorWithin(keyStart, colonIndex),
        };
    }

    /**
     * Parse any JSON value. Place the cursor at the separator after the value (could be one of `,]}`).
     */
    private parseValue(index: number): ParseStepResult {
        // Then, it's either an object, a number or a string
        // TODO: We could be more defensive here and accept `undefined`, or any other litteral
        const valueStart = this.parseUntilToken(index, '{["0123456789tfn'.split(''));
        const valueChar = this.code[valueStart];
        let valueEnd: number;
        if (valueChar === '{') {
            // Object
            const result = this.parseObject(valueStart);
            valueEnd = result.endIndex;
            if (result.found) {
                return result;
            }
        } else if (valueChar === '[') {
            // Array
            const result = this.parseArray(valueStart);
            valueEnd = result.endIndex;
            if (result.found) {
                return result;
            }
        } else if (valueChar === '"') {
            // String
            const result = this.parseString(valueStart);
            valueEnd = result.endIndex;
            if (result.found) {
                return result;
            }
        } else if (['t', 'f', 'n'].includes(valueChar)) {
            // Litteral
            valueEnd = this.parseAnyLitteral(valueStart);
        } else {
            // Number
            valueEnd = this.parseUntilToken(valueStart + 1, [',', '}', ']', ' ', '\n']) - 1;
        }

        // Find the next key or end of object/array
        const separatorIndex = this.parseUntilToken(valueEnd + 1, [',', '}', ']']);

        // Cursor somewhere within the value?
        const found = this.cursorWithin(index, valueEnd);
        return {
            found,
            endIndex: separatorIndex,
        };
    }

    /**
     * Parse a string value. Place the cursor at the end quote.
     */
    private parseString(firstQuoteIndex: number): ParseStepResult {
        const endQuoteIndex = this.parseUntilToken(firstQuoteIndex + 1, '"', true);

        // Cursor within string value
        if (this.options.specifyStringIndex && this.cursorWithin(firstQuoteIndex, endQuoteIndex)) {
            if (endQuoteIndex - firstQuoteIndex > 1) {
                // We make it such that if the cursor is on a quote, it is considered to be within the string
                let index = this.cursorPosition - firstQuoteIndex - 1;
                index = Math.min(index, endQuoteIndex - firstQuoteIndex - 2);
                index = Math.max(0, index);

                this.path.push({
                    type: 'string',
                    index,
                });
            }

            return {
                found: true,
                endIndex: endQuoteIndex,
            };
        }

        return {
            found: this.cursorWithin(firstQuoteIndex, endQuoteIndex),
            endIndex: endQuoteIndex,
        };
    }

    /**
     * Parse any litteral. Place the cursor at the end of the litteral (last char).
     */
    private parseAnyLitteral(index: number): number {
        while (++index < this.code.length) {
            const char = this.code[index];
            if (!/[a-zA-Z]/.test(char)) {
                return index - 1;
            }
        }
        return index;
    }

    /**
     * Return the first index of the next/prev specified token.
     * If not found, return the index of the end of the code (code.length) or -1 depending on the direction.
     */
    private parseUntilToken(index: number, token: string | string[], ignoreEscaped = true): number {
        const tokens = Array.isArray(token) ? token : [token];

        while (index < this.code.length && index >= 0) {
            if (tokens.includes(this.code[index])) {
                if (!ignoreEscaped) {
                    return index;
                }
                // Count number of `\` before the token. If there is an even number, the token is not escaped
                // eg \\\\" -> 4 slashes, not escaped
                // eg \\\" -> 3 slashes, escaped
                let escapeCount = 0;
                while (this.code[index - 1 - escapeCount] === '\\') {
                    escapeCount += 1;
                }
                if (escapeCount % 2 === 0) {
                    return index;
                }
            }

            index += 1;
        }

        return index;
    }

    /**
     * Whether the cursor position in within the specified bounds (includes these bounds)
     */
    private cursorWithin(startIndex: number, endIndex: number) {
        return startIndex <= this.cursorPosition && this.cursorPosition <= endIndex;
    }
}
