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
exports.resolveFolderNameConflicts = exports.resolveFileNameConflicts = void 0;
const types_1 = require("../types");
function resolveFileNameConflicts({ wrappedFile, conflictResolution, destinationFileName: destFileName, nameConflictInfo, prompts }) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const existingNameAtDestConflict = checkNameInfoForConflicts(destFileName, nameConflictInfo);
        if (!existingNameAtDestConflict.existingFileConflict && !existingNameAtDestConflict.existingFolderConflict) {
            // There are no conflicts, continue file upload
            return;
        }
        const hasSameLastModifiedDate = ((_a = existingNameAtDestConflict.existingFileConflict) === null || _a === void 0 ? void 0 : _a.lastModifiedDate) === wrappedFile.lastModifiedDate;
        if (conflictResolution !== types_1.askOnConflicts) {
            if (existingNameAtDestConflict.existingFolderConflict) {
                // Skip this file with an error, files CANNOT overwrite folders
                wrappedFile.conflictResolution = types_1.errorOnConflict;
                return;
            }
            if (conflictResolution === types_1.skipOnConflicts) {
                // Skip this file
                wrappedFile.conflictResolution = types_1.skipOnConflicts;
                return;
            }
            if (conflictResolution === types_1.replaceOnConflicts) {
                // Proceed with new revision
                wrappedFile.existingId = existingNameAtDestConflict.existingFileConflict.fileId;
                return;
            }
            // Otherwise, default to upsert behavior
            if (hasSameLastModifiedDate) {
                // Skip this file with upsert, it has a matching last modified date
                wrappedFile.conflictResolution = types_1.upsertOnConflicts;
                return;
            }
            // Proceed with creating a new revision
            wrappedFile.existingId = existingNameAtDestConflict.existingFileConflict.fileId;
            return;
        }
        // Use the ask prompt behavior
        if (!prompts) {
            throw new Error('App must provide file name conflict resolution prompts to use the `ask` conflict resolution!');
        }
        const allExistingNames = [
            ...nameConflictInfo.files.map((f) => f.fileName),
            ...nameConflictInfo.folders.map((f) => f.folderName)
        ];
        const userInput = yield (() => {
            if (existingNameAtDestConflict.existingFolderConflict) {
                return prompts.fileToFolderNameConflict({
                    folderId: existingNameAtDestConflict.existingFolderConflict.folderId,
                    folderName: destFileName,
                    namesWithinDestFolder: allExistingNames
                });
            }
            return prompts.fileToFileNameConflict({
                fileId: existingNameAtDestConflict.existingFileConflict.fileId,
                fileName: destFileName,
                hasSameLastModifiedDate,
                namesWithinDestFolder: allExistingNames
            });
        })();
        switch (userInput.resolution) {
            case types_1.skipOnConflicts:
                // Skip this file
                wrappedFile.conflictResolution = types_1.skipOnConflicts;
                return;
            case types_1.renameOnConflicts:
                // These cases should be handled at the app level, but throw errors here if not
                if (destFileName === userInput.newFileName) {
                    throw new Error('You must provide a different name!');
                }
                if (allExistingNames.includes(userInput.newFileName)) {
                    throw new Error('That name also exists within dest folder!');
                }
                // Use specified new file name
                wrappedFile.newFileName = userInput.newFileName;
                return;
            case types_1.replaceOnConflicts:
                // Proceed with new revision
                wrappedFile.existingId = (_b = existingNameAtDestConflict.existingFileConflict) === null || _b === void 0 ? void 0 : _b.fileId;
                return;
        }
    });
}
exports.resolveFileNameConflicts = resolveFileNameConflicts;
function resolveFolderNameConflicts({ wrappedFolder, nameConflictInfo, destinationFolderName: destFolderName, prompts, conflictResolution, getConflictInfoFn }) {
    var e_1, _a, e_2, _b;
    return __awaiter(this, void 0, void 0, function* () {
        const existingNameAtDestConflict = checkNameInfoForConflicts(destFolderName, nameConflictInfo);
        if (!existingNameAtDestConflict.existingFileConflict && !existingNameAtDestConflict.existingFolderConflict) {
            // There are no conflicts, continue folder upload
            return;
        }
        if (conflictResolution !== types_1.askOnConflicts) {
            if (existingNameAtDestConflict.existingFileConflict) {
                // Folders cannot overwrite files
                // Skip this folder and all its contents
                wrappedFolder.conflictResolution = types_1.skipOnConflicts;
                return;
            }
            // Re-use this folder, upload its contents within the existing folder
            wrappedFolder.existingId = existingNameAtDestConflict.existingFolderConflict.folderId;
        }
        else {
            // Use the ask prompt behavior
            if (!prompts) {
                throw new Error('App must provide folder and file name conflict resolution prompts to use the `ask` conflict resolution!');
            }
            const allExistingNames = [
                ...nameConflictInfo.files.map((f) => f.fileName),
                ...nameConflictInfo.folders.map((f) => f.folderName)
            ];
            const userInput = yield (() => {
                if (existingNameAtDestConflict.existingFolderConflict) {
                    return prompts.folderToFolderNameConflict({
                        folderId: existingNameAtDestConflict.existingFolderConflict.folderId,
                        folderName: destFolderName,
                        namesWithinDestFolder: allExistingNames
                    });
                }
                return prompts.folderToFileNameConflict({
                    fileId: existingNameAtDestConflict.existingFileConflict.fileId,
                    fileName: destFolderName,
                    namesWithinDestFolder: allExistingNames
                });
            })();
            switch (userInput.resolution) {
                case types_1.skipOnConflicts:
                    // Skip this folder and all its contents
                    wrappedFolder.conflictResolution = types_1.skipOnConflicts;
                    return;
                case types_1.useExistingFolder:
                    // Re-use this folder, upload its contents within the existing folder
                    // useExistingFolder will only ever be returned from a folderToFolder prompt, which
                    // WILL have existingFolderConflict -- this can not be null here
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    wrappedFolder.existingId = existingNameAtDestConflict.existingFolderConflict.folderId;
                    // Break to check conflicts within folder
                    break;
                case types_1.renameOnConflicts:
                    // These cases should be handled at the app level, but throw errors here if not
                    if (destFolderName === userInput.newFolderName) {
                        throw new Error('You must provide a different name!');
                    }
                    if (allExistingNames.includes(userInput.newFolderName)) {
                        throw new Error('That name also exists within dest folder!');
                    }
                    // Use new folder name and upload all contents within new folder
                    wrappedFolder.newFolderName = userInput.newFolderName;
                    // Conflict resolved by rename -- return early, do NOT recurse into this folder
                    return;
            }
        }
        if (wrappedFolder.existingId) {
            // Re-using existing folder id, check for name conflicts inside the folder
            const childConflictInfo = yield getConflictInfoFn(wrappedFolder.existingId);
            try {
                for (var _c = __asyncValues(wrappedFolder.files), _d; _d = yield _c.next(), !_d.done;) {
                    const file = _d.value;
                    // Check each file upload within the folder for name conflicts
                    yield resolveFileNameConflicts({
                        wrappedFile: file,
                        conflictResolution,
                        destinationFileName: file.getBaseFileName(),
                        nameConflictInfo: childConflictInfo,
                        prompts
                    });
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) yield _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
            try {
                for (var _e = __asyncValues(wrappedFolder.folders), _f; _f = yield _e.next(), !_f.done;) {
                    const folder = _f.value;
                    // Recurse into each folder to check for more name conflicts
                    yield resolveFolderNameConflicts({
                        wrappedFolder: folder,
                        conflictResolution,
                        getConflictInfoFn,
                        destinationFolderName: folder.getBaseFileName(),
                        nameConflictInfo: childConflictInfo,
                        prompts
                    });
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_f && !_f.done && (_b = _e.return)) yield _b.call(_e);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
    });
}
exports.resolveFolderNameConflicts = resolveFolderNameConflicts;
/**
 * Utility function for finding name conflicts within NameConflictInfo
 * Returns a union of objects to be safely used in type narrowing
 */
function checkNameInfoForConflicts(destinationName, nameConflictInfo) {
    const conflictResult = { existingFolderConflict: undefined, existingFileConflict: undefined };
    const existingFolderConflict = nameConflictInfo.folders.find((f) => f.folderName === destinationName);
    if (existingFolderConflict) {
        return Object.assign(Object.assign({}, conflictResult), { existingFolderConflict });
    }
    const existingFileConflict = nameConflictInfo.files.find((f) => f.fileName === destinationName);
    if (existingFileConflict) {
        return Object.assign(Object.assign({}, conflictResult), { existingFileConflict });
    }
    return conflictResult;
}
