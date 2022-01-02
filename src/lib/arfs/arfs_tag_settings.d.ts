import { GQLTagInterface, TipType } from '../types';
interface ArFSTagSettingsParams {
    appName?: string;
    appVersion?: string;
    arFSVersion?: string;
}
export declare class ArFSTagSettings {
    private readonly appName;
    private readonly appVersion;
    private readonly arFSVersion;
    constructor({ appName, appVersion, arFSVersion }: ArFSTagSettingsParams);
    get baseAppTags(): GQLTagInterface[];
    get baseArFSTags(): GQLTagInterface[];
    get baseBundleTags(): GQLTagInterface[];
    getTipTags(tipType?: TipType): GQLTagInterface[];
    baseArFSTagsIncluding({ tags, excludedTagNames }: TagAssembleParams): GQLTagInterface[];
    baseBundleTagsIncluding({ tags, excludedTagNames }: TagAssembleParams): GQLTagInterface[];
    private assembleTags;
    assertTagLimits(tags: GQLTagInterface[]): void;
    private filterExcludedTagNames;
}
interface TagAssembleParams {
    tags?: GQLTagInterface[];
    excludedTagNames?: string[];
}
export {};
