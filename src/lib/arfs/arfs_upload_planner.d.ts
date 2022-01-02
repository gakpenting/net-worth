import { ArFSUploadPlannerConstructorParams, EstimateCreateDriveParams, EstimateCreateDriveResult } from '../types/cost_estimator_types';
/** A utility class for calculating the cost of an ArFS write action */
export declare class ArFSUploadPlanner {
    private readonly priceEstimator;
    private readonly shouldBundle;
    private readonly feeMultiple;
    private readonly arFSTagSettings;
    constructor({ shouldBundle, priceEstimator, feeMultiple, arFSTagSettings }: ArFSUploadPlannerConstructorParams);
    /** Estimate the cost of a create drive */
    estimateCreateDrive(arFSPrototypes: EstimateCreateDriveParams): Promise<EstimateCreateDriveResult>;
    /** Calculate the cost of creating a drive and root folder as v2 transactions */
    private costOfCreateDriveV2Tx;
    /** Calculate the cost of creating a drive and root folder together as a bundle */
    private costOfCreateBundledDrive;
    /** Calculate the cost uploading transaction data as a v2 transaction */
    private costOfV2ObjectTx;
    /** Calculate the size of an ArFS Prototype as a DataItem */
    private sizeAsDataItem;
    /** Calculate the bundled size from an array of data item byte counts  */
    private bundledSizeOfDataItems;
    /** Calculate the cost of uploading an array of ArFS Prototypes together as a bundle */
    private bundledCostOfPrototypes;
}
