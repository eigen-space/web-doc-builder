import { ArgsParser } from './args-parser';

describe('ArgsParser', () => {

    it('should correct parse empty args', () => {
        expect(ArgsParser.get([])).toEqual(new Map());
    });

    it('should filter args without key', () => {
        expect(ArgsParser.get(['cat', 'dog'])).toEqual(new Map());
        expect(ArgsParser.get(['cat', '-animal', 'dog'])).toEqual(new Map([['animal', ['dog']]]));
    });

    it('should parse keys starting with a hyphen', () => {
        expect(ArgsParser.get(['-animal', 'dog'])).toEqual(new Map([['animal', ['dog']]]));
        expect(ArgsParser.get(['--animal', 'dog'])).toEqual(new Map([['animal', ['dog']]]));
        expect(ArgsParser.get(['ani-mal', 'dog'])).toEqual(new Map());
    });
});
