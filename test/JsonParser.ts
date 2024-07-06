import fs from 'fs';
import { JsonCursorPath } from "../src/JsonCursorPath";

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
            it('> string', () => {
                const parser = new JsonCursorPath(fixtures['00-object-simple.json']);
                expect(parser.get(20)).toBe('$.first-key');
            });
            
            it('> object > array > string', () => {
                const parser = new JsonCursorPath(fixtures['00-object-simple.json']);
                expect(parser.get(253)).toBe('$.another-object.containing-array[1]');
            });
        });

        describe('jupyter notebook', () => {
            it('> string', () => {
                const parser = new JsonCursorPath(fixtures['01-object-jupyter-notebook.json']);
                expect(parser.get(233331)).toBe('$.cells[21].outputs[1].data.image/png');
            });
        });
    });
});
