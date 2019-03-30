export class ArgsParser {

    static get(rawArgs: string[]): Map<string, string[]> {
        const params = new Map();
        rawArgs.map((arg, index) => arg.match(/^-+.*/g) ? index : null)
            .filter(keyPosition => keyPosition !== null)
            .forEach((keyPosition, index, arr) => {
                // @ts-ignore
                const key = rawArgs[keyPosition].match(/^-+(.*)/);
                // @ts-ignore
                params.set(key[1], rawArgs.slice(keyPosition + 1, arr[index + 1]));
            });

        return params;
    }
}
