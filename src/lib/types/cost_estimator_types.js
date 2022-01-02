"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBundleRewardSetting = void 0;
function isBundleRewardSetting(rewardSettings) {
    return Object.keys(rewardSettings).includes('bundleRewardSettings');
}
exports.isBundleRewardSetting = isBundleRewardSetting;
