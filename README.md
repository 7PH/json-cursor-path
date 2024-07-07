# json-cursor-path

Library to convert a cursor position in a JSON file to the path in the parsed JSON object.

## Getting started

1. Install `json-cursor-path`

   ```bash
   npm i --save json-cursor-path
   ```

2. Import JsonCursorPath using ES import

   ```js
   import { JsonCursorPath } from "json-cursor-path";
   ```

3. Create an instance representing a JSON file

   ```js
   const cursorPath = new JsonCursorPath(`{\n  "key": ["val1", "val2"]\n}`);
   ```

4. Get the path corresponding to a cursor position

   ```js
   console.log(cursorPath.get(15)); // Output: "$.key[0]"
   console.log(cursorPath.get(15, true)); // Output: ["key", 0]
   ```

## Performance

`O(n)` (cost of traversing the JSON until the specified cursor)
