import { ArFSFileOrFolderEntity } from '../arfs/arfs_entities';
import { FileID, FolderID, UnixTime } from '../types';
export interface NameConflictInfo {
    files: FileConflictInfo[];
    folders: FolderNameAndId[];
}
export interface FolderNameAndId {
    folderName: string;
    folderId: FolderID;
}
export interface FileConflictInfo {
    fileName: string;
    fileId: FileID;
    lastModifiedDate: UnixTime;
}
export declare function entityToNameMap(entity: ArFSFileOrFolderEntity): string;
export declare function folderToNameAndIdMap(entity: ArFSFileOrFolderEntity): FolderNameAndId;
export declare function fileConflictInfoMap(entity: ArFSFileOrFolderEntity): FileConflictInfo;
