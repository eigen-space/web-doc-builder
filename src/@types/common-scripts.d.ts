declare module '@eigenspace/helper-scripts' {

    export namespace CommonScripts {

        export function walkThrough(dir: string, callback: Function, recursiveCallback?: Function): void | undefined;
    }
}