"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArFSTagSettings = void 0;
const constants_1 = require("../utils/constants");
// Tag Limits to be in compliance with ANS-104:
// https://github.com/joshbenaron/arweave-standards/blob/ans104/ans/ANS-104.md#21-verifying-a-dataitem
const MAX_TAG_LIMIT = 128;
const TAG_NAME_BYTE_LIMIT = 1024;
const TAG_VALUE_BYTE_LIMIT = 3072;
const TAG_KEY_LIMIT = 2;
class ArFSTagSettings {
    constructor({ appName = constants_1.DEFAULT_APP_NAME, appVersion = constants_1.DEFAULT_APP_VERSION, arFSVersion = constants_1.CURRENT_ARFS_VERSION }) {
        this.appName = appName;
        this.appVersion = appVersion;
        this.arFSVersion = arFSVersion;
        this.assertTagLimits(this.baseArFSTags);
    }
    get baseAppTags() {
        return [
            { name: 'App-Name', value: this.appName },
            { name: 'App-Version', value: this.appVersion }
        ];
    }
    get baseArFSTags() {
        return [...this.baseAppTags, { name: 'ArFS', value: this.arFSVersion }];
    }
    get baseBundleTags() {
        return [
            ...this.baseAppTags,
            { name: 'Bundle-Format', value: 'binary' },
            { name: 'Bundle-Version', value: '2.0.0' }
        ];
    }
    getTipTags(tipType = 'data upload') {
        return [...this.baseAppTags, { name: 'Type', value: 'fee' }, { name: 'Tip-Type', value: tipType }];
    }
    baseArFSTagsIncluding({ tags = [], excludedTagNames = [] }) {
        tags = [...this.baseArFSTags, ...tags];
        return this.assembleTags({ tags, excludedTagNames });
    }
    baseBundleTagsIncluding({ tags = [], excludedTagNames = [] }) {
        tags = [...this.baseBundleTags, ...tags];
        return this.assembleTags({ tags, excludedTagNames });
    }
    assembleTags({ tags = [], excludedTagNames = [] }) {
        tags = this.filterExcludedTagNames({ tags, excludedTagNames });
        this.assertTagLimits(tags);
        return tags;
    }
    assertTagLimits(tags) {
        if (tags.length > MAX_TAG_LIMIT) {
            throw new Error(`Amount of GQL Tags (${tags.length}) exceeds the maximum limit allowed (${MAX_TAG_LIMIT})!`);
        }
        for (const tag of tags) {
            if (Object.keys(tag).length > TAG_KEY_LIMIT) {
                throw new Error('GQL tag has too many keys, tags must only have "name" and "value" fields!');
            }
            if (tag.name.length > TAG_NAME_BYTE_LIMIT) {
                throw new Error(`GQL tag "name" field byte size (${tag.name.length}) has exceeded the maximum byte limit allowed of ${TAG_NAME_BYTE_LIMIT}!`);
            }
            if (tag.value.length > TAG_VALUE_BYTE_LIMIT) {
                throw new Error(`GQL tag "value" field byte size (${tag.value.length}) has exceeded the maximum byte limit allowed of ${TAG_VALUE_BYTE_LIMIT}!`);
            }
            if (tag.name.length < 1 || typeof tag.name !== 'string') {
                throw new Error('GQL tag "name" must be a non-empty string!');
            }
            if (tag.value.length < 1 || typeof tag.value !== 'string') {
                throw new Error('GQL tag "value" must be a non-empty string!');
            }
        }
    }
    filterExcludedTagNames({ tags = [], excludedTagNames = [] }) {
        return tags.filter((tag) => !excludedTagNames.includes(tag.name));
    }
}
exports.ArFSTagSettings = ArFSTagSettings;
