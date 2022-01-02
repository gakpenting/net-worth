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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArFSUploadPlanner = void 0;
const parser_1 = require("arbundles/src/parser");
const types_1 = require("../types");
/** A utility class for calculating the cost of an ArFS write action */
class ArFSUploadPlanner {
    constructor({ shouldBundle = true, priceEstimator, feeMultiple = new types_1.FeeMultiple(1), arFSTagSettings }) {
        this.priceEstimator = priceEstimator;
        this.shouldBundle = shouldBundle;
        this.feeMultiple = feeMultiple;
        this.arFSTagSettings = arFSTagSettings;
    }
    /** Estimate the cost of a create drive */
    estimateCreateDrive(arFSPrototypes) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.shouldBundle) {
                return this.costOfCreateBundledDrive(arFSPrototypes);
            }
            return this.costOfCreateDriveV2Tx(arFSPrototypes);
        });
    }
    /** Calculate the cost of creating a drive and root folder as v2 transactions */
    costOfCreateDriveV2Tx({ rootFolderMetaDataPrototype, driveMetaDataPrototype }) {
        return __awaiter(this, void 0, void 0, function* () {
            const driveReward = yield this.costOfV2ObjectTx(driveMetaDataPrototype.objectData);
            const rootFolderReward = yield this.costOfV2ObjectTx(rootFolderMetaDataPrototype.objectData);
            const totalWinstonPrice = this.feeMultiple
                .boostedWinstonReward(driveReward)
                .plus(this.feeMultiple.boostedWinstonReward(rootFolderReward));
            const rewardSettings = {
                driveRewardSettings: { reward: driveReward, feeMultiple: this.feeMultiple },
                rootFolderRewardSettings: { reward: rootFolderReward, feeMultiple: this.feeMultiple }
            };
            return { totalWinstonPrice, rewardSettings };
        });
    }
    /** Calculate the cost of creating a drive and root folder together as a bundle */
    costOfCreateBundledDrive(arFSPrototypes) {
        return __awaiter(this, void 0, void 0, function* () {
            const bundleReward = yield this.bundledCostOfPrototypes(Object.values(arFSPrototypes));
            const totalWinstonPrice = this.feeMultiple.boostedWinstonReward(bundleReward);
            const rewardSettings = {
                bundleRewardSettings: { reward: bundleReward, feeMultiple: this.feeMultiple }
            };
            return { totalWinstonPrice, rewardSettings };
        });
    }
    /** Calculate the cost uploading transaction data as a v2 transaction */
    costOfV2ObjectTx(objectTransactionData) {
        return __awaiter(this, void 0, void 0, function* () {
            const metaDataSize = objectTransactionData.sizeOf();
            return this.priceEstimator.getBaseWinstonPriceForByteCount(metaDataSize);
        });
    }
    /** Calculate the size of an ArFS Prototype as a DataItem */
    sizeAsDataItem(objectPrototype) {
        // referenced from https://github.com/Bundlr-Network/arbundles/blob/master/src/ar-data-create.ts
        // We're not using the optional target and anchor fields, they will always be 1 byte
        const targetLength = 1;
        const anchorLength = 1;
        // Get byte length of tags after being serialized for avro schema
        const serializedTags = parser_1.serializeTags(this.arFSTagSettings.baseArFSTagsIncluding({ tags: objectPrototype.gqlTags }));
        const tagsLength = 16 + serializedTags.byteLength;
        const arweaveSignerLength = 512;
        const ownerLength = 512;
        const signatureTypeLength = 2;
        const dataLength = +objectPrototype.objectData.sizeOf();
        const totalByteLength = arweaveSignerLength +
            ownerLength +
            signatureTypeLength +
            targetLength +
            anchorLength +
            tagsLength +
            dataLength;
        return new types_1.ByteCount(totalByteLength);
    }
    /** Calculate the bundled size from an array of data item byte counts  */
    bundledSizeOfDataItems(dataItemSizes) {
        // 32 byte array for representing the number of data items in the bundle
        const byteArray = 32;
        // Get total byte length of combined binaries
        let totalDataItemsSize = 0;
        for (const dataItemSize of dataItemSizes) {
            totalDataItemsSize = totalDataItemsSize + +dataItemSize;
        }
        // Each data item gets a 64 byte header added to the bundle
        const headersSize = dataItemSizes.length * 64;
        return new types_1.ByteCount(byteArray + totalDataItemsSize + headersSize);
    }
    /** Calculate the cost of uploading an array of ArFS Prototypes together as a bundle */
    bundledCostOfPrototypes(arFSPrototypes) {
        return __awaiter(this, void 0, void 0, function* () {
            const dataItemSizes = arFSPrototypes.map((p) => this.sizeAsDataItem(p));
            const bundledSize = this.bundledSizeOfDataItems(dataItemSizes);
            return this.priceEstimator.getBaseWinstonPriceForByteCount(bundledSize);
        });
    }
}
exports.ArFSUploadPlanner = ArFSUploadPlanner;
