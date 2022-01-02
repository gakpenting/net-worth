"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArDrive = void 0;
const ardrive_anonymous_1 = require("./ardrive_anonymous");
const arfs_file_wrapper_1 = require("./arfs/arfs_file_wrapper");
const arfs_tx_data_types_1 = require("./arfs/arfs_tx_data_types");
const crypto_1 = require("./utils/crypto");
const types_1 = require("./types");
const types_2 = require("./types");
const common_1 = require("./utils/common");
const error_message_1 = require("./utils/error_message");
const constants_1 = require("./utils/constants");
const stream_decrypt_1 = require("./utils/stream_decrypt");
const assert_folder_1 = require("./utils/assert_folder");
const path_1 = require("path");
const upload_conflict_resolution_1 = require("./utils/upload_conflict_resolution");
const arfs_entity_result_factory_1 = require("./arfs/arfs_entity_result_factory");
const arfs_upload_planner_1 = require("./arfs/arfs_upload_planner");
const estimation_prototypes_1 = require("./pricing/estimation_prototypes");
const arfs_tag_settings_1 = require("./arfs/arfs_tag_settings");
const ar_data_price_network_estimator_1 = require("./pricing/ar_data_price_network_estimator");
class ArDrive extends ardrive_anonymous_1.ArDriveAnonymous {
    constructor(wallet, walletDao, arFsDao, communityOracle, 
    /** @deprecated App Name should be provided with ArFSTagSettings  */
    appName = constants_1.DEFAULT_APP_NAME, 
    /** @deprecated App Version should be provided with ArFSTagSettings  */
    appVersion = constants_1.DEFAULT_APP_VERSION, priceEstimator = new ar_data_price_network_estimator_1.ARDataPriceNetworkEstimator(), feeMultiple = new types_1.FeeMultiple(1.0), dryRun = false, arFSTagSettings = new arfs_tag_settings_1.ArFSTagSettings({ appName, appVersion }), uploadPlanner = new arfs_upload_planner_1.ArFSUploadPlanner({
        priceEstimator,
        arFSTagSettings: arFSTagSettings,
        feeMultiple
    })) {
        super(arFsDao);
        this.wallet = wallet;
        this.walletDao = walletDao;
        this.arFsDao = arFsDao;
        this.communityOracle = communityOracle;
        this.appName = appName;
        this.appVersion = appVersion;
        this.priceEstimator = priceEstimator;
        this.feeMultiple = feeMultiple;
        this.dryRun = dryRun;
        this.arFSTagSettings = arFSTagSettings;
        this.uploadPlanner = uploadPlanner;
    }
    // NOTE: Presumes that there's a sufficient wallet balance
    sendCommunityTip({ communityWinstonTip, assertBalance = false }) {
        return __awaiter(this, void 0, void 0, function* () {
            const tokenHolder = yield this.communityOracle.selectTokenHolder();
            const arTransferBaseFee = yield this.priceEstimator.getBaseWinstonPriceForByteCount(new types_1.ByteCount(0));
            const transferResult = yield this.walletDao.sendARToAddress(new types_1.AR(communityWinstonTip), this.wallet, tokenHolder, { reward: arTransferBaseFee, feeMultiple: this.feeMultiple }, this.dryRun, this.arFSTagSettings.getTipTags(), assertBalance);
            return {
                tipData: { txId: transferResult.txID, recipient: tokenHolder, winston: communityWinstonTip },
                reward: transferResult.reward
            };
        });
    }
    movePublicFile({ fileId, newParentFolderId }) {
        return __awaiter(this, void 0, void 0, function* () {
            const destFolderDriveId = yield this.arFsDao.getDriveIdForFolderId(newParentFolderId);
            const owner = yield this.getOwnerForDriveId(destFolderDriveId);
            yield this.assertOwnerAddress(owner);
            const originalFileMetaData = yield this.getPublicFile({ fileId });
            if (!destFolderDriveId.equals(originalFileMetaData.driveId)) {
                throw new Error(error_message_1.errorMessage.cannotMoveToDifferentDrive);
            }
            if (originalFileMetaData.parentFolderId.equals(newParentFolderId)) {
                throw new Error(error_message_1.errorMessage.cannotMoveIntoSamePlace('File', newParentFolderId));
            }
            // Assert that there are no duplicate names in the destination folder
            const entityNamesInParentFolder = yield this.arFsDao.getPublicEntityNamesInFolder(newParentFolderId);
            if (entityNamesInParentFolder.includes(originalFileMetaData.name)) {
                // TODO: Add optional interactive prompt to resolve name conflicts in ticket PE-599
                throw new Error(error_message_1.errorMessage.entityNameExists);
            }
            const fileTransactionData = new arfs_tx_data_types_1.ArFSPublicFileMetadataTransactionData(originalFileMetaData.name, originalFileMetaData.size, originalFileMetaData.lastModifiedDate, originalFileMetaData.dataTxId, originalFileMetaData.dataContentType);
            const moveFileBaseCosts = yield this.estimateAndAssertCostOfMoveFile(fileTransactionData);
            const fileMetaDataBaseReward = { reward: moveFileBaseCosts.metaDataBaseReward, feeMultiple: this.feeMultiple };
            // Move file will create a new meta data tx with identical meta data except for a new parentFolderId
            const moveFileResult = yield this.arFsDao.movePublicFile({
                originalMetaData: originalFileMetaData,
                transactionData: fileTransactionData,
                newParentFolderId,
                metaDataBaseReward: fileMetaDataBaseReward
            });
            return Promise.resolve({
                created: [
                    {
                        type: 'file',
                        metadataTxId: moveFileResult.metaDataTxId,
                        dataTxId: moveFileResult.dataTxId,
                        entityId: fileId
                    }
                ],
                tips: [],
                fees: {
                    [`${moveFileResult.metaDataTxId}`]: moveFileResult.metaDataTxReward
                }
            });
        });
    }
    movePrivateFile({ fileId, newParentFolderId, driveKey }) {
        return __awaiter(this, void 0, void 0, function* () {
            const destFolderDriveId = yield this.arFsDao.getDriveIdForFolderId(newParentFolderId);
            const owner = yield this.getOwnerForDriveId(destFolderDriveId);
            yield this.assertOwnerAddress(owner);
            const originalFileMetaData = yield this.getPrivateFile({ fileId, driveKey });
            if (!destFolderDriveId.equals(originalFileMetaData.driveId)) {
                throw new Error(error_message_1.errorMessage.cannotMoveToDifferentDrive);
            }
            if (originalFileMetaData.parentFolderId.equals(newParentFolderId)) {
                throw new Error(error_message_1.errorMessage.cannotMoveIntoSamePlace('File', newParentFolderId));
            }
            // Assert that there are no duplicate names in the destination folder
            const entityNamesInParentFolder = yield this.arFsDao.getPrivateEntityNamesInFolder(newParentFolderId, driveKey);
            if (entityNamesInParentFolder.includes(originalFileMetaData.name)) {
                // TODO: Add optional interactive prompt to resolve name conflicts in ticket PE-599
                throw new Error(error_message_1.errorMessage.entityNameExists);
            }
            const fileTransactionData = yield arfs_tx_data_types_1.ArFSPrivateFileMetadataTransactionData.from(originalFileMetaData.name, originalFileMetaData.size, originalFileMetaData.lastModifiedDate, originalFileMetaData.dataTxId, originalFileMetaData.dataContentType, fileId, driveKey);
            const moveFileBaseCosts = yield this.estimateAndAssertCostOfMoveFile(fileTransactionData);
            const fileMetaDataBaseReward = { reward: moveFileBaseCosts.metaDataBaseReward, feeMultiple: this.feeMultiple };
            // Move file will create a new meta data tx with identical meta data except for a new parentFolderId
            const moveFileResult = yield this.arFsDao.movePrivateFile({
                originalMetaData: originalFileMetaData,
                transactionData: fileTransactionData,
                newParentFolderId,
                metaDataBaseReward: fileMetaDataBaseReward
            });
            return Promise.resolve({
                created: [
                    {
                        type: 'file',
                        metadataTxId: moveFileResult.metaDataTxId,
                        dataTxId: moveFileResult.dataTxId,
                        entityId: fileId,
                        key: common_1.urlEncodeHashKey(moveFileResult.fileKey)
                    }
                ],
                tips: [],
                fees: {
                    [`${moveFileResult.metaDataTxId}`]: moveFileResult.metaDataTxReward
                }
            });
        });
    }
    movePublicFolder({ folderId, newParentFolderId }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (folderId.equals(newParentFolderId)) {
                throw new Error(error_message_1.errorMessage.folderCannotMoveIntoItself);
            }
            const destFolderDriveId = yield this.arFsDao.getDriveIdForFolderId(newParentFolderId);
            const owner = yield this.getOwnerForDriveId(destFolderDriveId);
            yield this.assertOwnerAddress(owner);
            const originalFolderMetaData = yield this.getPublicFolder({ folderId });
            if (!destFolderDriveId.equals(originalFolderMetaData.driveId)) {
                throw new Error(error_message_1.errorMessage.cannotMoveToDifferentDrive);
            }
            if (originalFolderMetaData.parentFolderId.equals(newParentFolderId)) {
                throw new Error(error_message_1.errorMessage.cannotMoveIntoSamePlace('Folder', newParentFolderId));
            }
            // Assert that there are no duplicate names in the destination folder
            const entityNamesInParentFolder = yield this.arFsDao.getPublicEntityNamesInFolder(newParentFolderId);
            if (entityNamesInParentFolder.includes(originalFolderMetaData.name)) {
                // TODO: Add optional interactive prompt to resolve name conflicts in ticket PE-599
                throw new Error(error_message_1.errorMessage.entityNameExists);
            }
            const childrenFolderIds = yield this.arFsDao.getPublicChildrenFolderIds({
                folderId,
                driveId: destFolderDriveId,
                owner
            });
            if (childrenFolderIds.some((fid) => fid.equals(newParentFolderId))) {
                throw new Error(error_message_1.errorMessage.cannotMoveParentIntoChildFolder);
            }
            const folderTransactionData = new arfs_tx_data_types_1.ArFSPublicFolderTransactionData(originalFolderMetaData.name);
            const { metaDataBaseReward: baseReward } = yield this.estimateAndAssertCostOfFolderUpload(folderTransactionData);
            const folderMetaDataBaseReward = { reward: baseReward, feeMultiple: this.feeMultiple };
            // Move folder will create a new meta data tx with identical meta data except for a new parentFolderId
            const moveFolderResult = yield this.arFsDao.movePublicFolder({
                originalMetaData: originalFolderMetaData,
                transactionData: folderTransactionData,
                newParentFolderId,
                metaDataBaseReward: folderMetaDataBaseReward
            });
            return Promise.resolve({
                created: [
                    {
                        type: 'folder',
                        metadataTxId: moveFolderResult.metaDataTxId,
                        entityId: folderId
                    }
                ],
                tips: [],
                fees: {
                    [`${moveFolderResult.metaDataTxId}`]: moveFolderResult.metaDataTxReward
                }
            });
        });
    }
    movePrivateFolder({ folderId, newParentFolderId, driveKey }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (folderId.equals(newParentFolderId)) {
                throw new Error(error_message_1.errorMessage.folderCannotMoveIntoItself);
            }
            const destFolderDriveId = yield this.arFsDao.getDriveIdForFolderId(newParentFolderId);
            const owner = yield this.getOwnerForDriveId(destFolderDriveId);
            yield this.assertOwnerAddress(owner);
            const originalFolderMetaData = yield this.getPrivateFolder({ folderId, driveKey });
            if (!destFolderDriveId.equals(originalFolderMetaData.driveId)) {
                throw new Error(error_message_1.errorMessage.cannotMoveToDifferentDrive);
            }
            if (originalFolderMetaData.parentFolderId.equals(newParentFolderId)) {
                throw new Error(error_message_1.errorMessage.cannotMoveIntoSamePlace('Folder', newParentFolderId));
            }
            // Assert that there are no duplicate names in the destination folder
            const entityNamesInParentFolder = yield this.arFsDao.getPrivateEntityNamesInFolder(newParentFolderId, driveKey);
            if (entityNamesInParentFolder.includes(originalFolderMetaData.name)) {
                // TODO: Add optional interactive prompt to resolve name conflicts in ticket PE-599
                throw new Error(error_message_1.errorMessage.entityNameExists);
            }
            const childrenFolderIds = yield this.arFsDao.getPrivateChildrenFolderIds({
                folderId,
                driveId: destFolderDriveId,
                driveKey,
                owner
            });
            if (childrenFolderIds.some((fid) => fid.equals(newParentFolderId))) {
                throw new Error(error_message_1.errorMessage.cannotMoveParentIntoChildFolder);
            }
            const folderTransactionData = yield arfs_tx_data_types_1.ArFSPrivateFolderTransactionData.from(originalFolderMetaData.name, driveKey);
            const { metaDataBaseReward: baseReward } = yield this.estimateAndAssertCostOfFolderUpload(folderTransactionData);
            const folderMetaDataBaseReward = { reward: baseReward, feeMultiple: this.feeMultiple };
            // Move folder will create a new meta data tx with identical meta data except for a new parentFolderId
            const moveFolderResult = yield this.arFsDao.movePrivateFolder({
                originalMetaData: originalFolderMetaData,
                transactionData: folderTransactionData,
                newParentFolderId,
                metaDataBaseReward: folderMetaDataBaseReward
            });
            return Promise.resolve({
                created: [
                    {
                        type: 'folder',
                        metadataTxId: moveFolderResult.metaDataTxId,
                        entityId: folderId,
                        key: common_1.urlEncodeHashKey(moveFolderResult.driveKey)
                    }
                ],
                tips: [],
                fees: {
                    [`${moveFolderResult.metaDataTxId}`]: moveFolderResult.metaDataTxReward
                }
            });
        });
    }
    uploadPublicFile({ parentFolderId, wrappedFile, destinationFileName, conflictResolution = types_1.upsertOnConflicts, prompts }) {
        return __awaiter(this, void 0, void 0, function* () {
            const driveId = yield this.arFsDao.getDriveIdForFolderId(parentFolderId);
            const owner = yield this.arFsDao.getOwnerAndAssertDrive(driveId);
            yield this.assertOwnerAddress(owner);
            // Derive destination name and names already within provided destination folder
            destinationFileName !== null && destinationFileName !== void 0 ? destinationFileName : (destinationFileName = wrappedFile.getBaseFileName());
            const nameConflictInfo = yield this.arFsDao.getPublicNameConflictInfoInFolder(parentFolderId);
            yield upload_conflict_resolution_1.resolveFileNameConflicts({
                conflictResolution,
                destinationFileName,
                nameConflictInfo,
                wrappedFile,
                prompts
            });
            if (wrappedFile.conflictResolution) {
                switch (wrappedFile.conflictResolution) {
                    case types_1.errorOnConflict:
                        throw new Error(error_message_1.errorMessage.entityNameExists);
                    case types_1.skipOnConflicts:
                        return types_2.emptyArFSResult;
                    case types_1.upsertOnConflicts:
                        throw new Error(error_message_1.errorMessage.fileIsTheSame);
                }
            }
            if (wrappedFile.newFileName) {
                destinationFileName = wrappedFile.newFileName;
            }
            const uploadBaseCosts = yield this.estimateAndAssertCostOfFileUpload(new types_1.ByteCount(wrappedFile.fileStats.size), this.stubPublicFileMetadata(wrappedFile, destinationFileName), 'public');
            const fileDataRewardSettings = { reward: uploadBaseCosts.fileDataBaseReward, feeMultiple: this.feeMultiple };
            const metadataRewardSettings = { reward: uploadBaseCosts.metaDataBaseReward, feeMultiple: this.feeMultiple };
            const uploadFileResult = yield this.arFsDao.uploadPublicFile({
                parentFolderId,
                wrappedFile,
                driveId,
                fileDataRewardSettings,
                metadataRewardSettings,
                destFileName: destinationFileName,
                existingFileId: wrappedFile.existingId
            });
            const { tipData, reward: communityTipTxReward } = yield this.sendCommunityTip({
                communityWinstonTip: uploadBaseCosts.communityWinstonTip
            });
            return Promise.resolve({
                created: [
                    {
                        type: 'file',
                        metadataTxId: uploadFileResult.metaDataTxId,
                        dataTxId: uploadFileResult.dataTxId,
                        entityId: uploadFileResult.fileId
                    }
                ],
                tips: [tipData],
                fees: {
                    [`${uploadFileResult.dataTxId}`]: uploadFileResult.dataTxReward,
                    [`${uploadFileResult.metaDataTxId}`]: uploadFileResult.metaDataTxReward,
                    [`${tipData.txId}`]: communityTipTxReward
                }
            });
        });
    }
    createPublicFolderAndUploadChildren({ parentFolderId, wrappedFolder, destParentFolderName, conflictResolution = types_1.upsertOnConflicts, prompts }) {
        return __awaiter(this, void 0, void 0, function* () {
            const driveId = yield this.arFsDao.getDriveIdForFolderId(parentFolderId);
            const owner = yield this.arFsDao.getOwnerAndAssertDrive(driveId);
            yield this.assertOwnerAddress(owner);
            // Derive destination name and names already within provided destination folder
            destParentFolderName !== null && destParentFolderName !== void 0 ? destParentFolderName : (destParentFolderName = wrappedFolder.getBaseFileName());
            const nameConflictInfo = yield this.arFsDao.getPublicNameConflictInfoInFolder(parentFolderId);
            yield upload_conflict_resolution_1.resolveFolderNameConflicts({
                conflictResolution,
                destinationFolderName: destParentFolderName,
                getConflictInfoFn: (folderId) => this.arFsDao.getPublicNameConflictInfoInFolder(folderId),
                nameConflictInfo,
                wrappedFolder,
                prompts
            });
            // Estimate and assert the cost of the entire bulk upload
            // This will assign the calculated base costs to each wrapped file and folder
            const bulkEstimation = yield this.estimateAndAssertCostOfBulkUpload(wrappedFolder);
            // TODO: Add interactive confirmation of price estimation before uploading
            const results = yield this.recursivelyCreatePublicFolderAndUploadChildren({
                parentFolderId,
                wrappedFolder,
                driveId,
                owner
            });
            if (bulkEstimation.communityWinstonTip.isGreaterThan(types_1.W(0))) {
                // Send community tip only if communityWinstonTip has a value
                // This can be zero when a user uses this method to upload empty folders
                const { tipData, reward: communityTipTxReward } = yield this.sendCommunityTip({
                    communityWinstonTip: bulkEstimation.communityWinstonTip
                });
                return Promise.resolve({
                    created: results.entityResults,
                    tips: [tipData],
                    fees: Object.assign(Object.assign({}, results.feeResults), { [`${tipData.txId}`]: communityTipTxReward })
                });
            }
            return Promise.resolve({
                created: results.entityResults,
                tips: [],
                fees: results.feeResults
            });
        });
    }
    recursivelyCreatePublicFolderAndUploadChildren({ parentFolderId, wrappedFolder, driveId, owner }) {
        var e_1, _a, e_2, _b;
        var _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            let uploadEntityFees = {};
            let uploadEntityResults = [];
            let folderId;
            if (wrappedFolder.conflictResolution === types_1.skipOnConflicts) {
                // We may skip a folder upload if it conflicts with an existing file name.
                // This would one be the FAIL cases from the table, ideally we'd throw an
                // error -- but we don't want to interrupt other parts of the bulk upload
                return { entityResults: [], feeResults: {} };
            }
            if (wrappedFolder.existingId) {
                // Re-use existing parent folder ID for bulk upload if it exists
                folderId = wrappedFolder.existingId;
            }
            else {
                // Create the parent folder
                const folderData = new arfs_tx_data_types_1.ArFSPublicFolderTransactionData((_c = wrappedFolder.newFolderName) !== null && _c !== void 0 ? _c : wrappedFolder.getBaseFileName());
                const createFolderResult = yield this.arFsDao.createPublicFolder({
                    folderData: folderData,
                    driveId,
                    rewardSettings: {
                        reward: wrappedFolder.getBaseCosts().metaDataBaseReward,
                        feeMultiple: this.feeMultiple
                    },
                    parentFolderId
                });
                const { metaDataTxId: metaDataTxId, folderId: newFolderId, metaDataTxReward: metaDataTxReward } = createFolderResult;
                // Capture parent folder results
                uploadEntityFees = { [`${metaDataTxId}`]: metaDataTxReward };
                uploadEntityResults = [
                    {
                        type: 'folder',
                        metadataTxId: metaDataTxId,
                        entityId: newFolderId
                    }
                ];
                folderId = newFolderId;
            }
            try {
                // Upload all files in the folder
                for (var _e = __asyncValues(wrappedFolder.files), _f; _f = yield _e.next(), !_f.done;) {
                    const wrappedFile = _f.value;
                    if (wrappedFile.conflictResolution) {
                        // Continue loop -- don't upload this file in every conflict case for bulk upload.
                        // We avoid throwing any errors inside this loop so other possible results get returned
                        continue;
                    }
                    const fileDataRewardSettings = {
                        reward: wrappedFile.getBaseCosts().fileDataBaseReward,
                        feeMultiple: this.feeMultiple
                    };
                    const metadataRewardSettings = {
                        reward: wrappedFile.getBaseCosts().metaDataBaseReward,
                        feeMultiple: this.feeMultiple
                    };
                    const uploadFileResult = yield this.arFsDao.uploadPublicFile({
                        parentFolderId: folderId,
                        wrappedFile,
                        driveId,
                        fileDataRewardSettings,
                        metadataRewardSettings,
                        existingFileId: wrappedFile.existingId,
                        destFileName: (_d = wrappedFile.newFileName) !== null && _d !== void 0 ? _d : wrappedFile.getBaseFileName()
                    });
                    // Capture all file results
                    uploadEntityFees = Object.assign(Object.assign({}, uploadEntityFees), { [`${uploadFileResult.dataTxId}`]: uploadFileResult.dataTxReward, [`${uploadFileResult.metaDataTxId}`]: uploadFileResult.metaDataTxReward });
                    uploadEntityResults = [
                        ...uploadEntityResults,
                        {
                            type: 'file',
                            metadataTxId: uploadFileResult.metaDataTxId,
                            dataTxId: uploadFileResult.dataTxId,
                            entityId: uploadFileResult.fileId
                        }
                    ];
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_f && !_f.done && (_a = _e.return)) yield _a.call(_e);
                }
                finally { if (e_1) throw e_1.error; }
            }
            try {
                // Upload folders, and children of those folders
                for (var _g = __asyncValues(wrappedFolder.folders), _h; _h = yield _g.next(), !_h.done;) {
                    const childFolder = _h.value;
                    // Recursion alert, will keep creating folders of all nested folders
                    const results = yield this.recursivelyCreatePublicFolderAndUploadChildren({
                        parentFolderId: folderId,
                        wrappedFolder: childFolder,
                        driveId,
                        owner
                    });
                    // Capture all folder results
                    uploadEntityFees = Object.assign(Object.assign({}, uploadEntityFees), results.feeResults);
                    uploadEntityResults = [...uploadEntityResults, ...results.entityResults];
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_h && !_h.done && (_b = _g.return)) yield _b.call(_g);
                }
                finally { if (e_2) throw e_2.error; }
            }
            return {
                entityResults: uploadEntityResults,
                feeResults: uploadEntityFees
            };
        });
    }
    uploadPrivateFile({ parentFolderId, wrappedFile, driveKey, destinationFileName, conflictResolution = types_1.upsertOnConflicts, prompts }) {
        return __awaiter(this, void 0, void 0, function* () {
            const driveId = yield this.arFsDao.getDriveIdForFolderId(parentFolderId);
            const owner = yield this.arFsDao.getOwnerAndAssertDrive(driveId, driveKey);
            yield this.assertOwnerAddress(owner);
            // Derive destination name and names already within provided destination folder
            destinationFileName !== null && destinationFileName !== void 0 ? destinationFileName : (destinationFileName = wrappedFile.getBaseFileName());
            const nameConflictInfo = yield this.arFsDao.getPrivateNameConflictInfoInFolder(parentFolderId, driveKey);
            yield upload_conflict_resolution_1.resolveFileNameConflicts({
                conflictResolution,
                destinationFileName,
                nameConflictInfo,
                wrappedFile,
                prompts
            });
            if (wrappedFile.conflictResolution) {
                switch (wrappedFile.conflictResolution) {
                    case types_1.errorOnConflict:
                        throw new Error(error_message_1.errorMessage.entityNameExists);
                    case types_1.skipOnConflicts:
                        return types_2.emptyArFSResult;
                    case types_1.upsertOnConflicts:
                        throw new Error(error_message_1.errorMessage.fileIsTheSame);
                }
            }
            if (wrappedFile.newFileName) {
                destinationFileName = wrappedFile.newFileName;
            }
            const uploadBaseCosts = yield this.estimateAndAssertCostOfFileUpload(new types_1.ByteCount(wrappedFile.fileStats.size), yield this.stubPrivateFileMetadata(wrappedFile, destinationFileName), 'private');
            const fileDataRewardSettings = {
                reward: uploadBaseCosts.fileDataBaseReward,
                feeMultiple: this.feeMultiple
            };
            const metadataRewardSettings = {
                reward: uploadBaseCosts.metaDataBaseReward,
                feeMultiple: this.feeMultiple
            };
            // TODO: Add interactive confirmation of AR price estimation
            const uploadFileResult = yield this.arFsDao.uploadPrivateFile({
                parentFolderId,
                wrappedFile,
                driveId,
                driveKey,
                fileDataRewardSettings,
                metadataRewardSettings,
                destFileName: destinationFileName,
                existingFileId: wrappedFile.existingId
            });
            const { tipData, reward: communityTipTxReward } = yield this.sendCommunityTip({
                communityWinstonTip: uploadBaseCosts.communityWinstonTip
            });
            return Promise.resolve({
                created: [
                    {
                        type: 'file',
                        metadataTxId: uploadFileResult.metaDataTxId,
                        dataTxId: uploadFileResult.dataTxId,
                        entityId: uploadFileResult.fileId,
                        key: common_1.urlEncodeHashKey(uploadFileResult.fileKey)
                    }
                ],
                tips: [tipData],
                fees: {
                    [`${uploadFileResult.dataTxId}`]: uploadFileResult.dataTxReward,
                    [`${uploadFileResult.metaDataTxId}`]: uploadFileResult.metaDataTxReward,
                    [`${tipData.txId}`]: communityTipTxReward
                }
            });
        });
    }
    createPrivateFolderAndUploadChildren({ parentFolderId, wrappedFolder, driveKey, destParentFolderName, conflictResolution = types_1.upsertOnConflicts, prompts }) {
        return __awaiter(this, void 0, void 0, function* () {
            // Retrieve drive ID from folder ID
            const driveId = yield this.arFsDao.getDriveIdForFolderId(parentFolderId);
            // Get owner of drive, will error if no drives are found
            const owner = yield this.arFsDao.getOwnerAndAssertDrive(driveId, driveKey);
            // Assert that the provided wallet is the owner of the drive
            yield this.assertOwnerAddress(owner);
            // Derive destination name and names already within provided destination folder
            destParentFolderName !== null && destParentFolderName !== void 0 ? destParentFolderName : (destParentFolderName = wrappedFolder.getBaseFileName());
            const nameConflictInfo = yield this.arFsDao.getPrivateNameConflictInfoInFolder(parentFolderId, driveKey);
            yield upload_conflict_resolution_1.resolveFolderNameConflicts({
                conflictResolution,
                destinationFolderName: destParentFolderName,
                getConflictInfoFn: (folderId) => this.arFsDao.getPrivateNameConflictInfoInFolder(folderId, driveKey),
                nameConflictInfo,
                wrappedFolder,
                prompts
            });
            // Estimate and assert the cost of the entire bulk upload
            // This will assign the calculated base costs to each wrapped file and folder
            const bulkEstimation = yield this.estimateAndAssertCostOfBulkUpload(wrappedFolder, driveKey);
            // TODO: Add interactive confirmation of price estimation before uploading
            const results = yield this.recursivelyCreatePrivateFolderAndUploadChildren({
                parentFolderId,
                wrappedFolder,
                driveKey,
                driveId,
                owner
            });
            if (bulkEstimation.communityWinstonTip.isGreaterThan(types_1.W(0))) {
                // Send community tip only if communityWinstonTip has a value
                // This can be zero when a user uses this method to upload empty folders
                const { tipData, reward: communityTipTxReward } = yield this.sendCommunityTip({
                    communityWinstonTip: bulkEstimation.communityWinstonTip
                });
                return Promise.resolve({
                    created: results.entityResults,
                    tips: [tipData],
                    fees: Object.assign(Object.assign({}, results.feeResults), { [`${tipData.txId}`]: communityTipTxReward })
                });
            }
            return Promise.resolve({
                created: results.entityResults,
                tips: [],
                fees: results.feeResults
            });
        });
    }
    recursivelyCreatePrivateFolderAndUploadChildren({ wrappedFolder, driveId, parentFolderId, driveKey, owner }) {
        var e_3, _a, e_4, _b;
        var _c, _d;
        return __awaiter(this, void 0, void 0, function* () {
            let uploadEntityFees = {};
            let uploadEntityResults = [];
            let folderId;
            if (wrappedFolder.conflictResolution === types_1.skipOnConflicts) {
                // We may skip a folder upload if it conflicts with an existing file name.
                // This would one be the FAIL cases from the table, ideally we'd throw an
                // error -- but we don't want to interrupt other parts of the bulk upload
                return { entityResults: [], feeResults: {} };
            }
            if (wrappedFolder.existingId) {
                // Re-use existing parent folder ID for bulk upload if it exists
                folderId = wrappedFolder.existingId;
            }
            else {
                // Create parent folder
                const folderData = yield arfs_tx_data_types_1.ArFSPrivateFolderTransactionData.from((_c = wrappedFolder.newFolderName) !== null && _c !== void 0 ? _c : wrappedFolder.getBaseFileName(), driveKey);
                const createFolderResult = yield this.arFsDao.createPrivateFolder({
                    folderData: folderData,
                    driveId,
                    rewardSettings: {
                        reward: wrappedFolder.getBaseCosts().metaDataBaseReward,
                        feeMultiple: this.feeMultiple
                    },
                    parentFolderId
                });
                const { metaDataTxId: metaDataTxId, folderId: newFolderId, metaDataTxReward: metaDataTxReward } = createFolderResult;
                // Capture parent folder results
                uploadEntityFees = { [`${metaDataTxId}`]: metaDataTxReward };
                uploadEntityResults = [
                    {
                        type: 'folder',
                        metadataTxId: metaDataTxId,
                        entityId: newFolderId,
                        key: common_1.urlEncodeHashKey(driveKey)
                    }
                ];
                folderId = newFolderId;
            }
            try {
                // Upload all files in the folder
                for (var _e = __asyncValues(wrappedFolder.files), _f; _f = yield _e.next(), !_f.done;) {
                    const wrappedFile = _f.value;
                    if (wrappedFile.conflictResolution) {
                        // Continue loop -- don't upload this file in every conflict case for bulk upload.
                        // We avoid throwing any errors inside this loop so other possible results get returned
                        continue;
                    }
                    const fileDataRewardSettings = {
                        reward: wrappedFile.getBaseCosts().fileDataBaseReward,
                        feeMultiple: this.feeMultiple
                    };
                    const metadataRewardSettings = {
                        reward: wrappedFile.getBaseCosts().metaDataBaseReward,
                        feeMultiple: this.feeMultiple
                    };
                    const uploadFileResult = yield this.arFsDao.uploadPrivateFile({
                        parentFolderId: folderId,
                        wrappedFile,
                        driveId,
                        driveKey,
                        fileDataRewardSettings,
                        metadataRewardSettings,
                        existingFileId: wrappedFile.existingId,
                        destFileName: (_d = wrappedFile.newFileName) !== null && _d !== void 0 ? _d : wrappedFile.getBaseFileName()
                    });
                    // Capture all file results
                    uploadEntityFees = Object.assign(Object.assign({}, uploadEntityFees), { [`${uploadFileResult.dataTxId}`]: uploadFileResult.dataTxReward, [`${uploadFileResult.metaDataTxId}`]: uploadFileResult.metaDataTxReward });
                    uploadEntityResults = [
                        ...uploadEntityResults,
                        {
                            type: 'file',
                            metadataTxId: uploadFileResult.metaDataTxId,
                            dataTxId: uploadFileResult.dataTxId,
                            entityId: uploadFileResult.fileId,
                            key: common_1.urlEncodeHashKey(uploadFileResult.fileKey)
                        }
                    ];
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (_f && !_f.done && (_a = _e.return)) yield _a.call(_e);
                }
                finally { if (e_3) throw e_3.error; }
            }
            try {
                // Upload folders, and children of those folders
                for (var _g = __asyncValues(wrappedFolder.folders), _h; _h = yield _g.next(), !_h.done;) {
                    const childFolder = _h.value;
                    // Recursion alert, will keep creating folders of all nested folders
                    const results = yield this.recursivelyCreatePrivateFolderAndUploadChildren({
                        parentFolderId: folderId,
                        wrappedFolder: childFolder,
                        driveId,
                        driveKey,
                        owner
                    });
                    // Capture all folder results
                    uploadEntityFees = Object.assign(Object.assign({}, uploadEntityFees), results.feeResults);
                    uploadEntityResults = [...uploadEntityResults, ...results.entityResults];
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (_h && !_h.done && (_b = _g.return)) yield _b.call(_g);
                }
                finally { if (e_4) throw e_4.error; }
            }
            return {
                entityResults: uploadEntityResults,
                feeResults: uploadEntityFees
            };
        });
    }
    uploadPublicManifest({ folderId, destManifestName = 'DriveManifest.json', maxDepth = Number.MAX_SAFE_INTEGER, conflictResolution = types_1.upsertOnConflicts, prompts }) {
        return __awaiter(this, void 0, void 0, function* () {
            const driveId = yield this.arFsDao.getDriveIdForFolderId(folderId);
            // Assert that the owner of this drive is consistent with the provided wallet
            const owner = yield this.getOwnerForDriveId(driveId);
            yield this.assertOwnerAddress(owner);
            const children = yield this.listPublicFolder({
                folderId,
                maxDepth,
                includeRoot: true,
                owner
            });
            const arweaveManifest = new arfs_file_wrapper_1.ArFSManifestToUpload(children, destManifestName);
            const nameConflictInfo = yield this.arFsDao.getPublicNameConflictInfoInFolder(folderId);
            yield upload_conflict_resolution_1.resolveFileNameConflicts({
                wrappedFile: arweaveManifest,
                conflictResolution,
                destinationFileName: destManifestName,
                nameConflictInfo,
                prompts
            });
            if (arweaveManifest.conflictResolution === types_1.errorOnConflict) {
                // File names CANNOT conflict with folder names
                throw new Error(error_message_1.errorMessage.entityNameExists);
            }
            if (arweaveManifest.conflictResolution === types_1.skipOnConflicts) {
                // Return empty result if there is an existing manifest and resolution is set to skip
                return types_1.emptyManifestResult;
            }
            const uploadBaseCosts = yield this.estimateAndAssertCostOfFileUpload(arweaveManifest.size, this.stubPublicFileMetadata(arweaveManifest), 'public');
            const fileDataRewardSettings = { reward: uploadBaseCosts.fileDataBaseReward, feeMultiple: this.feeMultiple };
            const metadataRewardSettings = { reward: uploadBaseCosts.metaDataBaseReward, feeMultiple: this.feeMultiple };
            const uploadFileResult = yield this.arFsDao.uploadPublicFile({
                parentFolderId: folderId,
                wrappedFile: arweaveManifest,
                driveId,
                fileDataRewardSettings,
                metadataRewardSettings,
                destFileName: arweaveManifest.getBaseFileName(),
                existingFileId: arweaveManifest.existingId
            });
            const { tipData, reward: communityTipTxReward } = yield this.sendCommunityTip({
                communityWinstonTip: uploadBaseCosts.communityWinstonTip
            });
            return Promise.resolve({
                created: [
                    {
                        type: 'file',
                        metadataTxId: uploadFileResult.metaDataTxId,
                        dataTxId: uploadFileResult.dataTxId,
                        entityId: uploadFileResult.fileId
                    }
                ],
                tips: [tipData],
                fees: {
                    [`${uploadFileResult.dataTxId}`]: uploadFileResult.dataTxReward,
                    [`${uploadFileResult.metaDataTxId}`]: uploadFileResult.metaDataTxReward,
                    [`${tipData.txId}`]: communityTipTxReward
                },
                manifest: arweaveManifest.manifest,
                links: arweaveManifest.getLinksOutput(uploadFileResult.dataTxId)
            });
        });
    }
    createPublicFolder({ folderName, parentFolderId }) {
        return __awaiter(this, void 0, void 0, function* () {
            const driveId = yield this.arFsDao.getDriveIdForFolderId(parentFolderId);
            const owner = yield this.arFsDao.getOwnerAndAssertDrive(driveId);
            yield this.assertOwnerAddress(owner);
            // Assert that there are no duplicate names in the destination folder
            const entityNamesInParentFolder = yield this.arFsDao.getPublicEntityNamesInFolder(parentFolderId);
            if (entityNamesInParentFolder.includes(folderName)) {
                // TODO: Add optional interactive prompt to resolve name conflicts in ticket PE-599
                throw new Error(error_message_1.errorMessage.entityNameExists);
            }
            // Assert that there's enough AR available in the wallet
            const folderData = new arfs_tx_data_types_1.ArFSPublicFolderTransactionData(folderName);
            const { metaDataBaseReward } = yield this.estimateAndAssertCostOfFolderUpload(folderData);
            // Create the folder and retrieve its folder ID
            const { metaDataTxId: metaDataTxId, metaDataTxReward: metaDataTxReward, folderId } = yield this.arFsDao.createPublicFolder({
                folderData,
                driveId,
                rewardSettings: { reward: metaDataBaseReward, feeMultiple: this.feeMultiple },
                parentFolderId
            });
            // IN THE FUTURE WE MIGHT SEND A COMMUNITY TIP HERE
            return Promise.resolve({
                created: [
                    {
                        type: 'folder',
                        metadataTxId: metaDataTxId,
                        entityId: folderId
                    }
                ],
                tips: [],
                fees: {
                    [`${metaDataTxId}`]: metaDataTxReward
                }
            });
        });
    }
    createPrivateFolder({ folderName, driveKey, parentFolderId }) {
        return __awaiter(this, void 0, void 0, function* () {
            const driveId = yield this.arFsDao.getDriveIdForFolderId(parentFolderId);
            const owner = yield this.arFsDao.getOwnerAndAssertDrive(driveId, driveKey);
            yield this.assertOwnerAddress(owner);
            // Assert that there are no duplicate names in the destination folder
            const entityNamesInParentFolder = yield this.arFsDao.getPrivateEntityNamesInFolder(parentFolderId, driveKey);
            if (entityNamesInParentFolder.includes(folderName)) {
                // TODO: Add optional interactive prompt to resolve name conflicts in ticket PE-599
                throw new Error(error_message_1.errorMessage.entityNameExists);
            }
            // Assert that there's enough AR available in the wallet
            const folderData = yield arfs_tx_data_types_1.ArFSPrivateFolderTransactionData.from(folderName, driveKey);
            const { metaDataBaseReward } = yield this.estimateAndAssertCostOfFolderUpload(folderData);
            // Create the folder and retrieve its folder ID
            const { metaDataTxId: metaDataTxId, metaDataTxReward: metaDataTxReward, folderId } = yield this.arFsDao.createPrivateFolder({
                folderData,
                driveId,
                rewardSettings: { reward: metaDataBaseReward, feeMultiple: this.feeMultiple },
                parentFolderId
            });
            // IN THE FUTURE WE MIGHT SEND A COMMUNITY TIP HERE
            return Promise.resolve({
                created: [
                    {
                        type: 'folder',
                        metadataTxId: metaDataTxId,
                        entityId: folderId,
                        key: common_1.urlEncodeHashKey(driveKey)
                    }
                ],
                tips: [],
                fees: {
                    [`${metaDataTxId}`]: metaDataTxReward
                }
            });
        });
    }
    createDrive(arFSPrototypes, arFSCreateDrive) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(this.uploadPlanner);
            const { rewardSettings, totalWinstonPrice } = yield this.uploadPlanner.estimateCreateDrive(arFSPrototypes);
            console.log(totalWinstonPrice);
            yield this.assertWalletBalance(totalWinstonPrice);
            const createDriveResult = yield arFSCreateDrive(rewardSettings);
            const arFSResults = {
                created: [
                    {
                        type: 'drive',
                        metadataTxId: createDriveResult.metaDataTxId,
                        entityId: createDriveResult.driveId
                    },
                    {
                        type: 'folder',
                        metadataTxId: createDriveResult.rootFolderTxId,
                        entityId: createDriveResult.rootFolderId
                    }
                ],
                tips: [],
                fees: {}
            };
            return arFSResults;
            if (arfs_entity_result_factory_1.isBundleResult(createDriveResult)) {
                // Add bundle entity and return direct to network bundled tx result
                arFSResults.created.push({
                    type: 'bundle',
                    bundleTxId: createDriveResult.bundleTxId
                });
                return Object.assign(Object.assign({}, arFSResults), { fees: {
                        [`${createDriveResult.bundleTxId}`]: createDriveResult.bundleTxReward
                    } });
            }
            // Return as V2 Transaction result
            return Object.assign(Object.assign({}, arFSResults), { fees: {
                    [`${createDriveResult.metaDataTxId}`]: createDriveResult.metaDataTxReward,
                    [`${createDriveResult.rootFolderTxId}`]: createDriveResult.rootFolderTxReward
                } });
        });
    }
    createPublicDrive(params) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log(params)
            return this.createDrive(estimation_prototypes_1.getPublicCreateDriveEstimationPrototypes(params), (rewardSettings) => this.arFsDao.createPublicDrive({ driveName: params.driveName, rewardSettings }));
        });
    }
    createPrivateDrive(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { driveName, newPrivateDriveData: newDriveData } = params;
            const createDriveResult = yield this.createDrive(yield estimation_prototypes_1.getPrivateCreateDriveEstimationPrototypes(params), (rewardSettings) => this.arFsDao.createPrivateDrive({ driveName, newDriveData, rewardSettings }));
            // Add drive keys to drive and folder entity results
            createDriveResult.created[0].key = common_1.urlEncodeHashKey(newDriveData.driveKey);
            createDriveResult.created[1].key = common_1.urlEncodeHashKey(newDriveData.driveKey);
            return createDriveResult;
        });
    }
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
    estimateAndAssertCostOfBulkUpload(folderToUpload, driveKey, isParentFolder = true) {
        var e_5, _a, e_6, _b;
        var _c;
        return __awaiter(this, void 0, void 0, function* () {
            let totalPrice = types_1.W(0);
            let totalFilePrice = types_1.W(0);
            if (folderToUpload.conflictResolution === types_1.skipOnConflicts) {
                // Return empty estimation if this folder will be skipped, do not recurse
                return { totalPrice: types_1.W('0'), totalFilePrice: types_1.W('0'), communityWinstonTip: types_1.W('0') };
            }
            // Don't estimate cost of folder metadata if using existing folder
            if (!folderToUpload.existingId) {
                const folderMetadataTxData = yield (() => __awaiter(this, void 0, void 0, function* () {
                    var _h;
                    const folderName = (_h = folderToUpload.newFolderName) !== null && _h !== void 0 ? _h : folderToUpload.getBaseFileName();
                    if (driveKey) {
                        return arfs_tx_data_types_1.ArFSPrivateFolderTransactionData.from(folderName, driveKey);
                    }
                    return new arfs_tx_data_types_1.ArFSPublicFolderTransactionData(folderName);
                }))();
                const metaDataBaseReward = yield this.priceEstimator.getBaseWinstonPriceForByteCount(folderMetadataTxData.sizeOf());
                const parentFolderWinstonPrice = metaDataBaseReward;
                // Assign base costs to folder
                folderToUpload.baseCosts = { metaDataBaseReward: parentFolderWinstonPrice };
                totalPrice = totalPrice.plus(parentFolderWinstonPrice);
            }
            try {
                for (var _d = __asyncValues(folderToUpload.files), _e; _e = yield _d.next(), !_e.done;) {
                    const file = _e.value;
                    if (file.conflictResolution) {
                        // Continue loop, won't upload this file
                        continue;
                    }
                    const fileSize = driveKey ? file.encryptedDataSize() : new types_1.ByteCount(file.fileStats.size);
                    const fileDataBaseReward = yield this.priceEstimator.getBaseWinstonPriceForByteCount(fileSize);
                    const destFileName = (_c = file.newFileName) !== null && _c !== void 0 ? _c : file.getBaseFileName();
                    const stubFileMetaData = driveKey
                        ? yield this.stubPrivateFileMetadata(file, destFileName)
                        : this.stubPublicFileMetadata(file, destFileName);
                    const metaDataBaseReward = yield this.priceEstimator.getBaseWinstonPriceForByteCount(stubFileMetaData.sizeOf());
                    totalPrice = totalPrice.plus(fileDataBaseReward);
                    totalPrice = totalPrice.plus(metaDataBaseReward);
                    totalFilePrice = totalFilePrice.plus(fileDataBaseReward);
                    // Assign base costs to the file
                    file.baseCosts = {
                        fileDataBaseReward: fileDataBaseReward,
                        metaDataBaseReward: metaDataBaseReward
                    };
                }
            }
            catch (e_5_1) { e_5 = { error: e_5_1 }; }
            finally {
                try {
                    if (_e && !_e.done && (_a = _d.return)) yield _a.call(_d);
                }
                finally { if (e_5) throw e_5.error; }
            }
            try {
                for (var _f = __asyncValues(folderToUpload.folders), _g; _g = yield _f.next(), !_g.done;) {
                    const folder = _g.value;
                    const childFolderResults = yield this.estimateAndAssertCostOfBulkUpload(folder, driveKey, false);
                    totalPrice = totalPrice.plus(childFolderResults.totalPrice);
                    totalFilePrice = totalFilePrice.plus(childFolderResults.totalFilePrice);
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (_g && !_g.done && (_b = _f.return)) yield _b.call(_f);
                }
                finally { if (e_6) throw e_6.error; }
            }
            const totalWinstonPrice = totalPrice;
            let communityWinstonTip = types_1.W(0);
            if (isParentFolder) {
                if (totalFilePrice.isGreaterThan(types_1.W(0))) {
                    communityWinstonTip = yield this.communityOracle.getCommunityWinstonTip(totalFilePrice);
                }
                // Check and assert balance of the total bulk upload if this folder is the parent folder
                const walletHasBalance = yield this.walletDao.walletHasBalance(this.wallet, communityWinstonTip.plus(totalWinstonPrice));
                if (!walletHasBalance) {
                    const walletBalance = yield this.walletDao.getWalletWinstonBalance(this.wallet);
                    throw new Error(`Wallet balance of ${walletBalance} Winston is not enough (${totalWinstonPrice}) for data upload of size ${folderToUpload.getTotalByteCount(driveKey !== undefined)} bytes!`);
                }
            }
            return {
                totalPrice,
                totalFilePrice,
                communityWinstonTip
            };
        });
    }
    assertOwnerAddress(owner) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!owner.equals(yield this.wallet.getAddress())) {
                throw new Error('Supplied wallet is not the owner of this drive!');
            }
        });
    }
    getPrivateDrive({ driveId, driveKey, owner }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!owner) {
                owner = yield this.getOwnerForDriveId(driveId);
            }
            yield this.assertOwnerAddress(owner);
            return this.arFsDao.getPrivateDrive(driveId, driveKey, owner);
        });
    }
    getPrivateFolder({ folderId, driveKey, owner }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!owner) {
                owner = yield this.arFsDao.getDriveOwnerForFolderId(folderId);
            }
            yield this.assertOwnerAddress(owner);
            return this.arFsDao.getPrivateFolder(folderId, driveKey, owner);
        });
    }
    getPrivateFile({ fileId, driveKey, owner }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!owner) {
                owner = yield this.arFsDao.getDriveOwnerForFileId(fileId);
            }
            yield this.assertOwnerAddress(owner);
            return this.arFsDao.getPrivateFile(fileId, driveKey, owner);
        });
    }
    /**
     * Lists the children of certain private folder
     * @param {FolderID} folderId the folder ID to list children of
     * @returns {ArFSPrivateFileOrFolderWithPaths[]} an array representation of the children and parent folder
     */
    listPrivateFolder({ folderId, driveKey, maxDepth = 0, includeRoot = false, owner }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!owner) {
                owner = yield this.arFsDao.getDriveOwnerForFolderId(folderId);
            }
            yield this.assertOwnerAddress(owner);
            const children = this.arFsDao.listPrivateFolder({ folderId, driveKey, maxDepth, includeRoot, owner });
            return children;
        });
    }
    /** Throw an error if wallet balance does not cover cost of the provided winston  */
    assertWalletBalance(winston) {
        return __awaiter(this, void 0, void 0, function* () {
            const walletHasBalance = yield this.walletDao.walletHasBalance(this.wallet, winston);
            if (!walletHasBalance) {
                const walletBalance = yield this.walletDao.getWalletWinstonBalance(this.wallet);
                throw new Error(`Wallet balance of ${walletBalance} Winston is not enough (${winston}) for this action!`);
            }
        });
    }
    estimateAndAssertCostOfMoveFile(fileTransactionData) {
        return __awaiter(this, void 0, void 0, function* () {
            const fileMetaTransactionDataReward = yield this.priceEstimator.getBaseWinstonPriceForByteCount(fileTransactionData.sizeOf());
            const walletHasBalance = yield this.walletDao.walletHasBalance(this.wallet, fileMetaTransactionDataReward);
            if (!walletHasBalance) {
                const walletBalance = yield this.walletDao.getWalletWinstonBalance(this.wallet);
                throw new Error(`Wallet balance of ${walletBalance} Winston is not enough (${fileMetaTransactionDataReward}) for moving file!`);
            }
            return { metaDataBaseReward: fileMetaTransactionDataReward };
        });
    }
    estimateAndAssertCostOfFileUpload(decryptedFileSize, metaData, drivePrivacy) {
        return __awaiter(this, void 0, void 0, function* () {
            let fileSize = decryptedFileSize;
            if (drivePrivacy === 'private') {
                fileSize = common_1.encryptedDataSize(fileSize);
            }
            let totalPrice = types_1.W(0);
            let fileDataBaseReward = types_1.W(0);
            let communityWinstonTip = types_1.W(0);
            if (fileSize) {
                fileDataBaseReward = yield this.priceEstimator.getBaseWinstonPriceForByteCount(fileSize);
                communityWinstonTip = yield this.communityOracle.getCommunityWinstonTip(fileDataBaseReward);
                const tipReward = yield this.priceEstimator.getBaseWinstonPriceForByteCount(new types_1.ByteCount(0));
                totalPrice = totalPrice.plus(fileDataBaseReward);
                totalPrice = totalPrice.plus(communityWinstonTip);
                totalPrice = totalPrice.plus(tipReward);
            }
            const metaDataBaseReward = yield this.priceEstimator.getBaseWinstonPriceForByteCount(metaData.sizeOf());
            totalPrice = totalPrice.plus(metaDataBaseReward);
            const totalWinstonPrice = totalPrice;
            const walletHasBalance = yield this.walletDao.walletHasBalance(this.wallet, totalWinstonPrice);
            if (!walletHasBalance) {
                const walletBalance = yield this.walletDao.getWalletWinstonBalance(this.wallet);
                throw new Error(`Wallet balance of ${walletBalance} Winston is not enough (${totalWinstonPrice}) for data upload of size ${fileSize} bytes!`);
            }
            return {
                fileDataBaseReward: fileDataBaseReward,
                metaDataBaseReward: metaDataBaseReward,
                communityWinstonTip
            };
        });
    }
    estimateAndAssertCostOfFolderUpload(metaData) {
        return __awaiter(this, void 0, void 0, function* () {
            const metaDataBaseReward = yield this.priceEstimator.getBaseWinstonPriceForByteCount(metaData.sizeOf());
            const totalWinstonPrice = metaDataBaseReward;
            const walletHasBalance = yield this.walletDao.walletHasBalance(this.wallet, totalWinstonPrice);
            if (!walletHasBalance) {
                const walletBalance = yield this.walletDao.getWalletWinstonBalance(this.wallet);
                throw new Error(`Wallet balance of ${walletBalance} Winston is not enough (${totalWinstonPrice}) for folder creation!`);
            }
            return {
                metaDataBaseReward: totalWinstonPrice
            };
        });
    }
    getDriveIdForFileId(fileId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.arFsDao.getDriveIdForFileId(fileId);
        });
    }
    getDriveIdForFolderId(folderId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.arFsDao.getDriveIdForFolderId(folderId);
        });
    }
    // Provides for stubbing metadata during cost estimations since the data tx ID won't yet be known
    stubPublicFileMetadata(wrappedFile, destinationFileName) {
        const { fileSize, dataContentType, lastModifiedDateMS } = wrappedFile.gatherFileInfo();
        return new arfs_tx_data_types_1.ArFSPublicFileMetadataTransactionData(destinationFileName !== null && destinationFileName !== void 0 ? destinationFileName : wrappedFile.getBaseFileName(), fileSize, lastModifiedDateMS, types_1.stubTransactionID, dataContentType);
    }
    // Provides for stubbing metadata during cost estimations since the data tx and File IDs won't yet be known
    stubPrivateFileMetadata(wrappedFile, destinationFileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const { fileSize, dataContentType, lastModifiedDateMS } = wrappedFile.gatherFileInfo();
            return yield arfs_tx_data_types_1.ArFSPrivateFileMetadataTransactionData.from(destinationFileName !== null && destinationFileName !== void 0 ? destinationFileName : wrappedFile.getBaseFileName(), fileSize, lastModifiedDateMS, types_1.stubTransactionID, dataContentType, constants_1.fakeEntityId, yield crypto_1.deriveDriveKey('stubPassword', `${constants_1.fakeEntityId}`, JSON.stringify(this.wallet.getPrivateKey())));
        });
    }
    assertValidPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.arFsDao.assertValidPassword(password);
        });
    }
    downloadPrivateFile({ fileId, driveKey, destFolderPath, defaultFileName }) {
        return __awaiter(this, void 0, void 0, function* () {
            assert_folder_1.assertFolderExists(destFolderPath);
            const privateFile = yield this.getPrivateFile({ fileId, driveKey });
            const outputFileName = defaultFileName !== null && defaultFileName !== void 0 ? defaultFileName : privateFile.name;
            const fullPath = path_1.join(destFolderPath, outputFileName);
            const data = yield this.arFsDao.getPrivateDataStream(privateFile);
            const fileKey = yield crypto_1.deriveFileKey(`${fileId}`, driveKey);
            const fileCipherIV = yield this.arFsDao.getPrivateTransactionCipherIV(privateFile.dataTxId);
            const authTag = yield this.arFsDao.getAuthTagForPrivateFile(privateFile);
            const decipher = new stream_decrypt_1.StreamDecrypt(fileCipherIV, fileKey, authTag);
            const fileToDownload = new arfs_file_wrapper_1.ArFSPrivateFileToDownload(privateFile, data, fullPath, decipher);
            yield fileToDownload.write();
        });
    }
}
exports.ArDrive = ArDrive;
