export declare type UnionOfObjectPropertiesType<T extends {
    [key: string]: string | number;
}> = T[keyof T];
