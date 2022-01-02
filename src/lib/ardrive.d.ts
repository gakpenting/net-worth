import { ArDriveAnonymous } from './ardrive_anonymous';
import { ArFSPrivateDrive, ArFSPrivateFolder, ArFSPrivateFile, ArFSPrivateFileOrFolderWithPaths } from './arfs/arfs_entities';
import { ArFSFolderToUpload } from './arfs/arfs_file_wrapper';
import { ArFSFileMetadataTransactionData, ArFSObjectTransactionData } from './arfs/arfs_tx_data_types';
import { ArFSDAO } from './arfs/arfsdao';
import { CommunityOracle } from './community/community_oracle';
import { ARDataPriceEstimator } from './pricing/ar_data_price_estimator';
import { FeeMultiple, ArweaveAddress, ByteCount, FolderID, DriveKey, Winston, DrivePrivacy, FileID, DriveID, UploadPublicFileParams, UploadPrivateFileParams, ArFSManifestResult, UploadPublicManifestParams, DownloadPrivateFileParameters } from './types';
import { CommunityTipParams, TipResult, MovePublicFileParams, ArFSResult, MovePrivateFileParams, MovePublicFolderParams, MovePrivateFolderParams, BulkPublicUploadParams, RecursivePublicBulkUploadParams, ArFSEntityData, ArFSFees, BulkPrivateUploadParams, RecursivePrivateBulkUploadParams, CreatePublicFolderParams, CreatePrivateFolderParams, CreatePublicDriveParams, CreatePrivateDriveParams, GetPrivateDriveParams, GetPrivateFolderParams, GetPrivateFileParams, ListPrivateFolderParams, MetaDataBaseCosts, FileUploadBaseCosts } from './types';
import { Wallet } from './wallet';
import { WalletDAO } from './wallet_dao';
import { ArFSUploadPlanner } from './arfs/arfs_upload_planner';
import { ArFSTagSettings } from './arfs/arfs_tag_settings';
export declare class ArDrive extends ArDriveAnonymous {
    private readonly wallet;
    private readonly walletDao;
    protected readonly arFsDao: ArFSDAO;
    private readonly communityOracle;
    /** @deprecated App Name should be provided with ArFSTagSettings  */
    protected readonly appName: string;
    /** @deprecated App Version should be provided with ArFSTagSettings  */
    protected readonly appVersion: string;
    private readonly priceEstimator;
    private readonly feeMultiple;
    private readonly dryRun;
    private readonly arFSTagSettings;
    private readonly uploadPlanner;
    constructor(wallet: Wallet, walletDao: WalletDAO, arFsDao: ArFSDAO, communityOracle: CommunityOracle, 
    /** @deprecated App Name should be provided with ArFSTagSettings  */
    appName?: string, 
    /** @deprecated App Version should be provided with ArFSTagSettings  */
    appVersion?: string, priceEstimator?: ARDataPriceEstimator, feeMultiple?: FeeMultiple, dryRun?: boolean, arFSTagSettings?: ArFSTagSettings, uploadPlanner?: ArFSUploadPlanner);
    sendCommunityTip({ communityWinstonTip, assertBalance }: CommunityTipParams): Promise<TipResult>;
    movePublicFile({ fileId, newParentFolderId }: MovePublicFileParams): Promise<ArFSResult>;
    movePrivateFile({ fileId, newParentFolderId, driveKey }: MovePrivateFileParams): Promise<ArFSResult>;
    movePublicFolder({ folderId, newParentFolderId }: MovePublicFolderParams): Promise<ArFSResult>;
    movePrivateFolder({ folderId, newParentFolderId, driveKey }: MovePrivateFolderParams): Promise<ArFSResult>;
    uploadPublicFile({ parentFolderId, wrappedFile, destinationFileName, conflictResolution, prompts }: UploadPublicFileParams): Promise<ArFSResult>;
    createPublicFolderAndUploadChildren({ parentFolderId, wrappedFolder, destParentFolderName, conflictResolution, prompts }: BulkPublicUploadParams): Promise<ArFSResult>;
    protected recursivelyCreatePublicFolderAndUploadChildren({ parentFolderId, wrappedFolder, driveId, owner }: RecursivePublicBulkUploadParams): Promise<{
        entityResults: ArFSEntityData[];
        feeResults: ArFSFees;
    }>;
    uploadPrivateFile({ parentFolderId, wrappedFile, driveKey, destinationFileName, conflictResolution, prompts }: UploadPrivateFileParams): Promise<ArFSResult>;
    createPrivateFolderAndUploadChildren({ parentFolderId, wrappedFolder, driveKey, destParentFolderName, conflictResolution, prompts }: BulkPrivateUploadParams): Promise<ArFSResult>;
    protected recursivelyCreatePrivateFolderAndUploadChildren({ wrappedFolder, driveId, parentFolderId, driveKey, owner }: RecursivePrivateBulkUploadParams): Promise<{
        entityResults: ArFSEntityData[];
        feeResults: ArFSFees;
    }>;
    uploadPublicManifest({ folderId, destManifestName, maxDepth, conflictResolution, prompts }: UploadPublicManifestParams): Promise<ArFSManifestResult>;
    createPublicFolder({ folderName, parentFolderId }: CreatePublicFolderParams): Promise<ArFSResult>;
    createPrivateFolder({ folderName, driveKey, parentFolderId }: CreatePrivateFolderParams): Promise<ArFSResult>;
    private createDrive;
    createPublicDrive(params: CreatePublicDriveParams): Promise<ArFSResult>;
    createPrivateDrive(params: CreatePrivateDriveParams): Promise<ArFSResult>;
    /**
     * Utility function to estimate and assert the cost of a bulk upload
     *
     * @remarks This function will recurse into the folder contents of the provided folderToUpload
     *
     * @throws when the wallet does not contain enough AR for the bulk upload
     *
     * @param folderToUpload The wrapped folder to estimate the cost of
     * @param driveKey Optional parameter to determine whether to estimate the cost of a private or public upload
     * @param isParentFolder Boolean to determine whether to Assert the total cost. This parameter
     *   is only to be handled as false internally within the recursive function. Always use default
     *   of TRUE when calling this method
     *  */
    estimateAndAssertCostOfBulkUpload(folderToUpload: ArFSFolderToUpload, driveKey?: DriveKey, isParentFolder?: boolean): Promise<{
        totalPrice: Winston;
        totalFilePrice: Winston;
        communityWinstonTip: Winston;
    }>;
    assertOwnerAddress(owner: ArweaveAddress): Promise<void>;
    getPrivateDrive({ driveId, driveKey, owner }: GetPrivateDriveParams): Promise<ArFSPrivateDrive>;
    getPrivateFolder({ folderId, driveKey, owner }: GetPrivateFolderParams): Promise<ArFSPrivateFolder>;
    getPrivateFile({ fileId, driveKey, owner }: GetPrivateFileParams): Promise<ArFSPrivateFile>;
    /**
     * Lists the children of certain private folder
     * @param {FolderID} folderId the folder ID to list children of
     * @returns {ArFSPrivateFileOrFolderWithPaths[]} an array representation of the children and parent folder
     */
    listPrivateFolder({ folderId, driveKey, maxDepth, includeRoot, owner }: ListPrivateFolderParams): Promise<ArFSPrivateFileOrFolderWithPaths[]>;
    /** Throw an error if wallet balance does not cover cost of the provided winston  */
    assertWalletBalance(winston: Winston): Promise<void>;
    estimateAndAssertCostOfMoveFile(fileTransactionData: ArFSFileMetadataTransactionData): Promise<MetaDataBaseCosts>;
    estimateAndAssertCostOfFileUpload(decryptedFileSize: ByteCount, metaData: ArFSObjectTransactionData, drivePrivacy: DrivePrivacy): Promise<FileUploadBaseCosts>;
    estimateAndAssertCostOfFolderUpload(metaData: ArFSObjectTransactionData): Promise<MetaDataBaseCosts>;
    getDriveIdForFileId(fileId: FileID): Promise<DriveID>;
    getDriveIdForFolderId(folderId: FolderID): Promise<DriveID>;
    private stubPublicFileMetadata;
    private stubPrivateFileMetadata;
    assertValidPassword(password: string): Promise<void>;
    downloadPrivateFile({ fileId, driveKey, destFolderPath, defaultFileName }: DownloadPrivateFileParameters): Promise<void>;
}
