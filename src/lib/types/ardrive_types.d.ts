import { TransactionID, AnyEntityID, MakeOptional, ArweaveAddress, Winston, FolderID, DriveID, FileID, FileConflictPrompts, FileNameConflictResolution, FolderConflictPrompts } from '.';
import { WithDriveKey } from '../arfs/arfs_entity_result_factory';
import { ArFSFolderToUpload, ArFSFileToUpload } from '../arfs/arfs_file_wrapper';
import { PrivateDriveKeyData } from '../arfs/arfsdao';
import { PrivateKeyData } from '../arfs/private_key_data';
import { ArFSListPublicFolderParams } from './arfsdao_types';
export declare type ArFSEntityDataType = 'drive' | 'folder' | 'file' | 'bundle';
export interface ArFSEntityData {
    type: ArFSEntityDataType;
    bundleTxId?: TransactionID;
    metadataTxId?: TransactionID;
    dataTxId?: TransactionID;
    entityId?: AnyEntityID;
    key?: string;
}
export declare type ListPublicFolderParams = MakeOptional<ArFSListPublicFolderParams, 'maxDepth' | 'includeRoot' | 'owner'>;
export declare type ListPrivateFolderParams = ListPublicFolderParams & WithDriveKey;
export interface TipData {
    txId: TransactionID;
    recipient: ArweaveAddress;
    winston: Winston;
}
export interface TipResult {
    tipData: TipData;
    reward: Winston;
}
export declare type ArFSFees = {
    [key: string]: Winston;
};
export interface ArFSResult {
    created: ArFSEntityData[];
    tips: TipData[];
    fees: ArFSFees;
}
export interface ArFSManifestResult extends ArFSResult {
    manifest: Manifest | Record<string, never>;
    links: string[];
}
export declare const emptyArFSResult: ArFSResult;
export declare const emptyManifestResult: ArFSManifestResult;
export interface MetaDataBaseCosts {
    metaDataBaseReward: Winston;
}
export interface BulkFileBaseCosts extends MetaDataBaseCosts {
    fileDataBaseReward: Winston;
}
export interface FileUploadBaseCosts extends BulkFileBaseCosts {
    communityWinstonTip: Winston;
}
export interface RecursivePublicBulkUploadParams {
    parentFolderId: FolderID;
    wrappedFolder: ArFSFolderToUpload;
    driveId: DriveID;
    owner: ArweaveAddress;
}
export declare type RecursivePrivateBulkUploadParams = RecursivePublicBulkUploadParams & WithDriveKey;
export interface UploadPublicManifestParams {
    folderId: FolderID;
    maxDepth?: number;
    destManifestName?: string;
    conflictResolution?: FileNameConflictResolution;
    prompts?: FileConflictPrompts;
}
export interface CreatePublicManifestParams extends Required<UploadPublicManifestParams> {
    driveId: DriveID;
    owner: ArweaveAddress;
}
export interface CreatePublicFolderParams {
    folderName: string;
    parentFolderId: FolderID;
    /** @deprecated ArFS cache makes passing driveId here redundant. This parameter makes the api confusing and will no longer used */
    driveId?: DriveID;
}
export declare type CreatePrivateFolderParams = CreatePublicFolderParams & WithDriveKey;
export interface UploadParams {
    parentFolderId: FolderID;
    conflictResolution?: FileNameConflictResolution;
}
export interface BulkPublicUploadParams extends UploadParams {
    wrappedFolder: ArFSFolderToUpload;
    parentFolderId: FolderID;
    prompts?: FolderConflictPrompts;
    destParentFolderName?: string;
}
export declare type BulkPrivateUploadParams = BulkPublicUploadParams & WithDriveKey;
export interface UploadPublicFileParams extends UploadParams {
    wrappedFile: ArFSFileToUpload;
    prompts?: FileConflictPrompts;
    destinationFileName?: string;
}
export declare type UploadPrivateFileParams = UploadPublicFileParams & WithDriveKey;
export interface CommunityTipParams {
    communityWinstonTip: Winston;
    assertBalance?: boolean;
}
interface MoveParams {
    newParentFolderId: FolderID;
}
export interface MovePublicFileParams extends MoveParams {
    fileId: FileID;
}
export declare type MovePrivateFileParams = MovePublicFileParams & WithDriveKey;
export interface MovePublicFolderParams extends MoveParams {
    folderId: FolderID;
}
export declare type MovePrivateFolderParams = MovePublicFolderParams & WithDriveKey;
export interface CreatePublicDriveParams {
    driveName: string;
}
export interface CreatePrivateDriveParams extends CreatePublicDriveParams {
    newPrivateDriveData: PrivateDriveKeyData;
}
interface GetEntityParams {
    owner?: ArweaveAddress;
}
export interface GetPublicDriveParams extends GetEntityParams {
    driveId: DriveID;
}
export declare type GetPrivateDriveParams = GetPublicDriveParams & WithDriveKey;
export interface GetPublicFolderParams extends GetEntityParams {
    folderId: FolderID;
}
export declare type GetPrivateFolderParams = GetPublicFolderParams & WithDriveKey;
export interface GetPublicFileParams extends GetEntityParams {
    fileId: FileID;
}
export declare type GetPrivateFileParams = GetPublicFileParams & WithDriveKey;
export interface GetAllDrivesForAddressParams {
    address: ArweaveAddress;
    privateKeyData: PrivateKeyData;
}
export interface ManifestPathMap {
    [index: string]: {
        id: string;
    };
}
export interface Manifest {
    /** manifest must be 'arweave/paths' */
    manifest: 'arweave/paths';
    /** version must be 0.1.0 */
    version: '0.1.0';
    /** index contains the default path that will redirected when the user access the manifest transaction itself */
    index: {
        path: string;
    };
    /** paths is an object of path objects */
    paths: ManifestPathMap;
}
export interface DownloadPublicFileArguments {
    fileId: FileID;
    destFolderPath: string;
    defaultFileName?: string;
}
export declare type DownloadPrivateFileParameters = DownloadPublicFileArguments & WithDriveKey;
export {};
