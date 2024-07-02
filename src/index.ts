import fs from "fs";
import { JsonParser } from "./JsonParser";

// const FILE = "data/test-v2.json";
// const CURSOR = 153;

const FILE = "data/test-notebook.json";
const CURSOR = 43871;

const data = fs.readFileSync(FILE, "utf8");

const jsonPath = new JsonParser(data).getCursorPath(CURSOR);

console.log("=".repeat(20));
console.log(`Cursor position: ${CURSOR} <~> ${jsonPath}`);
console.log("=".repeat(20));

console.log("=".repeat(20));
const jsonParsed = JSON.parse(data);
console.log(jsonParsed.cells[12].source[5]);
console.log("=".repeat(20));
