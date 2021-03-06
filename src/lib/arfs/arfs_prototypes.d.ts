import { ArFSDriveTransactionData, ArFSFileDataTransactionData, ArFSFileMetadataTransactionData, ArFSFolderTransactionData, ArFSObjectTransactionData, ArFSPrivateDriveTransactionData, ArFSPrivateFileDataTransactionData, ArFSPrivateFileMetadataTransactionData, ArFSPrivateFolderTransactionData, ArFSPublicDriveTransactionData, ArFSPublicFileDataTransactionData, ArFSPublicFileMetadataTransactionData, ArFSPublicFolderTransactionData } from './arfs_tx_data_types';
import { DataContentType, DriveID, FileID, FolderID, PRIVATE_CONTENT_TYPE, UnixTime, ContentType, DrivePrivacy, GQLTagInterface, EntityType } from '../types';
export declare abstract class ArFSObjectMetadataPrototype {
    abstract gqlTags: GQLTagInterface[];
    abstract objectData: ArFSObjectTransactionData;
    assertProtectedTags(tags: GQLTagInterface[]): void;
}
export declare abstract class ArFSEntityMetaDataPrototype extends ArFSObjectMetadataPrototype {
    readonly unixTime: UnixTime;
    abstract readonly contentType: ContentType;
    abstract readonly entityType: EntityType;
    abstract readonly driveId: DriveID;
    constructor();
    get gqlTags(): GQLTagInterface[];
}
export declare abstract class ArFSDriveMetaDataPrototype extends ArFSEntityMetaDataPrototype {
    abstract driveId: DriveID;
    abstract objectData: ArFSDriveTransactionData;
    abstract readonly privacy: DrivePrivacy;
    readonly entityType: EntityType;
    get gqlTags(): GQLTagInterface[];
}
export declare class ArFSPublicDriveMetaDataPrototype extends ArFSDriveMetaDataPrototype {
    readonly objectData: ArFSPublicDriveTransactionData;
    readonly driveId: DriveID;
    readonly privacy: DrivePrivacy;
    readonly contentType: ContentType;
    constructor(objectData: ArFSPublicDriveTransactionData, driveId: DriveID);
}
export declare class ArFSPrivateDriveMetaDataPrototype extends ArFSDriveMetaDataPrototype {
    readonly driveId: DriveID;
    readonly objectData: ArFSPrivateDriveTransactionData;
    readonly privacy: DrivePrivacy;
    readonly contentType: ContentType;
    constructor(driveId: DriveID, objectData: ArFSPrivateDriveTransactionData);
    get gqlTags(): GQLTagInterface[];
}
export declare abstract class ArFSFolderMetaDataPrototype extends ArFSEntityMetaDataPrototype {
    abstract driveId: DriveID;
    abstract folderId: FolderID;
    abstract objectData: ArFSFolderTransactionData;
    abstract parentFolderId?: FolderID;
    abstract readonly contentType: ContentType;
    readonly entityType: EntityType;
    get gqlTags(): GQLTagInterface[];
}
export declare class ArFSPublicFolderMetaDataPrototype extends ArFSFolderMetaDataPrototype {
    readonly objectData: ArFSPublicFolderTransactionData;
    readonly driveId: DriveID;
    readonly folderId: FolderID;
    readonly parentFolderId?: import("../types").EntityID | undefined;
    readonly contentType: ContentType;
    constructor(objectData: ArFSPublicFolderTransactionData, driveId: DriveID, folderId: FolderID, parentFolderId?: import("../types").EntityID | undefined);
}
export declare class ArFSPrivateFolderMetaDataPrototype extends ArFSFolderMetaDataPrototype {
    readonly driveId: DriveID;
    readonly folderId: FolderID;
    readonly objectData: ArFSPrivateFolderTransactionData;
    readonly parentFolderId?: import("../types").EntityID | undefined;
    readonly privacy: DrivePrivacy;
    readonly contentType: ContentType;
    constructor(driveId: DriveID, folderId: FolderID, objectData: ArFSPrivateFolderTransactionData, parentFolderId?: import("../types").EntityID | undefined);
    get gqlTags(): GQLTagInterface[];
}
export declare abstract class ArFSFileMetaDataPrototype extends ArFSEntityMetaDataPrototype {
    abstract driveId: DriveID;
    abstract fileId: FileID;
    abstract objectData: ArFSFileMetadataTransactionData;
    abstract parentFolderId: FolderID;
    abstract contentType: ContentType;
    readonly entityType: EntityType;
    get gqlTags(): GQLTagInterface[];
}
export declare class ArFSPublicFileMetaDataPrototype extends ArFSFileMetaDataPrototype {
    readonly objectData: ArFSPublicFileMetadataTransactionData;
    readonly driveId: DriveID;
    readonly fileId: FileID;
    readonly parentFolderId: FolderID;
    readonly contentType: ContentType;
    constructor(objectData: ArFSPublicFileMetadataTransactionData, driveId: DriveID, fileId: FileID, parentFolderId: FolderID);
}
export declare class ArFSPrivateFileMetaDataPrototype extends ArFSFileMetaDataPrototype {
    readonly objectData: ArFSPrivateFileMetadataTransactionData;
    readonly driveId: DriveID;
    readonly fileId: FileID;
    readonly parentFolderId: FolderID;
    readonly contentType: ContentType;
    constructor(objectData: ArFSPrivateFileMetadataTransactionData, driveId: DriveID, fileId: FileID, parentFolderId: FolderID);
    get gqlTags(): GQLTagInterface[];
}
export declare abstract class ArFSFileDataPrototype extends ArFSObjectMetadataPrototype {
    abstract readonly objectData: ArFSFileDataTransactionData;
    abstract readonly contentType: DataContentType | typeof PRIVATE_CONTENT_TYPE;
    get gqlTags(): GQLTagInterface[];
}
export declare class ArFSPublicFileDataPrototype extends ArFSFileDataPrototype {
    readonly objectData: ArFSPublicFileDataTransactionData;
    readonly contentType: DataContentType;
    constructor(objectData: ArFSPublicFileDataTransactionData, contentType: DataContentType);
}
export declare class ArFSPrivateFileDataPrototype extends ArFSFileDataPrototype {
    readonly objectData: ArFSPrivateFileDataTransactionData;
    readonly contentType = "application/octet-stream";
    constructor(objectData: ArFSPrivateFileDataTransactionData);
    get gqlTags(): GQLTagInterface[];
}
