import { ArFSFileMetadataTransactionData } from './arfs_tx_data_types';
import { DriveID, FolderID, FileID, FileKey, DriveKey, TransactionID, Winston } from '../types';
export interface ArFSBundleWriteResult {
    bundleTxId: TransactionID;
    bundleTxReward: Winston;
    metaDataTxId: TransactionID;
}
export declare function isBundleResult(arFSResult: ArFSWriteResult | ArFSBundleWriteResult): arFSResult is ArFSBundleWriteResult;
export interface ArFSWriteResult {
    metaDataTxId: TransactionID;
    metaDataTxReward: Winston;
}
export interface ArFSDriveResult {
    rootFolderTxId: TransactionID;
    driveId: DriveID;
    rootFolderId: FolderID;
}
export declare type ArFSCreateBundledDriveResult = ArFSBundleWriteResult & ArFSDriveResult;
export interface ArFSCreateDriveResult extends ArFSWriteResult, ArFSDriveResult {
    rootFolderTxReward: Winston;
}
export interface ArFSCreateFolderResult extends ArFSWriteResult {
    folderId: FolderID;
}
export interface ArFSUploadFileResult extends ArFSWriteResult {
    dataTxId: TransactionID;
    dataTxReward: Winston;
    fileId: FileID;
}
export declare type ArFSMoveEntityResult = ArFSWriteResult;
export interface ArFSMoveFileResult extends ArFSMoveEntityResult {
    dataTxId: TransactionID;
}
export declare type WithDriveKey = {
    driveKey: DriveKey;
};
declare type WithFileKey = {
    fileKey: FileKey;
};
export declare type ArFSCreatePublicDriveResult = ArFSCreateDriveResult;
export declare type ArFSCreatePrivateDriveResult = ArFSCreateDriveResult & WithDriveKey;
export declare type ArFSCreatePublicBundledDriveResult = ArFSCreateBundledDriveResult;
export declare type ArFSCreatePrivateBundledDriveResult = ArFSCreateBundledDriveResult & WithDriveKey;
export declare type ArFSCreatePublicFolderResult = ArFSCreateFolderResult;
export declare type ArFSCreatePrivateFolderResult = ArFSCreateFolderResult & WithDriveKey;
export declare type ArFSUploadPublicFileResult = ArFSUploadFileResult;
export declare type ArFSUploadPrivateFileResult = ArFSUploadFileResult & WithFileKey;
export declare type ArFSMovePublicFolderResult = ArFSMoveEntityResult;
export declare type ArFSMovePrivateFolderResult = ArFSMoveEntityResult & WithDriveKey;
export declare type ArFSMovePublicFileResult = ArFSMoveFileResult;
export declare type ArFSMovePrivateFileResult = ArFSMoveFileResult & WithFileKey;
export declare type ArFSMoveEntityResultFactory<R extends ArFSMoveEntityResult> = (result: ArFSMoveEntityResult) => R;
export declare type ArFSCreateDriveResultFactory<R extends ArFSCreateDriveResult> = (result: ArFSCreateDriveResult) => R;
export declare type ArFSCreateFolderResultFactory<R extends ArFSCreateFolderResult> = (result: ArFSCreateFolderResult) => R;
export declare type ArFSUploadFileResultFactory<R extends ArFSUploadFileResult, D extends ArFSFileMetadataTransactionData> = (result: ArFSUploadFileResult, txData: D) => R;
export {};
