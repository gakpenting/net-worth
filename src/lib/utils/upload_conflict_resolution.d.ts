import { ResolveFileNameConflictsParams, ResolveFolderNameConflictsParams } from '../types';
export declare function resolveFileNameConflicts({ wrappedFile, conflictResolution, destinationFileName: destFileName, nameConflictInfo, prompts }: ResolveFileNameConflictsParams): Promise<void>;
export declare function resolveFolderNameConflicts({ wrappedFolder, nameConflictInfo, destinationFolderName: destFolderName, prompts, conflictResolution, getConflictInfoFn }: ResolveFolderNameConflictsParams): Promise<void>;
