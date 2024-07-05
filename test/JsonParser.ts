import fs from 'fs';
import { JsonParser } from "../src/JsonParser";

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

describe("JsonParser", () => {
    describe('should work with simple objects', () => {
        it('cursor in a string value', () => {
            const parser = new JsonParser(fixtures['00-simple-object.json']);
            expect(parser.getCursorPath(37)).toBe('key2');
        })
    });
});
