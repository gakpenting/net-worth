import { FeeMultiple, Winston, RewardSettings } from '.';
import { ArFSDriveMetaDataPrototype, ArFSFolderMetaDataPrototype } from '../arfs/arfs_prototypes';
import { ArFSTagSettings } from '../arfs/arfs_tag_settings';
import { ARDataPriceEstimator } from '../pricing/ar_data_price_estimator';
export interface ArFSUploadPlannerConstructorParams {
    priceEstimator: ARDataPriceEstimator;
    arFSTagSettings: ArFSTagSettings;
    feeMultiple?: FeeMultiple;
    shouldBundle?: boolean;
}
export interface EstimateCreateDriveParams {
    rootFolderMetaDataPrototype: ArFSFolderMetaDataPrototype;
    driveMetaDataPrototype: ArFSDriveMetaDataPrototype;
}
export interface EstimateResult<T> {
    totalWinstonPrice: Winston;
    rewardSettings: T;
}
export interface BundleRewardSettings {
    bundleRewardSettings: RewardSettings;
}
export declare function isBundleRewardSetting(rewardSettings: BundleRewardSettings | unknown): rewardSettings is BundleRewardSettings;
export interface CreateDriveV2TxRewardSettings {
    rootFolderRewardSettings: RewardSettings;
    driveRewardSettings: RewardSettings;
}
export declare type CreateDriveRewardSettings = CreateDriveV2TxRewardSettings | BundleRewardSettings;
export declare type EstimateCreateDriveResult = EstimateResult<CreateDriveRewardSettings>;
