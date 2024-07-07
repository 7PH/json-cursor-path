import fs from 'fs';
import { JsonCursorPath } from "../src/json-cursor-path.ts";

// Load all json files in fixtures and save them with their file names
function loadFixtures() {
    const fixtureFiles = fs.readdirSync('./test/fixtures');
    const fixtures = {};
    fixtureFiles.forEach(file => {
        fixtures[file] = fs.readFileSync(`./test/fixtures/${file}`, 'utf8');
    });
    return fixtures;
}

const fixtures = loadFixtures();

describe("JsonCursorPath", () => {
    describe('objects', () => {
        describe('simple object', () => {
            it('string value', () => {
                const parser = new JsonCursorPath(fixtures['00-object-simple.json'], {
                    specifyStringIndex: true
                });
                const cursor = 20;
                expect(parser.get(cursor)).toBe('$["first-key"][2]');
                expect(parser.get(cursor, true)).toEqual([
                    { type: 'object', key: 'first-key' },
                    { type: 'string', index: 2 }
                ])
            });
            
            it('string value in array in object', () => {
                const parser = new JsonCursorPath(fixtures['00-object-simple.json']);
                const cursor = 253;
                expect(parser.get(cursor)).toBe('$["another-object"]["containing-array"][1]');
                expect(parser.get(cursor, true)).toEqual([
                    { type: 'object', key: 'another-object' },
                    { type: 'object', key: 'containing-array' },
                    { type: 'array', index: 1 },
                ]);
            });
            
            it('specifying string index', () => {
                const parser = new JsonCursorPath(fixtures['00-object-simple.json'], {
                    specifyStringIndex: true,
                });
                const cursor = 253;
                expect(parser.get(cursor)).toBe('$["another-object"]["containing-array"][1][10]');
                expect(parser.get(cursor, true)).toEqual([
                    { type: 'object', key: 'another-object' },
                    { type: 'object', key: 'containing-array' },
                    { type: 'array', index: 1 },
                    { type: 'string', index: 10 },
                ]);
            });
        });

        describe('jupyter notebook', () => {
            it('beautify stringified path when key is alphanum', () => {
                const parser = new JsonCursorPath(fixtures['01-object-jupyter-notebook.json'], {
                    specifyStringIndex: true,
                });
                const cursor = 233331;
                expect(parser.get(cursor)).toBe('$.cells[21].outputs[1].data["image/png"][23]');
                expect(parser.get(cursor, true)).toEqual([
                    { type: 'object', key: 'cells' },
                    { type: 'array', index: 21 },
                    { type: 'object', key: 'outputs' },
                    { type: 'array', index: 1 },
                    { type: 'object', key: 'data' },
                    { type: 'object', key: 'image/png' },
                    { type: 'string', index: 23 },
                ])
            });
        });
    });
});
