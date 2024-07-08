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

    describe('should return correct path', () => {
        it('get cursor path in a string value', () => {
            const parser = new JsonCursorPath(fixtures['00-object-simple.json'], { ...OPTIONS });
            const cursor = 20;
            expect(parser.get(cursor)).toBe('$["first-key"][2]');
            expect(parser.get(cursor, true)).toEqual([
                { type: 'object', key: 'first-key' },
                { type: 'string', index: 2 },
            ]);
        });

        it('ignore false-flag characters', () => {
            const parser = new JsonCursorPath(fixtures['01-object-false-flags.json'], {
                ...OPTIONS,
            });
            const cursor = 111;
            expect(parser.get(cursor)).toBe(
                '$["\\"{}}[]]].:-]\\\\\\\\"][0][0]["\\"{}}[]]].:-]\\\\\\\\"][20]',
            );
            expect(parser.get(cursor, true)).toEqual([
                { type: 'object', key: '\\"{}}[]]].:-]\\\\\\\\' },
                { type: 'array', index: 0 },
                { type: 'array', index: 0 },
                { type: 'object', key: '\\"{}}[]]].:-]\\\\\\\\' },
                { type: 'string', index: 20 },
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
});
