export type JsonPath = (string | number)[];

export type ParseResult = {
  endIndex: number;
  found: boolean;
  path?: JsonPath;
};

export class JsonParser {
  private readonly code: string;
  private cursor: number = 0;

  constructor(code: string) {
    this.code = code;
  }

  getCursorPath(cursor: number): string {
    this.cursor = cursor;

    // Find the first opening bracket, and consider it root
    const startIndex = this.parseUntilToken(0, '{["'.split(""));
    const startChar = this.code[startIndex];

    let result: ParseResult | undefined;
    if (startChar === "{") {
      result = this.parseObject(startIndex + 1, []);
    } else if (startChar === "[") {
      result = this.parseArray(startIndex + 1, []);
    }

    // If we couldn't find the cursor anywhere or the JSON root isn't an array or object
    if (!result?.path) {
      return "";
    }

    return this.pathToString(result.path);
  }

  /**
   * Convert a path to a string representation.
   * This should be compatible with third party libraries eg 
   * @TODO This path should be a valid JSON path that can be passed to `jsonpath`
   */
  pathToString(path: JsonPath): string {
    function toString(p: string | number, addDot?: boolean) {
      if (typeof p === "number") {
        return `[${p}]`;
      }
      return addDot ? `.${p}` : p;
    }

    if (path.length <= 1) {
      return path[0]?.toString() ?? "";
    }

    let pathStr = toString(path[0]);
    for (let i = 1; i < path.length; i++) {
      pathStr += toString(path[i], true);
    }

    return pathStr;
  }

  /**
   * Parse an array. Place the index at the end square bracket or stop as soon as the cursor is found.
   */
  private parseArray(startIndex: number, path: JsonPath, index: number = 0): ParseResult {
    // Check whether the array is empty
    if (index === 0) {
      const firstTokenIndex = this.parseUntilToken(startIndex + 1, '{["0123456789tf]'.split(""));
      if (this.code[firstTokenIndex] === "]") {
        const found = this.cursor >= startIndex && this.cursor <= firstTokenIndex;
        return { endIndex: firstTokenIndex, found };
      }
    }

    // TODO: If not empty array, teleport index to `firstTokenIndex` to avoid double traversal

    // Parse a single value in the array
    const result = this.parseValue(startIndex + 1, path, index);
    if (result.found || this.code[result.endIndex] === "]") {
      return result;
    }

    // Parse next value if there is one
    return this.parseArray(result.endIndex + 1, path, index + 1);
  }

  /**
   * Parse an object. Place the index at the end curly bracket or stop as soon as the cursor is found.
   */
  private parseObject(openBracketIndex: number, path: JsonPath): ParseResult {
    const keyResult = this.parseObjectKey(openBracketIndex);
    if (keyResult.found || !keyResult.key) {
      return keyResult;
    }

    const result = this.parseValue(keyResult.endIndex + 1, path, keyResult.key);
    if (result.found || this.code[result.endIndex] === "}") {
      return result;
    }

    // Handle next key or stop if there are no more
    return this.parseObject(result.endIndex + 1, path);
  }

  /**
   * Parse an object key. Place the index at the `:` before the value.
   */
  private parseObjectKey(startIndex: number): ParseResult & { key?: string } {
    const keyStart = this.parseUntilToken(startIndex, ['"', "}"]);
    if (this.code[keyStart] === "}") {
      // No entries in the object
      const found = this.cursor >= startIndex && this.cursor <= keyStart;
      return { endIndex: keyStart, found };
    }
    const keyEnd = this.parseUntilToken(keyStart + 1, '"', true);
    const key = this.code.slice(keyStart + 1, keyEnd);

    const colonIndex = this.parseUntilToken(keyEnd, ":");

    return {
      key,
      endIndex: colonIndex,
      found: this.cursor >= keyStart && this.cursor <= colonIndex,
    };
  }

  /**
   * Parse any JSON value. Place the cursor at the separator after the value (could be one of `,]}`).
   */
  private parseValue(index: number, path: JsonPath, key: string | number): ParseResult {
    const pathStr = this.pathToString(path);

    // Then, it's either an object, a number or a string
    const valueStart = this.parseUntilToken(index, '{["0123456789tfn'.split(""));
    const valueChar = this.code[valueStart];
    let valueEnd: number;
    if (valueChar === "{") {
      // Object
      const result = this.parseObject(valueStart, [...path, key]);
      valueEnd = result.endIndex;
      if (result.found) {
        return result;
      }
    } else if (valueChar === "[") {
      // Array
      const result = this.parseArray(valueStart, [...path, key]);
      valueEnd = result.endIndex;
      if (result.found) {
        return result;
      }
    } else if (valueChar === '"') {
      // String
      valueEnd = this.parseUntilToken(valueStart + 1, '"', true);
      console.log(`> ${pathStr} : ${key} (string)`);
    } else if (["t", "f", "n"].includes(valueChar)) {
      // Litteral
      // TODO: We could be more defensive here and accept `undefined`, or any other litteral
      valueEnd = this.parseAnyLitteral(valueStart);
      console.log(`> ${pathStr} : ${key} (literral=${this.code.slice(valueStart, valueEnd + 1)})`);
    } else {
      // Number
      valueEnd = this.parseUntilToken(valueStart + 1, [",", "}", "]", " ", "\n"]) - 1;
      console.log(`> ${pathStr} : ${key} (number)`);
    }

    // Find the next key or end of object/array
    const separatorIndex = this.parseUntilToken(valueEnd + 1, [",", "}", "]"]);

    // Cursor somewhere within the value?
    if (index <= this.cursor && this.cursor <= valueEnd) {
      return { found: true, path: [...path, key], endIndex: separatorIndex };
    }

    return { found: false, endIndex: separatorIndex };
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
  private parseUntilToken(
    index: number,
    token: string | string[],
    ignoreEscaped = true,
    direction = 1
  ): number {
    const tokens = Array.isArray(token) ? token : [token];

    while (index < this.code.length && index >= 0) {
      if (tokens.includes(this.code[index])) {
        // Ensure we don't either ignore escaped characters or the previous character is not an escape character.
        if (!ignoreEscaped || this.code[index - 1] !== "\\") {
          return index;
        }
      }

      index += direction;
    }

    return index;
  }
}
