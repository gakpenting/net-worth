/// <reference types="node" />
import Arweave from 'arweave';
import { JWKInterface } from 'arweave/node/lib/wallet';
import Transaction from 'arweave/node/lib/transaction';
import { ArFSFileOrFolderBuilder } from './arfs_builders/arfs_builders';
import { ArFSFileOrFolderEntity, ArFSPrivateDrive, ArFSPublicFile, ArFSPrivateFile, ArFSPublicFolder, ArFSPrivateFolder, ArFSPrivateFileOrFolderWithPaths } from './arfs_entities';
import { ArFSCreateFolderResult, ArFSCreatePrivateDriveResult, ArFSMoveEntityResult, ArFSMoveEntityResultFactory, ArFSMovePublicFileResult, ArFSMovePrivateFileResult, ArFSMovePublicFolderResult, ArFSMovePrivateFolderResult, ArFSUploadFileResult, ArFSUploadFileResultFactory, ArFSUploadPrivateFileResult, ArFSCreatePrivateBundledDriveResult, ArFSCreatePublicDriveResult, ArFSCreatePublicBundledDriveResult } from './arfs_entity_result_factory';
import { ArFSEntityToUpload } from './arfs_file_wrapper';
import { MoveEntityMetaDataFactory, FileDataPrototypeFactory, FileMetadataTxDataFactory, FileMetaDataFactory } from './arfs_meta_data_factory';
import { ArFSPublicFolderTransactionData, ArFSPrivateFolderTransactionData, ArFSPublicFileMetadataTransactionData, ArFSPrivateFileMetadataTransactionData, ArFSFileMetadataTransactionData } from './arfs_tx_data_types';
import { ArFSDAOAnonymous } from './arfsdao_anonymous';
import { ArweaveAddress, GQLNodeInterface, DriveID, DriveKey, FolderID, RewardSettings, FileID, TransactionID, CipherIV } from '../types';
import { NameConflictInfo } from '../utils/mapper_functions';
import { Wallet } from '../wallet';
import { DataItem } from 'arbundles';
import { ArFSPrivateCreateFolderParams, ArFSPublicCreateFolderParams, ArFSCreatePublicDriveParams, ArFSCreatePrivateDriveParams, ArFSMoveParams, ArFSUploadPublicFileParams, ArFSUploadPrivateFileParams, ArFSPrepareObjectTransactionParams, ArFSAllPrivateFoldersOfDriveParams, ArFSGetPrivateChildFolderIdsParams, ArFSGetPublicChildFolderIdsParams, ArFSListPrivateFolderParams, ArFSPrepareDataItemsParams, ArFSPrepareObjectBundleParams } from '../types/arfsdao_types';
import { ArFSTagSettings } from './arfs_tag_settings';
import { Readable } from 'stream';
import { CipherIVQueryResult } from '../types/cipher_iv_query_result';
/** Utility class for holding the driveId and driveKey of a new drive */
export declare class PrivateDriveKeyData {
    readonly driveId: DriveID;
    readonly driveKey: DriveKey;
    private constructor();
    static from(drivePassword: string, privateKey: JWKInterface): Promise<PrivateDriveKeyData>;
}
export declare class ArFSDAO extends ArFSDAOAnonymous {
    private readonly wallet;
    private readonly dryRun;
    /** @deprecated App Name should be provided with ArFSTagSettings  */
    protected appName: string;
    /** @deprecated App Version should be provided with ArFSTagSettings  */
    protected appVersion: any;
    protected readonly arFSTagSettings: ArFSTagSettings;
    constructor(wallet: Wallet, arweave: Arweave, dryRun?: boolean, 
    /** @deprecated App Name should be provided with ArFSTagSettings  */
    appName?: string, 
    /** @deprecated App Version should be provided with ArFSTagSettings  */
    appVersion?: any, arFSTagSettings?: ArFSTagSettings);
    /** Prepare an ArFS folder entity for upload */
    private prepareFolder;
    /** Create a single folder as a V2 transaction */
    private createFolder;
    /** Create a single private folder as a V2 transaction */
    createPrivateFolder({ driveId, rewardSettings, parentFolderId, folderData }: ArFSPrivateCreateFolderParams): Promise<ArFSCreateFolderResult>;
    /** Create a single public folder as a V2 transaction */
    createPublicFolder({ driveId, rewardSettings, parentFolderId, folderData }: ArFSPublicCreateFolderParams): Promise<ArFSCreateFolderResult>;
    /** Prepare an ArFS drive entity for upload */
    private prepareDrive;
    /** Create drive and root folder together as bundled transaction */
    private createBundledDrive;
    /** Create drive and root folder as separate V2 transactions */
    private createV2TxDrive;
    /**
     * Create drive and root folder as a V2 transaction
     * OR a direct to network bundled transaction
     *
     * @remarks To bundle or not is determined during cost estimation,
     * and the provided rewardSettings will be type checked here to
     * determine the result type
     */
    private createDrive;
    /** Create an ArFS public drive */
    createPublicDrive({ driveName, rewardSettings }: ArFSCreatePublicDriveParams): Promise<ArFSCreatePublicDriveResult | ArFSCreatePublicBundledDriveResult>;
    /** Create an ArFS private drive */
    createPrivateDrive({ driveName, rewardSettings, newDriveData }: ArFSCreatePrivateDriveParams): Promise<ArFSCreatePrivateDriveResult | ArFSCreatePrivateBundledDriveResult>;
    moveEntity<R extends ArFSMoveEntityResult>(metaDataBaseReward: RewardSettings, metaDataFactory: MoveEntityMetaDataFactory, resultFactory: ArFSMoveEntityResultFactory<R>): Promise<R>;
    movePublicFile({ metaDataBaseReward, originalMetaData, transactionData, newParentFolderId }: ArFSMoveParams<ArFSPublicFile, ArFSPublicFileMetadataTransactionData>): Promise<ArFSMovePublicFileResult>;
    movePrivateFile({ metaDataBaseReward, originalMetaData, transactionData, newParentFolderId }: ArFSMoveParams<ArFSPrivateFile, ArFSPrivateFileMetadataTransactionData>): Promise<ArFSMovePrivateFileResult>;
    movePublicFolder({ metaDataBaseReward, originalMetaData, transactionData, newParentFolderId }: ArFSMoveParams<ArFSPublicFolder, ArFSPublicFolderTransactionData>): Promise<ArFSMovePublicFolderResult>;
    movePrivateFolder({ metaDataBaseReward, originalMetaData, transactionData, newParentFolderId }: ArFSMoveParams<ArFSPrivateFolder, ArFSPrivateFolderTransactionData>): Promise<ArFSMovePrivateFolderResult>;
    uploadFile<R extends ArFSUploadFileResult, D extends ArFSFileMetadataTransactionData>(wrappedFile: ArFSEntityToUpload, fileDataRewardSettings: RewardSettings, metadataRewardSettings: RewardSettings, dataPrototypeFactoryFn: FileDataPrototypeFactory, metadataTxDataFactoryFn: FileMetadataTxDataFactory<D>, metadataFactoryFn: FileMetaDataFactory<D>, resultFactoryFn: ArFSUploadFileResultFactory<R, D>, destFileName?: string, existingFileId?: FileID): Promise<R>;
    uploadPublicFile({ parentFolderId, wrappedFile, driveId, fileDataRewardSettings, metadataRewardSettings, destFileName, existingFileId }: ArFSUploadPublicFileParams): Promise<ArFSUploadFileResult>;
    uploadPrivateFile({ parentFolderId, wrappedFile, driveId, driveKey, fileDataRewardSettings, metadataRewardSettings, destFileName, existingFileId }: ArFSUploadPrivateFileParams): Promise<ArFSUploadPrivateFileResult>;
    prepareArFSDataItem({ objectMetaData, excludedTagNames, otherTags }: ArFSPrepareDataItemsParams): Promise<DataItem>;
    prepareArFSObjectBundle({ dataItems, rewardSettings, excludedTagNames, otherTags }: ArFSPrepareObjectBundleParams): Promise<Transaction>;
    prepareArFSObjectTransaction({ objectMetaData, rewardSettings, excludedTagNames, otherTags }: ArFSPrepareObjectTransactionParams): Promise<Transaction>;
    sendTransactionsAsChunks(transactions: Transaction[]): Promise<void>;
    getPrivateDrive(driveId: DriveID, driveKey: DriveKey, owner: ArweaveAddress): Promise<ArFSPrivateDrive>;
    getPrivateFolder(folderId: FolderID, driveKey: DriveKey, owner: ArweaveAddress): Promise<ArFSPrivateFolder>;
    getPrivateFile(fileId: FileID, driveKey: DriveKey, owner: ArweaveAddress): Promise<ArFSPrivateFile>;
    getAllFoldersOfPrivateDrive({ driveId, driveKey, owner, latestRevisionsOnly }: ArFSAllPrivateFoldersOfDriveParams): Promise<ArFSPrivateFolder[]>;
    getPrivateFilesWithParentFolderIds(folderIDs: FolderID[], driveKey: DriveKey, owner: ArweaveAddress, latestRevisionsOnly?: boolean): Promise<ArFSPrivateFile[]>;
    getEntitiesInFolder(parentFolderId: FolderID, builder: (node: GQLNodeInterface, entityType: 'file' | 'folder') => ArFSFileOrFolderBuilder<ArFSFileOrFolderEntity>, latestRevisionsOnly?: boolean, filterOnOwner?: boolean): Promise<ArFSFileOrFolderEntity[]>;
    getPrivateEntitiesInFolder(parentFolderId: FolderID, driveKey: DriveKey, latestRevisionsOnly?: boolean): Promise<ArFSFileOrFolderEntity[]>;
    getPublicEntitiesInFolder(parentFolderId: FolderID, latestRevisionsOnly?: boolean): Promise<ArFSFileOrFolderEntity[]>;
    getChildrenFolderIds(folderId: FolderID, allFolderEntitiesOfDrive: ArFSFileOrFolderEntity[]): Promise<FolderID[]>;
    getPrivateEntityNamesInFolder(folderId: FolderID, driveKey: DriveKey): Promise<string[]>;
    getPublicEntityNamesInFolder(folderId: FolderID): Promise<string[]>;
    getPublicNameConflictInfoInFolder(folderId: FolderID): Promise<NameConflictInfo>;
    getPrivateNameConflictInfoInFolder(folderId: FolderID, driveKey: DriveKey): Promise<NameConflictInfo>;
    getPrivateChildrenFolderIds({ folderId, driveId, driveKey, owner }: ArFSGetPrivateChildFolderIdsParams): Promise<FolderID[]>;
    getPublicChildrenFolderIds({ folderId, owner, driveId }: ArFSGetPublicChildFolderIdsParams): Promise<FolderID[]>;
    getOwnerAndAssertDrive(driveId: DriveID, driveKey?: DriveKey): Promise<ArweaveAddress>;
    /**
     * Lists the children of certain private folder
     * @param {FolderID} folderId the folder ID to list children of
     * @param {DriveKey} driveKey the drive key used for drive and folder data decryption and file key derivation
     * @param {number} maxDepth a non-negative integer value indicating the depth of the folder tree to list where 0 = this folder's contents only
     * @param {boolean} includeRoot whether or not folderId's folder data should be included in the listing
     * @returns {ArFSPrivateFileOrFolderWithPaths[]} an array representation of the children and parent folder
     */
    listPrivateFolder({ folderId, driveKey, maxDepth, includeRoot, owner }: ArFSListPrivateFolderParams): Promise<ArFSPrivateFileOrFolderWithPaths[]>;
    assertValidPassword(password: string): Promise<void>;
    getPrivateTransactionCipherIV(txId: TransactionID): Promise<CipherIV>;
    getCipherIVOfPrivateTransactionIDs(txIDs: TransactionID[]): Promise<CipherIVQueryResult[]>;
    /**
     * Returns the data stream of a private file
     * @param privateFile - the entity of the data to be download
     * @returns {Promise<Readable>}
     */
    getPrivateDataStream(privateFile: ArFSPrivateFile): Promise<Readable>;
    getAuthTagForPrivateFile(privateFile: ArFSPrivateFile): Promise<Buffer>;
}
