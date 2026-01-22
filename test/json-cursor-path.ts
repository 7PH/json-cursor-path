import fs from 'fs';
import { JsonCursorPath, JsonCursorPathOptions } from '../src/json-cursor-path.ts';

const OPTIONS: JsonCursorPathOptions = {
    specifyStringIndex: true,
};

// Load all json files in fixtures and save them with their file names
function loadFixtures() {
    const fixtureFiles = fs.readdirSync('./test/fixtures');
    const fixtures = {};
    fixtureFiles.forEach((file) => {
        fixtures[file] = fs.readFileSync(`./test/fixtures/${file}`, 'utf8');
    });
    return fixtures;
}

const fixtures = loadFixtures();

describe('JsonCursorPath', () => {
    describe('should respect options', () => {
        it('do not specify string index if specifyStringIndex=false', () => {
            const parser = new JsonCursorPath(fixtures['00-object-simple.json'], {
                specifyStringIndex: false,
            });
            const cursor = 253;
            expect(parser.get(cursor)).toBe('$["another-object"]["containing-array"][1]');
            expect(parser.get(cursor, true)).toEqual([
                { type: 'object', key: 'another-object' },
                { type: 'object', key: 'containing-array' },
                { type: 'array', index: 1 },
            ]);
        });

        it('specify string index if specifyStringIndex=true', () => {
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

    describe('should return correct path in strings', () => {
        it('gets cursor path in a string value', () => {
            const parser = new JsonCursorPath(fixtures['00-object-simple.json'], { ...OPTIONS });
            const cursor = 20;
            expect(parser.get(cursor)).toBe('$["first-key"][2]');
            expect(parser.get(cursor, true)).toEqual([
                { type: 'object', key: 'first-key' },
                { type: 'string', index: 2 },
            ]);
        });

        it('ignores false-flag characters in strings', () => {
            const parser = new JsonCursorPath(fixtures['01-object-false-flags.json'], {
                ...OPTIONS,
            });
            const cursor = 111;
            // String index is 17 (logical character index), not 20 (raw byte offset)
            // because escape sequences like \" and \\\\ count as single characters
            expect(parser.get(cursor)).toBe(
                '$["\\"{}}[]]].:-]\\\\\\\\"][0][0]["\\"{}}[]]].:-]\\\\\\\\"][17]',
            );
            expect(parser.get(cursor, true)).toEqual([
                { type: 'object', key: '\\"{}}[]]].:-]\\\\\\\\' },
                { type: 'array', index: 0 },
                { type: 'array', index: 0 },
                { type: 'object', key: '\\"{}}[]]].:-]\\\\\\\\' },
                { type: 'string', index: 17 },
            ]);
        });

        it('detects cursor in empty strings', () => {
            const parser = new JsonCursorPath(fixtures['01-object-false-flags.json'], {
                ...OPTIONS,
            });
            expect(parser.get(179)).toBe('$["empty-key-values"]');
            for (let cursor = 180; cursor < 186; cursor++) {
                expect(parser.get(cursor)).toBe('$["empty-key-values"][""]');
                expect(parser.get(cursor, true)).toEqual([
                    { type: 'object', key: 'empty-key-values' },
                    { type: 'object', key: '' },
                ]);
            }
            expect(parser.get(186)).toBe('$["empty-key-values"]');
        });

        it('detects cursor in empty strings in arrays', () => {
            const parser = new JsonCursorPath(fixtures['01-object-false-flags.json'], {
                ...OPTIONS,
            });
            for (const cursor of [210, 211]) {
                expect(parser.get(cursor)).toBe('$["empty-key-values"].list[1][0]');
                expect(parser.get(cursor, true)).toEqual([
                    { type: 'object', key: 'empty-key-values' },
                    { type: 'object', key: 'list' },
                    { type: 'array', index: 1 },
                    { type: 'array', index: 0 },
                ]);
            }
        });

        it('beautify stringified path when key is alphanum', () => {
            const parser = new JsonCursorPath(fixtures['02-object-jupyter-notebook.json'], {
                ...OPTIONS,
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
            ]);
        });
    });

    describe('should handle malformed JSON gracefully', () => {
        it('does not crash on trailing comma in array', () => {
            const parser = new JsonCursorPath('[1,]', OPTIONS);
            // Should not throw - just verify it returns something without stack overflow
            expect(() => parser.get(0)).not.toThrow();
            expect(() => parser.get(1)).not.toThrow();
            expect(() => parser.get(2)).not.toThrow();
            expect(() => parser.get(3)).not.toThrow();
            // Cursor on '1' should return the first element path
            expect(parser.get(1)).toBe('$[0]');
        });

        it('does not crash on trailing comma in nested array', () => {
            const parser = new JsonCursorPath('[1, 2, [3,]]', OPTIONS);
            // Should not throw
            for (let i = 0; i < 12; i++) {
                expect(() => parser.get(i)).not.toThrow();
            }
            // Cursor on '3' should return nested path
            expect(parser.get(8)).toBe('$[2][0]');
        });

        it('does not crash on trailing comma in object', () => {
            const parser = new JsonCursorPath('{"a": 1,}', OPTIONS);
            // Should not throw
            for (let i = 0; i < 9; i++) {
                expect(() => parser.get(i)).not.toThrow();
            }
        });
    });

    describe('should return correct path in numbers', () => {
        it('gets cursor path in a number value', () => {
            const parser = new JsonCursorPath(fixtures['00-object-simple.json'], { ...OPTIONS });
            for (let cursor = 126; cursor < 138; cursor++) {
                expect(parser.get(cursor)).toBe('$["nested-object"]["second-nested-object"].foo');
                expect(parser.get(cursor, true)).toEqual([
                    { type: 'object', key: 'nested-object' },
                    { type: 'object', key: 'second-nested-object' },
                    { type: 'object', key: 'foo' },
                ]);
            }
        });

        it('gets cursor path in a number value in arrays', () => {
            const parser = new JsonCursorPath(fixtures['03-array-simple.json'], { ...OPTIONS });
            for (let cursor = 78; cursor < 79; cursor++) {
                expect(parser.get(cursor)).toBe('$[0][3][2]');
                expect(parser.get(cursor, true)).toEqual([
                    { type: 'array', index: 0 },
                    { type: 'array', index: 3 },
                    { type: 'array', index: 2 },
                ]);
            }
        });
    });
});
