/// <reference types="node" />
import { Stats } from 'fs';
import { Duplex, Readable } from 'stream';
import { ByteCount, DataContentType, UnixTime, FileID, FolderID, Manifest, TransactionID } from '../types';
import { ArFSPrivateFile, ArFSPublicFile } from './arfs_entities';
import { BulkFileBaseCosts, MetaDataBaseCosts, errorOnConflict, skipOnConflicts, upsertOnConflicts } from '../types';
import { ArFSPublicFileOrFolderWithPaths } from './arfs_entities';
declare type BaseFileName = string;
declare type FilePath = string;
export interface FileInfo {
    dataContentType: DataContentType;
    lastModifiedDateMS: UnixTime;
    fileSize: ByteCount;
}
/**
 * Reads stats of a file or folder  and constructs a File or Folder wrapper class
 *
 * @remarks import and use `isFolder` type-guard to later determine whether a folder or file
 *
 * @example
 *
 * const fileOrFolder = wrapFileOrFolder(myFilePath);
 *
 * if (isFolder(fileOrFolder)) {
 * 	// Type is: Folder
 * } else {
 * 	// Type is: File
 * }
 *
 */
export declare function wrapFileOrFolder(fileOrFolderPath: FilePath): ArFSFileToUpload | ArFSFolderToUpload;
/** Type-guard function to determine if returned class is a File or Folder */
export declare function isFolder(fileOrFolder: ArFSFileToUpload | ArFSFolderToUpload): fileOrFolder is ArFSFolderToUpload;
export declare abstract class ArFSEntityToUpload {
    abstract gatherFileInfo(): FileInfo;
    abstract getFileDataBuffer(): Buffer;
    abstract getBaseFileName(): BaseFileName;
    abstract lastModifiedDate: UnixTime;
    existingId?: FileID;
    newFileName?: string;
    conflictResolution?: FileConflictResolution;
}
export declare class ArFSManifestToUpload extends ArFSEntityToUpload {
    readonly folderToGenManifest: ArFSPublicFileOrFolderWithPaths[];
    readonly destManifestName: string;
    manifest: Manifest;
    lastModifiedDateMS: UnixTime;
    constructor(folderToGenManifest: ArFSPublicFileOrFolderWithPaths[], destManifestName: string);
    getLinksOutput(dataTxId: TransactionID): string[];
    gatherFileInfo(): FileInfo;
    getBaseFileName(): BaseFileName;
    getFileDataBuffer(): Buffer;
    get size(): ByteCount;
    get lastModifiedDate(): UnixTime;
}
export declare type FolderConflictResolution = typeof skipOnConflicts | undefined;
export declare type FileConflictResolution = FolderConflictResolution | typeof upsertOnConflicts | typeof errorOnConflict;
export declare class ArFSFileToUpload extends ArFSEntityToUpload {
    readonly filePath: FilePath;
    readonly fileStats: Stats;
    constructor(filePath: FilePath, fileStats: Stats);
    baseCosts?: BulkFileBaseCosts;
    gatherFileInfo(): FileInfo;
    get size(): ByteCount;
    get lastModifiedDate(): UnixTime;
    getBaseCosts(): BulkFileBaseCosts;
    getFileDataBuffer(): Buffer;
    get contentType(): DataContentType;
    getBaseFileName(): BaseFileName;
    /** Computes the size of a private file encrypted with AES256-GCM */
    encryptedDataSize(): ByteCount;
}
export declare class ArFSFolderToUpload {
    readonly filePath: FilePath;
    readonly fileStats: Stats;
    files: ArFSFileToUpload[];
    folders: ArFSFolderToUpload[];
    baseCosts?: MetaDataBaseCosts;
    existingId?: FolderID;
    newFolderName?: string;
    conflictResolution: FolderConflictResolution;
    constructor(filePath: FilePath, fileStats: Stats);
    getBaseCosts(): MetaDataBaseCosts;
    getBaseFileName(): BaseFileName;
    getTotalByteCount(encrypted?: boolean): ByteCount;
}
export declare abstract class ArFSFileToDownload {
    readonly fileEntity: ArFSPublicFile | ArFSPrivateFile;
    readonly dataStream: Readable;
    readonly localFilePath: string;
    constructor(fileEntity: ArFSPublicFile | ArFSPrivateFile, dataStream: Readable, localFilePath: string);
    abstract write(): Promise<void>;
    protected setLastModifiedDate: () => void;
}
export declare class ArFSPublicFileToDownload extends ArFSFileToDownload {
    constructor(fileEntity: ArFSPublicFile, dataStream: Readable, localFilePath: string);
    write(): Promise<void>;
}
export declare class ArFSPrivateFileToDownload extends ArFSFileToDownload {
    private readonly decryptingStream;
    constructor(fileEntity: ArFSPrivateFile, dataStream: Readable, localFilePath: string, decryptingStream: Duplex);
    write(): Promise<void>;
}
export {};
