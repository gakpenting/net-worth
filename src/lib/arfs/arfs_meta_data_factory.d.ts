/// <reference types="node" />
import { ArFSDriveMetaDataPrototype, ArFSEntityMetaDataPrototype, ArFSFileDataPrototype, ArFSFileMetaDataPrototype, ArFSFolderMetaDataPrototype } from './arfs_prototypes';
import { ArFSFileMetadataTransactionData } from './arfs_tx_data_types';
import { DataContentType, DriveID, FileID, FolderID, ByteCount, TransactionID, UnixTime } from '../types';
export declare type MoveEntityMetaDataFactory = () => ArFSEntityMetaDataPrototype;
export declare type FolderMetaDataFactory = (folderId: FolderID, parentFolderId?: FolderID) => ArFSFolderMetaDataPrototype;
export declare type FileDataPrototypeFactory = (desfileData: Buffer, dataContentType: DataContentType, fileId: FileID) => Promise<ArFSFileDataPrototype>;
export declare type FileMetadataTxDataFactory<D extends ArFSFileMetadataTransactionData> = (destinationFileName: string, fileSize: ByteCount, lastModifiedDateMS: UnixTime, dataTxId: TransactionID, dataContentType: DataContentType, fileId: FileID) => Promise<D>;
export declare type FileMetaDataFactory<D extends ArFSFileMetadataTransactionData> = (metadataTxData: D, fileId: FileID) => ArFSFileMetaDataPrototype;
export declare type CreateDriveMetaDataFactory = (driveID: DriveID, rootFolderId: FolderID) => Promise<ArFSDriveMetaDataPrototype>;
