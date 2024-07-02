# JSON: Position to Path

Convert a position in a raw JSON to the path in the parsed JSON object.

This project is WIP/unfinished, please don't use.

## How to use

```js
const CURSOR = 23123;
const data = fs.readFileSync("data/test-notebook.json");

const path = new JsonParser(data).getCursorPath(CURSOR);
```

## Performance

`O(n)`
