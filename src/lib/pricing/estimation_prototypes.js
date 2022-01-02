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
exports.getPublicCreateDriveEstimationPrototypes = exports.getPrivateCreateDriveEstimationPrototypes = void 0;
const exports_1 = require("../exports");
const constants_1 = require("../utils/constants");
function getPrivateCreateDriveEstimationPrototypes({ driveName, newPrivateDriveData }) {
    return __awaiter(this, void 0, void 0, function* () {
        return {
            rootFolderMetaDataPrototype: new exports_1.ArFSPrivateFolderMetaDataPrototype(constants_1.fakeEntityId, constants_1.fakeEntityId, yield exports_1.ArFSPrivateFolderTransactionData.from(driveName, newPrivateDriveData.driveKey)),
            driveMetaDataPrototype: new exports_1.ArFSPrivateDriveMetaDataPrototype(constants_1.fakeEntityId, yield exports_1.ArFSPrivateDriveTransactionData.from(driveName, constants_1.fakeEntityId, newPrivateDriveData.driveKey))
        };
    });
}
exports.getPrivateCreateDriveEstimationPrototypes = getPrivateCreateDriveEstimationPrototypes;
function getPublicCreateDriveEstimationPrototypes({ driveName }) {
    return {
        rootFolderMetaDataPrototype: new exports_1.ArFSPublicFolderMetaDataPrototype(new exports_1.ArFSPublicFolderTransactionData(driveName), constants_1.fakeEntityId, constants_1.fakeEntityId),
        driveMetaDataPrototype: new exports_1.ArFSPublicDriveMetaDataPrototype(new exports_1.ArFSPublicDriveTransactionData(driveName, constants_1.fakeEntityId), constants_1.fakeEntityId)
    };
}
exports.getPublicCreateDriveEstimationPrototypes = getPublicCreateDriveEstimationPrototypes;
