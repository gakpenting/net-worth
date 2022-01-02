"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArFSPrivateFileDataPrototype = exports.ArFSPublicFileDataPrototype = exports.ArFSFileDataPrototype = exports.ArFSPrivateFileMetaDataPrototype = exports.ArFSPublicFileMetaDataPrototype = exports.ArFSFileMetaDataPrototype = exports.ArFSPrivateFolderMetaDataPrototype = exports.ArFSPublicFolderMetaDataPrototype = exports.ArFSFolderMetaDataPrototype = exports.ArFSPrivateDriveMetaDataPrototype = exports.ArFSPublicDriveMetaDataPrototype = exports.ArFSDriveMetaDataPrototype = exports.ArFSEntityMetaDataPrototype = exports.ArFSObjectMetadataPrototype = void 0;
const types_1 = require("../types");
class ArFSObjectMetadataPrototype {
    // Implementation should throw if any protected tags are identified
    assertProtectedTags(tags) {
        const protectedTags = this.gqlTags.map((t) => t.name);
        tags.forEach((tag) => {
            if (protectedTags.includes(tag.name)) {
                throw new Error(`Tag ${tag.name} is protected and cannot be used in this context!`);
            }
        });
    }
}
exports.ArFSObjectMetadataPrototype = ArFSObjectMetadataPrototype;
class ArFSEntityMetaDataPrototype extends ArFSObjectMetadataPrototype {
    constructor() {
        super();
        // Get the current time so the app can display the "created" data later on
        this.unixTime = new types_1.UnixTime(Math.round(Date.now() / 1000));
    }
    get gqlTags() {
        return [
            { name: 'Content-Type', value: this.contentType },
            { name: 'Entity-Type', value: this.entityType },
            { name: 'Unix-Time', value: this.unixTime.toString() },
            { name: 'Drive-Id', value: `${this.driveId}` }
        ];
    }
}
exports.ArFSEntityMetaDataPrototype = ArFSEntityMetaDataPrototype;
class ArFSDriveMetaDataPrototype extends ArFSEntityMetaDataPrototype {
    constructor() {
        super(...arguments);
        this.entityType = 'drive';
    }
    get gqlTags() {
        return [...super.gqlTags, { name: 'Drive-Privacy', value: this.privacy }];
    }
}
exports.ArFSDriveMetaDataPrototype = ArFSDriveMetaDataPrototype;
class ArFSPublicDriveMetaDataPrototype extends ArFSDriveMetaDataPrototype {
    constructor(objectData, driveId) {
        super();
        this.objectData = objectData;
        this.driveId = driveId;
        this.privacy = 'public';
        this.contentType = types_1.JSON_CONTENT_TYPE;
    }
}
exports.ArFSPublicDriveMetaDataPrototype = ArFSPublicDriveMetaDataPrototype;
class ArFSPrivateDriveMetaDataPrototype extends ArFSDriveMetaDataPrototype {
    constructor(driveId, objectData) {
        super();
        this.driveId = driveId;
        this.objectData = objectData;
        this.privacy = 'private';
        this.contentType = types_1.PRIVATE_CONTENT_TYPE;
    }
    get gqlTags() {
        return [
            ...super.gqlTags,
            { name: 'Cipher', value: this.objectData.cipher },
            { name: 'Cipher-IV', value: this.objectData.cipherIV },
            { name: 'Drive-Auth-Mode', value: this.objectData.driveAuthMode }
        ];
    }
}
exports.ArFSPrivateDriveMetaDataPrototype = ArFSPrivateDriveMetaDataPrototype;
class ArFSFolderMetaDataPrototype extends ArFSEntityMetaDataPrototype {
    constructor() {
        super(...arguments);
        this.entityType = 'folder';
    }
    get gqlTags() {
        const tags = [...super.gqlTags, { name: 'Folder-Id', value: `${this.folderId}` }];
        if (this.parentFolderId) {
            // Root folder transactions do not have Parent-Folder-Id
            tags.push({ name: 'Parent-Folder-Id', value: `${this.parentFolderId}` });
        }
        return tags;
    }
}
exports.ArFSFolderMetaDataPrototype = ArFSFolderMetaDataPrototype;
class ArFSPublicFolderMetaDataPrototype extends ArFSFolderMetaDataPrototype {
    constructor(objectData, driveId, folderId, parentFolderId) {
        super();
        this.objectData = objectData;
        this.driveId = driveId;
        this.folderId = folderId;
        this.parentFolderId = parentFolderId;
        this.contentType = types_1.JSON_CONTENT_TYPE;
    }
}
exports.ArFSPublicFolderMetaDataPrototype = ArFSPublicFolderMetaDataPrototype;
class ArFSPrivateFolderMetaDataPrototype extends ArFSFolderMetaDataPrototype {
    constructor(driveId, folderId, objectData, parentFolderId) {
        super();
        this.driveId = driveId;
        this.folderId = folderId;
        this.objectData = objectData;
        this.parentFolderId = parentFolderId;
        this.privacy = 'private';
        this.contentType = types_1.PRIVATE_CONTENT_TYPE;
    }
    get gqlTags() {
        return [
            ...super.gqlTags,
            { name: 'Cipher', value: this.objectData.cipher },
            { name: 'Cipher-IV', value: this.objectData.cipherIV }
        ];
    }
}
exports.ArFSPrivateFolderMetaDataPrototype = ArFSPrivateFolderMetaDataPrototype;
class ArFSFileMetaDataPrototype extends ArFSEntityMetaDataPrototype {
    constructor() {
        super(...arguments);
        this.entityType = 'file';
    }
    get gqlTags() {
        return [
            ...super.gqlTags,
            { name: 'File-Id', value: `${this.fileId}` },
            { name: 'Parent-Folder-Id', value: `${this.parentFolderId}` }
        ];
    }
}
exports.ArFSFileMetaDataPrototype = ArFSFileMetaDataPrototype;
class ArFSPublicFileMetaDataPrototype extends ArFSFileMetaDataPrototype {
    constructor(objectData, driveId, fileId, parentFolderId) {
        super();
        this.objectData = objectData;
        this.driveId = driveId;
        this.fileId = fileId;
        this.parentFolderId = parentFolderId;
        this.contentType = types_1.JSON_CONTENT_TYPE;
    }
}
exports.ArFSPublicFileMetaDataPrototype = ArFSPublicFileMetaDataPrototype;
class ArFSPrivateFileMetaDataPrototype extends ArFSFileMetaDataPrototype {
    constructor(objectData, driveId, fileId, parentFolderId) {
        super();
        this.objectData = objectData;
        this.driveId = driveId;
        this.fileId = fileId;
        this.parentFolderId = parentFolderId;
        this.contentType = types_1.PRIVATE_CONTENT_TYPE;
    }
    get gqlTags() {
        return [
            ...super.gqlTags,
            { name: 'Cipher', value: this.objectData.cipher },
            { name: 'Cipher-IV', value: this.objectData.cipherIV }
        ];
    }
}
exports.ArFSPrivateFileMetaDataPrototype = ArFSPrivateFileMetaDataPrototype;
class ArFSFileDataPrototype extends ArFSObjectMetadataPrototype {
    get gqlTags() {
        return [{ name: 'Content-Type', value: this.contentType }];
    }
}
exports.ArFSFileDataPrototype = ArFSFileDataPrototype;
class ArFSPublicFileDataPrototype extends ArFSFileDataPrototype {
    constructor(objectData, contentType) {
        super();
        this.objectData = objectData;
        this.contentType = contentType;
    }
}
exports.ArFSPublicFileDataPrototype = ArFSPublicFileDataPrototype;
class ArFSPrivateFileDataPrototype extends ArFSFileDataPrototype {
    constructor(objectData) {
        super();
        this.objectData = objectData;
        this.contentType = types_1.PRIVATE_CONTENT_TYPE;
    }
    get gqlTags() {
        return [
            ...super.gqlTags,
            { name: 'Cipher', value: this.objectData.cipher },
            { name: 'Cipher-IV', value: this.objectData.cipherIV }
        ];
    }
}
exports.ArFSPrivateFileDataPrototype = ArFSPrivateFileDataPrototype;
