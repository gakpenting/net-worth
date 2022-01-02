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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArFSDAO = exports.PrivateDriveKeyData = void 0;
const uuid_1 = require("uuid");
const arfs_drive_builders_1 = require("./arfs_builders/arfs_drive_builders");
const arfs_file_builders_1 = require("./arfs_builders/arfs_file_builders");
const arfs_folder_builders_1 = require("./arfs_builders/arfs_folder_builders");
const arfs_entities_1 = require("./arfs_entities");
const arfs_prototypes_1 = require("./arfs_prototypes");
const arfs_tx_data_types_1 = require("./arfs_tx_data_types");
const folderHierarchy_1 = require("./folderHierarchy");
const arfsdao_anonymous_1 = require("./arfsdao_anonymous");
const constants_1 = require("../utils/constants");
const crypto_1 = require("../utils/crypto");
const private_key_data_1 = require("./private_key_data");
const types_1 = require("../types");
const filter_methods_1 = require("../utils/filter_methods");
const mapper_functions_1 = require("../utils/mapper_functions");
const query_1 = require("../utils/query");
const arbundles_1 = require("arbundles");
const signing_1 = require("arbundles/src/signing");
const cost_estimator_types_1 = require("../types/cost_estimator_types");
const arfs_tag_settings_1 = require("./arfs_tag_settings");
const axios_1 = __importDefault(require("axios"));
/** Utility class for holding the driveId and driveKey of a new drive */
class PrivateDriveKeyData {
    constructor(driveId, driveKey) {
        this.driveId = driveId;
        this.driveKey = driveKey;
    }
    static from(drivePassword, privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const driveId = uuid_1.v4();
            const driveKey = yield crypto_1.deriveDriveKey(drivePassword, driveId, JSON.stringify(privateKey));
            return new PrivateDriveKeyData(types_1.EID(driveId), driveKey);
        });
    }
}
exports.PrivateDriveKeyData = PrivateDriveKeyData;
class ArFSDAO extends arfsdao_anonymous_1.ArFSDAOAnonymous {
    // TODO: Can we abstract Arweave type(s)?
    constructor(wallet, arweave, dryRun = false, 
    /** @deprecated App Name should be provided with ArFSTagSettings  */
    appName = constants_1.DEFAULT_APP_NAME, 
    /** @deprecated App Version should be provided with ArFSTagSettings  */
    appVersion = constants_1.DEFAULT_APP_VERSION, arFSTagSettings = new arfs_tag_settings_1.ArFSTagSettings({ appName, appVersion })) {
        super(arweave);
        this.wallet = wallet;
        this.dryRun = dryRun;
        this.appName = appName;
        this.appVersion = appVersion;
        this.arFSTagSettings = arFSTagSettings;
    }
    /** Prepare an ArFS folder entity for upload */
    prepareFolder({ folderPrototypeFactory, prepareArFSObject }) {
        return __awaiter(this, void 0, void 0, function* () {
            // Generate a new folder ID
            const folderId = types_1.EID(uuid_1.v4());
            // Create a folder metadata transaction
            const folderMetadata = folderPrototypeFactory(folderId);
            // Prepare the ArFS folder transaction or dataItem
            const arFSObjects = [yield prepareArFSObject(folderMetadata)];
            return { arFSObjects, folderId };
        });
    }
    /** Create a single folder as a V2 transaction */
    createFolder(folderPrototypeFactory, rewardSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            const { arFSObjects, folderId } = yield this.prepareFolder({
                folderPrototypeFactory,
                prepareArFSObject: (folderMetaData) => this.prepareArFSObjectTransaction({ objectMetaData: folderMetaData, rewardSettings })
            });
            const folderTx = arFSObjects[0];
            yield this.sendTransactionsAsChunks([folderTx]);
            return { metaDataTxId: types_1.TxID(folderTx.id), metaDataTxReward: types_1.W(folderTx.reward), folderId };
        });
    }
    /** Create a single private folder as a V2 transaction */
    createPrivateFolder({ driveId, rewardSettings, parentFolderId, folderData }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.createFolder((folderId) => new arfs_prototypes_1.ArFSPrivateFolderMetaDataPrototype(driveId, folderId, folderData, parentFolderId), rewardSettings);
        });
    }
    /** Create a single public folder as a V2 transaction */
    createPublicFolder({ driveId, rewardSettings, parentFolderId, folderData }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.createFolder((folderId) => new arfs_prototypes_1.ArFSPublicFolderMetaDataPrototype(folderData, driveId, folderId, parentFolderId), rewardSettings);
        });
    }
    /** Prepare an ArFS drive entity for upload */
    prepareDrive({ drivePrototypeFactory, prepareArFSObject, rootFolderPrototypeFactory, generateDriveIdFn }) {
        return __awaiter(this, void 0, void 0, function* () {
            // Generate a new drive ID for the new drive
            const driveId = generateDriveIdFn();
            // Create ArFS root folder object
            const { arFSObjects, folderId: rootFolderId } = yield this.prepareFolder({
                folderPrototypeFactory: (folderId) => rootFolderPrototypeFactory(folderId, driveId),
                prepareArFSObject
            });
            const rootFolderArFSObject = arFSObjects[0];
            // Create ArFS drive object
            const driveMetaData = yield drivePrototypeFactory(driveId, rootFolderId);
            const driveArFSObject = yield prepareArFSObject(driveMetaData);
            return { arFSObjects: [rootFolderArFSObject, driveArFSObject], driveId, rootFolderId };
        });
    }
    /** Create drive and root folder together as bundled transaction */
    createBundledDrive(sharedPrepDriveParams, rewardSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            const { arFSObjects, driveId, rootFolderId } = yield this.prepareDrive(Object.assign(Object.assign({}, sharedPrepDriveParams), { prepareArFSObject: (objectMetaData) => this.prepareArFSDataItem({
                    objectMetaData
                }) }));
            // Pack data items into a bundle
            const bundledTx = yield this.prepareArFSObjectBundle({ dataItems: arFSObjects, rewardSettings });
            const [rootFolderDataItem, driveDataItem] = arFSObjects;
            return {
                transactions: [bundledTx],
                result: {
                    bundleTxId: types_1.TxID(bundledTx.id),
                    bundleTxReward: types_1.W(bundledTx.reward),
                    driveId,
                    metaDataTxId: types_1.TxID(driveDataItem.id),
                    rootFolderId,
                    rootFolderTxId: types_1.TxID(rootFolderDataItem.id)
                }
            };
        });
    }
    /** Create drive and root folder as separate V2 transactions */
    createV2TxDrive(sharedPrepDriveParams, { driveRewardSettings, rootFolderRewardSettings }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { arFSObjects, driveId, rootFolderId } = yield this.prepareDrive(Object.assign(Object.assign({}, sharedPrepDriveParams), { prepareArFSObject: (objectMetaData) => this.prepareArFSObjectTransaction({
                    objectMetaData,
                    rewardSettings: 
                    // Type-check the metadata to conditionally pass correct reward setting
                    objectMetaData instanceof arfs_prototypes_1.ArFSDriveMetaDataPrototype
                        ? driveRewardSettings
                        : rootFolderRewardSettings
                }) }));
            const [rootFolderTx, driveTx] = arFSObjects;
            return {
                transactions: arFSObjects,
                result: {
                    metaDataTxId: types_1.TxID(driveTx.id),
                    metaDataTxReward: types_1.W(driveTx.reward),
                    driveId,
                    rootFolderId,
                    rootFolderTxId: types_1.TxID(rootFolderTx.id),
                    rootFolderTxReward: types_1.W(rootFolderTx.reward)
                }
            };
        });
    }
    /**
     * Create drive and root folder as a V2 transaction
     * OR a direct to network bundled transaction
     *
     * @remarks To bundle or not is determined during cost estimation,
     * and the provided rewardSettings will be type checked here to
     * determine the result type
     */
    createDrive(sharedPrepDriveParams, rewardSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            const { transactions, result } = cost_estimator_types_1.isBundleRewardSetting(rewardSettings)
                ? yield this.createBundledDrive(sharedPrepDriveParams, rewardSettings.bundleRewardSettings)
                : yield this.createV2TxDrive(sharedPrepDriveParams, rewardSettings);
            // Upload all v2 transactions or direct to network bundles
            yield this.sendTransactionsAsChunks(transactions);
            return result;
        });
    }
    /** Create an ArFS public drive */
    createPublicDrive({ driveName, rewardSettings }) {
        return __awaiter(this, void 0, void 0, function* () {
            const folderData = new arfs_tx_data_types_1.ArFSPublicFolderTransactionData(driveName);
            const prepPublicDriveParams = {
                rootFolderPrototypeFactory: (folderId, driveId) => new arfs_prototypes_1.ArFSPublicFolderMetaDataPrototype(folderData, driveId, folderId),
                generateDriveIdFn: () => types_1.EID(uuid_1.v4()),
                drivePrototypeFactory: (driveId, rootFolderId) => __awaiter(this, void 0, void 0, function* () {
                    return Promise.resolve(new arfs_prototypes_1.ArFSPublicDriveMetaDataPrototype(new arfs_tx_data_types_1.ArFSPublicDriveTransactionData(driveName, rootFolderId), driveId));
                })
            };
            return this.createDrive(prepPublicDriveParams, rewardSettings);
        });
    }
    /** Create an ArFS private drive */
    createPrivateDrive({ driveName, rewardSettings, newDriveData }) {
        return __awaiter(this, void 0, void 0, function* () {
            const folderData = yield arfs_tx_data_types_1.ArFSPrivateFolderTransactionData.from(driveName, newDriveData.driveKey);
            const prepPrivateDriveParams = {
                rootFolderPrototypeFactory: (folderId, driveId) => new arfs_prototypes_1.ArFSPrivateFolderMetaDataPrototype(driveId, folderId, folderData),
                generateDriveIdFn: () => newDriveData.driveId,
                drivePrototypeFactory: (driveId, rootFolderId) => __awaiter(this, void 0, void 0, function* () {
                    return Promise.resolve(new arfs_prototypes_1.ArFSPrivateDriveMetaDataPrototype(driveId, yield arfs_tx_data_types_1.ArFSPrivateDriveTransactionData.from(driveName, rootFolderId, newDriveData.driveKey)));
                })
            };
            return Object.assign(Object.assign({}, (yield this.createDrive(prepPrivateDriveParams, rewardSettings))), { driveKey: folderData.driveKey });
        });
    }
    moveEntity(metaDataBaseReward, metaDataFactory, resultFactory) {
        return __awaiter(this, void 0, void 0, function* () {
            const metadataPrototype = metaDataFactory();
            // Prepare meta data transaction
            const metaDataTx = yield this.prepareArFSObjectTransaction({
                objectMetaData: metadataPrototype,
                rewardSettings: metaDataBaseReward
            });
            // Upload meta data
            if (!this.dryRun) {
                const metaDataUploader = yield this.arweave.transactions.getUploader(metaDataTx);
                while (!metaDataUploader.isComplete) {
                    yield metaDataUploader.uploadChunk();
                }
            }
            return resultFactory({ metaDataTxId: types_1.TxID(metaDataTx.id), metaDataTxReward: types_1.W(metaDataTx.reward) });
        });
    }
    movePublicFile({ metaDataBaseReward, originalMetaData, transactionData, newParentFolderId }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.moveEntity(metaDataBaseReward, () => {
                return new arfs_prototypes_1.ArFSPublicFileMetaDataPrototype(transactionData, originalMetaData.driveId, originalMetaData.fileId, newParentFolderId);
            }, (results) => {
                return Object.assign(Object.assign({}, results), { dataTxId: originalMetaData.dataTxId });
            });
        });
    }
    movePrivateFile({ metaDataBaseReward, originalMetaData, transactionData, newParentFolderId }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.moveEntity(metaDataBaseReward, () => {
                return new arfs_prototypes_1.ArFSPrivateFileMetaDataPrototype(transactionData, originalMetaData.driveId, originalMetaData.fileId, newParentFolderId);
            }, (results) => {
                return Object.assign(Object.assign({}, results), { dataTxId: originalMetaData.dataTxId, fileKey: transactionData.fileKey });
            });
        });
    }
    movePublicFolder({ metaDataBaseReward, originalMetaData, transactionData, newParentFolderId }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.moveEntity(metaDataBaseReward, () => {
                return new arfs_prototypes_1.ArFSPublicFolderMetaDataPrototype(transactionData, originalMetaData.driveId, originalMetaData.entityId, newParentFolderId);
            }, (results) => results);
        });
    }
    movePrivateFolder({ metaDataBaseReward, originalMetaData, transactionData, newParentFolderId }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.moveEntity(metaDataBaseReward, () => {
                return new arfs_prototypes_1.ArFSPrivateFolderMetaDataPrototype(originalMetaData.driveId, originalMetaData.entityId, transactionData, newParentFolderId);
            }, (results) => {
                return Object.assign(Object.assign({}, results), { driveKey: transactionData.driveKey });
            });
        });
    }
    uploadFile(wrappedFile, fileDataRewardSettings, metadataRewardSettings, dataPrototypeFactoryFn, metadataTxDataFactoryFn, metadataFactoryFn, resultFactoryFn, destFileName, existingFileId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Establish destination file name
            const destinationFileName = destFileName !== null && destFileName !== void 0 ? destFileName : wrappedFile.getBaseFileName();
            // Use existing file ID (create a revision) or generate new file ID
            const fileId = existingFileId !== null && existingFileId !== void 0 ? existingFileId : types_1.EID(uuid_1.v4());
            // Gather file information
            const { fileSize, dataContentType, lastModifiedDateMS } = wrappedFile.gatherFileInfo();
            // Read file data into memory
            const fileData = wrappedFile.getFileDataBuffer();
            // Build file data transaction
            const fileDataPrototype = yield dataPrototypeFactoryFn(fileData, dataContentType, fileId);
            const dataTx = yield this.prepareArFSObjectTransaction({
                objectMetaData: fileDataPrototype,
                rewardSettings: fileDataRewardSettings,
                excludedTagNames: ['ArFS']
            });
            // Upload file data
            if (!this.dryRun) {
                const dataUploader = yield this.arweave.transactions.getUploader(dataTx);
                while (!dataUploader.isComplete) {
                    yield dataUploader.uploadChunk();
                }
            }
            // Prepare meta data transaction
            const metadataTxData = yield metadataTxDataFactoryFn(destinationFileName, fileSize, lastModifiedDateMS, types_1.TxID(dataTx.id), dataContentType, fileId);
            const fileMetadata = metadataFactoryFn(metadataTxData, fileId);
            const metaDataTx = yield this.prepareArFSObjectTransaction({
                objectMetaData: fileMetadata,
                rewardSettings: metadataRewardSettings
            });
            // Upload meta data
            if (!this.dryRun) {
                const metaDataUploader = yield this.arweave.transactions.getUploader(metaDataTx);
                while (!metaDataUploader.isComplete) {
                    yield metaDataUploader.uploadChunk();
                }
            }
            return resultFactoryFn({
                dataTxId: types_1.TxID(dataTx.id),
                dataTxReward: types_1.W(dataTx.reward),
                metaDataTxId: types_1.TxID(metaDataTx.id),
                metaDataTxReward: types_1.W(metaDataTx.reward),
                fileId
            }, metadataTxData);
        });
    }
    uploadPublicFile({ parentFolderId, wrappedFile, driveId, fileDataRewardSettings, metadataRewardSettings, destFileName, existingFileId }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.uploadFile(wrappedFile, fileDataRewardSettings, metadataRewardSettings, (fileData, dataContentType) => __awaiter(this, void 0, void 0, function* () {
                return new arfs_prototypes_1.ArFSPublicFileDataPrototype(new arfs_tx_data_types_1.ArFSPublicFileDataTransactionData(fileData), dataContentType);
            }), (destinationFileName, fileSize, lastModifiedDateMS, dataTxId, dataContentType) => __awaiter(this, void 0, void 0, function* () {
                return new arfs_tx_data_types_1.ArFSPublicFileMetadataTransactionData(destinationFileName, fileSize, lastModifiedDateMS, dataTxId, dataContentType);
            }), (metadataTxData, fileId) => {
                return new arfs_prototypes_1.ArFSPublicFileMetaDataPrototype(metadataTxData, driveId, fileId, parentFolderId);
            }, (result) => result, // no change
            destFileName, existingFileId);
        });
    }
    uploadPrivateFile({ parentFolderId, wrappedFile, driveId, driveKey, fileDataRewardSettings, metadataRewardSettings, destFileName, existingFileId }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.uploadFile(wrappedFile, fileDataRewardSettings, metadataRewardSettings, (fileData, _dataContentType, fileId) => __awaiter(this, void 0, void 0, function* () {
                const txData = yield arfs_tx_data_types_1.ArFSPrivateFileDataTransactionData.from(fileData, fileId, driveKey);
                return new arfs_prototypes_1.ArFSPrivateFileDataPrototype(txData);
            }), (destinationFileName, fileSize, lastModifiedDateMS, dataTxId, dataContentType, fileId) => __awaiter(this, void 0, void 0, function* () {
                return yield arfs_tx_data_types_1.ArFSPrivateFileMetadataTransactionData.from(destinationFileName, fileSize, lastModifiedDateMS, dataTxId, dataContentType, fileId, driveKey);
            }), (metadataTxData, fileId) => {
                return new arfs_prototypes_1.ArFSPrivateFileMetaDataPrototype(metadataTxData, driveId, fileId, parentFolderId);
            }, (result, txData) => {
                return Object.assign(Object.assign({}, result), { fileKey: txData.fileKey }); // add the file key to the result data
            }, destFileName, existingFileId);
        });
    }
    prepareArFSDataItem({ objectMetaData, excludedTagNames = [], otherTags = [] }) {
        return __awaiter(this, void 0, void 0, function* () {
            // Enforce that other tags are not protected
            objectMetaData.assertProtectedTags(otherTags);
            const tags = this.arFSTagSettings.baseArFSTagsIncluding({
                tags: [...objectMetaData.gqlTags, ...otherTags],
                excludedTagNames
            });
            const signer = new signing_1.ArweaveSigner(this.wallet.getPrivateKey());
            // Sign the data item
            const dataItem = arbundles_1.createData(objectMetaData.objectData.asTransactionData(), signer, { tags });
            yield dataItem.sign(signer);
            return dataItem;
        });
    }
    prepareArFSObjectBundle({ dataItems, rewardSettings = {}, excludedTagNames = [], otherTags = [] }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const wallet = this.wallet;
            const signer = new signing_1.ArweaveSigner(wallet.getPrivateKey());
            const bundle = yield arbundles_1.bundleAndSignData(dataItems, signer);
            // Verify the bundle and dataItems
            if (!(yield bundle.verify())) {
                throw new Error('Bundle format could not be verified!');
            }
            // We use arweave directly to create our transaction so we can assign our own reward and skip network request
            const bundledDataTx = yield this.arweave.createTransaction({
                data: bundle.getRaw(),
                // If we provided our own reward setting, use it now
                reward: rewardSettings.reward ? rewardSettings.reward.toString() : undefined,
                // TODO: Use a mock arweave server instead
                last_tx: process.env.NODE_ENV === 'test' ? 'STUB' : undefined
            });
            // If we've opted to boost the transaction, do so now
            if ((_a = rewardSettings.feeMultiple) === null || _a === void 0 ? void 0 : _a.wouldBoostReward()) {
                bundledDataTx.reward = rewardSettings.feeMultiple.boostReward(bundledDataTx.reward);
                // Add a Boost tag
                otherTags.push({ name: 'Boost', value: rewardSettings.feeMultiple.toString() });
            }
            const tags = this.arFSTagSettings.baseBundleTagsIncluding({
                tags: otherTags,
                excludedTagNames
            });
            for (const tag of tags) {
                bundledDataTx.addTag(tag.name, tag.value);
            }
            yield this.arweave.transactions.sign(bundledDataTx, wallet.getPrivateKey());
            return bundledDataTx;
        });
    }
    prepareArFSObjectTransaction({ objectMetaData, rewardSettings = {}, excludedTagNames = [], otherTags = [] }) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            // Enforce that other tags are not protected
            objectMetaData.assertProtectedTags(otherTags);
            // Create transaction
            const txAttributes = {
                data: objectMetaData.objectData.asTransactionData()
            };
            // If we provided our own reward setting, use it now
            if (rewardSettings.reward) {
                txAttributes.reward = rewardSettings.reward.toString();
            }
            // TODO: Use a mock arweave server instead
            if (process.env.NODE_ENV === 'test') {
                txAttributes.last_tx = 'STUB';
            }
            const wallet = this.wallet;
            const transaction = yield this.arweave.createTransaction(txAttributes, wallet.getPrivateKey());
            // If we've opted to boost the transaction, do so now
            if ((_a = rewardSettings.feeMultiple) === null || _a === void 0 ? void 0 : _a.wouldBoostReward()) {
                transaction.reward = rewardSettings.feeMultiple.boostReward(transaction.reward);
                // Add a Boost tag
                otherTags.push({ name: 'Boost', value: rewardSettings.feeMultiple.toString() });
            }
            const tags = this.arFSTagSettings.baseArFSTagsIncluding({
                tags: [...objectMetaData.gqlTags, ...otherTags],
                excludedTagNames
            });
            for (const tag of tags) {
                transaction.addTag(tag.name, tag.value);
            }
            // Sign the transaction
            yield this.arweave.transactions.sign(transaction, wallet.getPrivateKey());
            return transaction;
        });
    }
    sendTransactionsAsChunks(transactions) {
        return __awaiter(this, void 0, void 0, function* () {
            // Execute the uploads
            if (!this.dryRun) {
                yield Promise.all(transactions.map((transaction) => __awaiter(this, void 0, void 0, function* () {
                    const driveUploader = yield this.arweave.transactions.getUploader(transaction);
                    while (!driveUploader.isComplete) {
                        yield driveUploader.uploadChunk();
                    }
                })));
            }
        });
    }
    // Convenience function for known-private use cases
    getPrivateDrive(driveId, driveKey, owner) {
        return __awaiter(this, void 0, void 0, function* () {
            return new arfs_drive_builders_1.ArFSPrivateDriveBuilder({ entityId: driveId, arweave: this.arweave, key: driveKey, owner }).build();
        });
    }
    // Convenience function for known-private use cases
    getPrivateFolder(folderId, driveKey, owner) {
        return __awaiter(this, void 0, void 0, function* () {
            return new arfs_folder_builders_1.ArFSPrivateFolderBuilder(folderId, this.arweave, driveKey, owner).build();
        });
    }
    getPrivateFile(fileId, driveKey, owner) {
        return __awaiter(this, void 0, void 0, function* () {
            return new arfs_file_builders_1.ArFSPrivateFileBuilder(fileId, this.arweave, driveKey, owner).build();
        });
    }
    getAllFoldersOfPrivateDrive({ driveId, driveKey, owner, latestRevisionsOnly = false }) {
        return __awaiter(this, void 0, void 0, function* () {
            let cursor = '';
            let hasNextPage = true;
            const allFolders = [];
            while (hasNextPage) {
                const gqlQuery = query_1.buildQuery({
                    tags: [
                        { name: 'Drive-Id', value: `${driveId}` },
                        { name: 'Entity-Type', value: 'folder' }
                    ],
                    cursor,
                    owner
                });
                const response = yield this.arweave.api.post(constants_1.graphQLURL, gqlQuery);
                const { data } = response.data;
                const { transactions } = data;
                const { edges } = transactions;
                hasNextPage = transactions.pageInfo.hasNextPage;
                const folders = edges.map((edge) => __awaiter(this, void 0, void 0, function* () {
                    cursor = edge.cursor;
                    const { node } = edge;
                    const folderBuilder = yield arfs_folder_builders_1.ArFSPrivateFolderBuilder.fromArweaveNode(node, this.arweave, driveKey);
                    return yield folderBuilder.build(node);
                }));
                allFolders.push(...(yield Promise.all(folders)));
            }
            return latestRevisionsOnly ? allFolders.filter(filter_methods_1.latestRevisionFilter) : allFolders;
        });
    }
    getPrivateFilesWithParentFolderIds(folderIDs, driveKey, owner, latestRevisionsOnly = false) {
        return __awaiter(this, void 0, void 0, function* () {
            let cursor = '';
            let hasNextPage = true;
            const allFiles = [];
            while (hasNextPage) {
                const gqlQuery = query_1.buildQuery({
                    tags: [
                        { name: 'Parent-Folder-Id', value: folderIDs.map((fid) => fid.toString()) },
                        { name: 'Entity-Type', value: 'file' }
                    ],
                    cursor,
                    owner
                });
                const response = yield this.arweave.api.post(constants_1.graphQLURL, gqlQuery);
                const { data } = response.data;
                const { transactions } = data;
                const { edges } = transactions;
                hasNextPage = transactions.pageInfo.hasNextPage;
                const files = edges.map((edge) => __awaiter(this, void 0, void 0, function* () {
                    const { node } = edge;
                    cursor = edge.cursor;
                    const fileBuilder = yield arfs_file_builders_1.ArFSPrivateFileBuilder.fromArweaveNode(node, this.arweave, driveKey);
                    return yield fileBuilder.build(node);
                }));
                allFiles.push(...(yield Promise.all(files)));
            }
            return latestRevisionsOnly ? allFiles.filter(filter_methods_1.latestRevisionFilter) : allFiles;
        });
    }
    getEntitiesInFolder(parentFolderId, builder, latestRevisionsOnly = true, filterOnOwner = true) {
        return __awaiter(this, void 0, void 0, function* () {
            let cursor = '';
            let hasNextPage = true;
            const allEntities = [];
            // TODO: Derive the owner of a wallet from earliest transaction of a drive by default
            const owner = yield this.wallet.getAddress();
            while (hasNextPage) {
                const gqlQuery = query_1.buildQuery({
                    tags: [
                        { name: 'Parent-Folder-Id', value: `${parentFolderId}` },
                        { name: 'Entity-Type', value: ['file', 'folder'] }
                    ],
                    cursor,
                    owner: filterOnOwner ? owner : undefined
                });
                const response = yield this.arweave.api.post(constants_1.graphQLURL, gqlQuery);
                const { data } = response.data;
                const { transactions } = data;
                const { edges } = transactions;
                hasNextPage = transactions.pageInfo.hasNextPage;
                const folders = edges.map((edge) => __awaiter(this, void 0, void 0, function* () {
                    var _a;
                    const { node } = edge;
                    cursor = edge.cursor;
                    const { tags } = node;
                    // Check entityType to determine which builder to use
                    const entityType = (_a = tags.find((t) => t.name === 'Entity-Type')) === null || _a === void 0 ? void 0 : _a.value;
                    if (!entityType || (entityType !== 'file' && entityType !== 'folder')) {
                        throw new Error('Entity-Type tag is missing or invalid!');
                    }
                    return builder(node, entityType).build(node);
                }));
                allEntities.push(...(yield Promise.all(folders)));
            }
            return latestRevisionsOnly ? allEntities.filter(filter_methods_1.latestRevisionFilter) : allEntities;
        });
    }
    getPrivateEntitiesInFolder(parentFolderId, driveKey, latestRevisionsOnly = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getEntitiesInFolder(parentFolderId, (node, entityType) => entityType === 'folder'
                ? arfs_folder_builders_1.ArFSPrivateFolderBuilder.fromArweaveNode(node, this.arweave, driveKey)
                : arfs_file_builders_1.ArFSPrivateFileBuilder.fromArweaveNode(node, this.arweave, driveKey), latestRevisionsOnly);
        });
    }
    getPublicEntitiesInFolder(parentFolderId, latestRevisionsOnly = true) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getEntitiesInFolder(parentFolderId, (node, entityType) => entityType === 'folder'
                ? arfs_folder_builders_1.ArFSPublicFolderBuilder.fromArweaveNode(node, this.arweave)
                : arfs_file_builders_1.ArFSPublicFileBuilder.fromArweaveNode(node, this.arweave), latestRevisionsOnly);
        });
    }
    getChildrenFolderIds(folderId, allFolderEntitiesOfDrive) {
        return __awaiter(this, void 0, void 0, function* () {
            const hierarchy = folderHierarchy_1.FolderHierarchy.newFromEntities(allFolderEntitiesOfDrive);
            return hierarchy.folderIdSubtreeFromFolderId(folderId, Number.MAX_SAFE_INTEGER);
        });
    }
    getPrivateEntityNamesInFolder(folderId, driveKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const childrenOfFolder = yield this.getPrivateEntitiesInFolder(folderId, driveKey, true);
            return childrenOfFolder.map(mapper_functions_1.entityToNameMap);
        });
    }
    getPublicEntityNamesInFolder(folderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const childrenOfFolder = yield this.getPublicEntitiesInFolder(folderId, true);
            return childrenOfFolder.map(mapper_functions_1.entityToNameMap);
        });
    }
    getPublicNameConflictInfoInFolder(folderId) {
        return __awaiter(this, void 0, void 0, function* () {
            const childrenOfFolder = yield this.getPublicEntitiesInFolder(folderId, true);
            return {
                files: childrenOfFolder.filter(filter_methods_1.fileFilter).map(mapper_functions_1.fileConflictInfoMap),
                folders: childrenOfFolder.filter(filter_methods_1.folderFilter).map(mapper_functions_1.folderToNameAndIdMap)
            };
        });
    }
    getPrivateNameConflictInfoInFolder(folderId, driveKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const childrenOfFolder = yield this.getPrivateEntitiesInFolder(folderId, driveKey, true);
            return {
                files: childrenOfFolder.filter(filter_methods_1.fileFilter).map(mapper_functions_1.fileConflictInfoMap),
                folders: childrenOfFolder.filter(filter_methods_1.folderFilter).map(mapper_functions_1.folderToNameAndIdMap)
            };
        });
    }
    getPrivateChildrenFolderIds({ folderId, driveId, driveKey, owner }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getChildrenFolderIds(folderId, yield this.getAllFoldersOfPrivateDrive({ driveId, driveKey, owner, latestRevisionsOnly: true }));
        });
    }
    getPublicChildrenFolderIds({ folderId, owner, driveId }) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.getChildrenFolderIds(folderId, yield this.getAllFoldersOfPublicDrive({ driveId, owner, latestRevisionsOnly: true }));
        });
    }
    getOwnerAndAssertDrive(driveId, driveKey) {
        return __awaiter(this, void 0, void 0, function* () {
            const gqlQuery = query_1.buildQuery({
                tags: [
                    { name: 'Entity-Type', value: 'drive' },
                    { name: 'Drive-Id', value: `${driveId}` }
                ],
                sort: query_1.ASCENDING_ORDER
            });
            const response = yield this.arweave.api.post(constants_1.graphQLURL, gqlQuery);
            const edges = response.data.data.transactions.edges;
            if (!edges.length) {
                throw new Error(`Could not find a transaction with "Drive-Id": ${driveId}`);
            }
            const edgeOfFirstDrive = edges[0];
            const drivePrivacy = driveKey ? 'private' : 'public';
            const drivePrivacyFromTag = edgeOfFirstDrive.node.tags.find((t) => t.name === 'Drive-Privacy');
            if (!drivePrivacyFromTag) {
                throw new Error('Target drive has no "Drive-Privacy" tag!');
            }
            if (drivePrivacyFromTag.value !== drivePrivacy) {
                throw new Error(`Target drive is not a ${drivePrivacy} drive!`);
            }
            if (driveKey) {
                const cipherIVFromTag = edgeOfFirstDrive.node.tags.find((t) => t.name === 'Cipher-IV');
                if (!cipherIVFromTag) {
                    throw new Error('Target private drive has no "Cipher-IV" tag!');
                }
                const driveDataBuffer = Buffer.from(yield this.arweave.transactions.getData(edgeOfFirstDrive.node.id, { decode: true }));
                try {
                    // Attempt to decrypt drive to assert drive key is correct
                    yield crypto_1.driveDecrypt(cipherIVFromTag.value, driveKey, driveDataBuffer);
                }
                catch (_a) {
                    throw new Error('Provided drive key or password could not decrypt target private drive!');
                }
            }
            const driveOwnerAddress = edgeOfFirstDrive.node.owner.address;
            return new types_1.ArweaveAddress(driveOwnerAddress);
        });
    }
    /**
     * Lists the children of certain private folder
     * @param {FolderID} folderId the folder ID to list children of
     * @param {DriveKey} driveKey the drive key used for drive and folder data decryption and file key derivation
     * @param {number} maxDepth a non-negative integer value indicating the depth of the folder tree to list where 0 = this folder's contents only
     * @param {boolean} includeRoot whether or not folderId's folder data should be included in the listing
     * @returns {ArFSPrivateFileOrFolderWithPaths[]} an array representation of the children and parent folder
     */
    listPrivateFolder({ folderId, driveKey, maxDepth, includeRoot, owner }) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Number.isInteger(maxDepth) || maxDepth < 0) {
                throw new Error('maxDepth should be a non-negative integer!');
            }
            const folder = yield this.getPrivateFolder(folderId, driveKey, owner);
            // Fetch all of the folder entities within the drive
            const driveIdOfFolder = folder.driveId;
            const allFolderEntitiesOfDrive = yield this.getAllFoldersOfPrivateDrive({
                driveId: driveIdOfFolder,
                driveKey,
                owner,
                latestRevisionsOnly: true
            });
            const hierarchy = folderHierarchy_1.FolderHierarchy.newFromEntities(allFolderEntitiesOfDrive);
            const searchFolderIDs = hierarchy.folderIdSubtreeFromFolderId(folderId, maxDepth - 1);
            const [, ...subFolderIDs] = hierarchy.folderIdSubtreeFromFolderId(folderId, maxDepth);
            const childrenFolderEntities = allFolderEntitiesOfDrive.filter((folder) => subFolderIDs.includes(folder.entityId));
            if (includeRoot) {
                childrenFolderEntities.unshift(folder);
            }
            // Fetch all file entities within all Folders of the drive
            const childrenFileEntities = yield this.getPrivateFilesWithParentFolderIds(searchFolderIDs, driveKey, owner, true);
            const children = [...childrenFolderEntities, ...childrenFileEntities];
            const entitiesWithPath = children.map((entity) => new arfs_entities_1.ArFSPrivateFileOrFolderWithPaths(entity, hierarchy));
            return entitiesWithPath;
        });
    }
    assertValidPassword(password) {
        return __awaiter(this, void 0, void 0, function* () {
            const wallet = this.wallet;
            const walletAddress = yield wallet.getAddress();
            const query = query_1.buildQuery({
                tags: [
                    { name: 'Entity-Type', value: 'drive' },
                    { name: 'Drive-Privacy', value: 'private' }
                ],
                owner: walletAddress,
                sort: query_1.ASCENDING_ORDER
            });
            const response = yield this.arweave.api.post(constants_1.graphQLURL, query);
            const { data } = response.data;
            const { transactions } = data;
            const { edges } = transactions;
            if (!edges.length) {
                // No drive has been created for this wallet
                return;
            }
            const { node } = edges[0];
            const safeDriveBuilder = arfs_drive_builders_1.SafeArFSDriveBuilder.fromArweaveNode(node, this.arweave, new private_key_data_1.PrivateKeyData({ password, wallet: this.wallet }));
            const safelyBuiltDrive = yield safeDriveBuilder.build();
            if (safelyBuiltDrive.name === arfs_entities_1.ENCRYPTED_DATA_PLACEHOLDER ||
                `${safelyBuiltDrive.rootFolderId}` === arfs_entities_1.ENCRYPTED_DATA_PLACEHOLDER) {
                throw new Error(`Invalid password! Please type the same as your other private drives!`);
            }
        });
    }
    getPrivateTransactionCipherIV(txId) {
        return __awaiter(this, void 0, void 0, function* () {
            const results = yield this.getCipherIVOfPrivateTransactionIDs([txId]);
            if (results.length !== 1) {
                throw new Error(`Could not fetch the CipherIV for transaction with id: ${txId}`);
            }
            const [fileCipherIvResult] = results;
            return fileCipherIvResult.cipherIV;
        });
    }
    getCipherIVOfPrivateTransactionIDs(txIDs) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = [];
            const wallet = this.wallet;
            const walletAddress = yield wallet.getAddress();
            let cursor = '';
            let hasNextPage = true;
            while (hasNextPage) {
                const query = query_1.buildQuery({
                    tags: [],
                    owner: walletAddress,
                    ids: txIDs,
                    cursor
                });
                const response = yield this.arweave.api.post(constants_1.graphQLURL, query);
                const { data } = response.data;
                const { errors } = response.data;
                if (errors) {
                    throw new Error(`GQL error: ${JSON.stringify(errors)}`);
                }
                const { transactions } = data;
                const { edges } = transactions;
                hasNextPage = transactions.pageInfo.hasNextPage;
                if (!edges.length) {
                    throw new Error(`No such private transactions with IDs: "${txIDs}"`);
                }
                edges.forEach((edge) => {
                    cursor = edge.cursor;
                    const { node } = edge;
                    const { tags } = node;
                    const txId = types_1.TxID(node.id);
                    const cipherIVTag = tags.find((tag) => tag.name === 'Cipher-IV');
                    if (!cipherIVTag) {
                        throw new Error("The private file doesn't have a valid Cipher-IV");
                    }
                    const cipherIV = cipherIVTag.value;
                    result.push({ txId, cipherIV });
                });
            }
            return result;
        });
    }
    /**
     * Returns the data stream of a private file
     * @param privateFile - the entity of the data to be download
     * @returns {Promise<Readable>}
     */
    getPrivateDataStream(privateFile) {
        return __awaiter(this, void 0, void 0, function* () {
            const dataLength = privateFile.encryptedDataSize;
            const authTagIndex = +dataLength - constants_1.authTagLength;
            const dataTxUrl = `${constants_1.gatewayURL}${privateFile.dataTxId}`;
            const requestConfig = {
                method: 'get',
                url: dataTxUrl,
                responseType: 'stream',
                headers: {
                    Range: `bytes=0-${+authTagIndex - 1}`
                }
            };
            const response = yield axios_1.default(requestConfig);
            return response.data;
        });
    }
    getAuthTagForPrivateFile(privateFile) {
        return __awaiter(this, void 0, void 0, function* () {
            const dataLength = privateFile.encryptedDataSize;
            const authTagIndex = +dataLength - constants_1.authTagLength;
            const response = yield axios_1.default({
                method: 'GET',
                url: `${constants_1.gatewayURL}${privateFile.dataTxId}`,
                headers: {
                    Range: `bytes=${authTagIndex}-${+dataLength - 1}`
                },
                responseType: 'arraybuffer'
            });
            const { data } = response;
            if (data.length === constants_1.authTagLength) {
                return data;
            }
            throw new Error(`The retrieved auth tag does not have the length of ${constants_1.authTagLength} bytes, but instead: ${data.length}`);
        });
    }
}
exports.ArFSDAO = ArFSDAO;
