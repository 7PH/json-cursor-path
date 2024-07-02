export type JsonPath = (string | number)[];

export type ParseResult = {
  endIndex: number;
  found: boolean;
  path?: JsonPath;
};

/**
 * Locations where the cursor may be in the JSON code.
 */
export class CursorToJsonPath {
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

    if (!result || !result.path) {
      return "";
    }

    return this.pathToString(result.path);
  }

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

  parseArray(startIndex: number, path: JsonPath, index: number = 0): ParseResult {
    // Check whether the array is empty
    if (index === 0) {
      const firstTokenIndex = this.parseUntilToken(startIndex + 1, '{["0123456789tf]'.split(""));
      if (this.code[firstTokenIndex] === "]") {
        const found = this.cursor >= startIndex && this.cursor <= firstTokenIndex;
        return { endIndex: firstTokenIndex, found };
      }
    }

    // Handle next key or stop if there are no more
    const result = this.parseValue(startIndex + 1, path, index);
    if (result.found || this.code[result.endIndex] === "]") {
      return result;
    }

    return this.parseArray(result.endIndex + 1, path, index + 1);
  }

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

  private parseObjectKey(startIndex: number): ParseResult & { key?: string } {
    // An object is a list of key -> value pairs, we will navigate through the keys and values
    const keyStart = this.parseUntilToken(startIndex, ['"', "}"]);
    if (this.code[keyStart] === "}") {
      // No entries in the object
      const found = this.cursor >= startIndex && this.cursor <= keyStart;
      return { endIndex: keyStart, found };
    }
    const keyEnd = this.parseUntilToken(keyStart + 1, '"', true);
    const key = this.code.slice(keyStart + 1, keyEnd);

    // Find ':'
    const colonIndex = this.parseUntilToken(keyEnd, ":");

    return {
      key,
      endIndex: colonIndex,
      found: this.cursor >= keyStart && this.cursor <= colonIndex,
    };
  }

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
      valueEnd = this.parseAnyLitteral(valueStart);
      console.log(`> ${pathStr} : ${key} (literral=${this.code.slice(valueStart, valueEnd + 1)})`);
    } else {
      // Number
      valueEnd = this.parseUntilToken(valueStart + 1, [",", "}", "]", " ", "\n"]) - 1;
      console.log(`> ${pathStr} : ${key} (number)`);
    }

    // Find the next key or end of object
    const separatorIndex = this.parseUntilToken(valueEnd + 1, [",", "}", "]"]);

    // If the cursor is within the value start/end, we found it
    if (index <= this.cursor && this.cursor <= valueEnd) {
      // If the cursor is between the key first quote and the value end, add key
      return { found: true, path: [...path, key], endIndex: separatorIndex };
    }

    return { found: false, endIndex: separatorIndex };
  }

  private parseAnyLitteral(index: number): number {
    // Continue until the next char is not a char
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
