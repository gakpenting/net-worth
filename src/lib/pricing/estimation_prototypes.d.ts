import { CreatePrivateDriveParams, CreatePublicDriveParams } from '../exports';
import { EstimateCreateDriveParams } from '../types/cost_estimator_types';
export declare function getPrivateCreateDriveEstimationPrototypes({ driveName, newPrivateDriveData }: CreatePrivateDriveParams): Promise<EstimateCreateDriveParams>;
export declare function getPublicCreateDriveEstimationPrototypes({ driveName }: CreatePublicDriveParams): EstimateCreateDriveParams;
