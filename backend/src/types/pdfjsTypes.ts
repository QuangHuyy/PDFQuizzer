export type OutlineType = {
    title: string;
    bold: boolean;
    italic: boolean;
    color: Uint8ClampedArray;
    dest: string | Array<any> | null;
    url: string | null;
    unsafeUrl: string | undefined;
    newWindow: boolean | undefined;
    count: number | undefined;
    items: Array<any>;
}