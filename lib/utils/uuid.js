"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isValidUUID = exports.generateUUID = void 0;
const expo_crypto_1 = require("expo-crypto");
/**
 * 生成UUID v4
 */
const generateUUID = () => {
    return (0, expo_crypto_1.randomUUID)();
};
exports.generateUUID = generateUUID;
/**
 * 验证UUID格式
 */
const isValidUUID = (uuid) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
};
exports.isValidUUID = isValidUUID;
