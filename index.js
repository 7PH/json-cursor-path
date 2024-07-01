import fs from "fs";

const FILE = "data-test.json";
const CURSOR = 97;

/**
 * TODO: Ignore brackets inside quotes
 */
function findNextClosingBracket(code, firstBracketIndex) {
  let index = firstBracketIndex + 1;
  let level = 0;
  while (level >= 0 && index < code.length) {
    // If entering in a quote, skip it
    if (code[index] === '"') {
      index = findNextClosingQuote(code, index) + 1;
      continue;
    }

    // Adjust depth if we see other brackets
    if (code[index] === "{") {
      level++;
    } else if (code[index] === "}") {
      level--;
    }
    index++;
  }
  return index;
}

function findNextClosingQuote(code, cursor) {
  let index = cursor + 1;
  while (index < code.length && (code[index] !== '"' || code[index - 1] === "\\")) {
    index++;
  }
  return index;
}

function findPrevClosingQuote(code, cursor) {
  let index = cursor - 1;
  while (index > 0 && (code[index] !== '"' || code[index - 1] === "\\")) {
    index--;
  }
  return index;
}

function findPrevObjectKey(code, bracketIndex) {
  let secondQuoteIndex = findPrevClosingQuote(code, bracketIndex);
  let firstQuoteIndex = findPrevClosingQuote(code, secondQuoteIndex);

  return code.slice(firstQuoteIndex + 1, secondQuoteIndex);
}

function getPath(cursor) {
  // Get the path in the JSON from the cursor position
  const code = fs.readFileSync(FILE, "utf8").toString();

  let path = [];
  let index = 0;
  while (index < cursor) {
    const char = code[index];
    // If char is a quote, teleport to the next quote
    if (char === '"') {
      const endQuote = findNextClosingQuote(code, index);
      console.log("> detected quote", code.slice(index, endQuote + 1));
      // Teleport to the end quote and continue if the cursor is after
      if (cursor > endQuote) {
        console.log("> skipped quote", code.slice(index, endQuote + 1));
        index = endQuote + 1;
        continue;
      } else {
        console.log("> cursor is inside quote. exiting");
        path.push(findPrevObjectKey(code, index));
        break;
      }
      continue;
    }

    // If array, find the closing bracket
    if (char === "[") {
      const closingBracket = findNextClosingBracket(code, index, "]");
      console.log("> detected array", code.slice(index, closingBracket + 1));

      // Teleport to the closing bracket and continue if the cursor is after
      if (cursor > closingBracket) {
        console.log("> skipped array", code.slice(index, closingBracket + 1));
        index = closingBracket + 1;
        continue;
      }

      // Otherwise, navigate inside the array
      console.log("> navigating into array", code.slice(index, closingBracket + 1));
      path.push("0");
      ++index;
      continue;
    }

    // If char is a curly bracket, find the closing one
    if (char === "{") {
      const closingBracket = findNextClosingBracket(code, index, "}");

      // Teleport to the closing bracket and continue if the cursor is after
      if (cursor > closingBracket) {
        console.log("> skipped bracket", code.slice(index, closingBracket + 1));
        index = closingBracket + 1;
        continue;
      }

      // Otherwise, navigate inside the object
      console.log("> navigating into bracket", code.slice(index, closingBracket + 1));

      // If we're at the root, add the root key
      if (path.length === 0) {
        path.push("root");
        ++index;
        continue;
      }

      // Find the object key
      path.push(findPrevObjectKey(code, index));
      ++index;
      continue;
    }

    ++index;
  }
  return path.join(".");
}

console.log(`Cursor: ${CURSOR}`);
console.log(`Path: ${getPath(CURSOR)}`);
