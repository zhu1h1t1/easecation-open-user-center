/**
 * 密码加密工具 - 与 Java PasswordUtil 完全一致的算法
 * 算法：SHA-512(password+salt) 与 Whirlpool(salt+password) 分别求摘要，再逐字节 XOR，最后转hex
 */

import CryptoJS from 'crypto-js';
import { gLang } from '../language';
import pkg from 'whirlpool-hash';

const { Whirlpool } = pkg;

/**
 * 将字节数组转换为小写十六进制字符串
 * @param bytes 字节数组
 * @returns 小写十六进制字符串
 */
function bytesToLowerHex(bytes: number[]): string {
    return bytes
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('')
        .toLowerCase();
}

/**
 * 将十六进制字符串转换为字节数组
 * @param hex 十六进制字符串
 * @returns 字节数组
 */
function hexToBytes(hex: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push(parseInt(hex.substring(i, i + 2), 16));
    }
    return bytes;
}

/**
 * 将字符串转换为字节数组（用于处理 Whirlpool 的二进制输出）
 * @param str 字符串
 * @returns 字节数组
 */
function stringToBytes(str: string): number[] {
    const bytes: number[] = [];
    for (let i = 0; i < str.length; i++) {
        bytes.push(str.charCodeAt(i) & 0xff);
    }
    return bytes;
}

/**
 * 生成密码哈希（128位十六进制字符串，小写）
 * 算法：SHA-512(password+salt) 与 Whirlpool(salt+password) 分别求摘要，再逐字节 XOR，最后转hex
 * @param salt 盐值（必须为用户名 ECID）
 * @param password 原始密码
 * @returns 加密后的密码哈希（128位十六进制字符串，小写）
 */
export function getPasswordHashHex(salt: string, password: string): string {
    // 构造两个不同的字符串
    const s1 = password + salt; // password + salt
    const s2 = salt + password; // salt + password

    // 计算 SHA-512(password+salt) 的字节数组
    const sha512Hash = CryptoJS.SHA512(s1);
    const sha512Hex = sha512Hash.toString();
    const sha512Bytes = hexToBytes(sha512Hex);

    // 计算 Whirlpool(salt+password) 的字节数组
    const whirlpool = new Whirlpool();
    const whirlpoolResult = whirlpool.getHash(s2) as string;

    // Whirlpool 返回的是二进制字符串，转换为字节数组
    const whirlpoolBytes = stringToBytes(whirlpoolResult);

    // 验证长度（都应该是64字节）
    if (sha512Bytes.length !== 64 || whirlpoolBytes.length !== 64) {
        throw new Error(gLang('passwordUtils.digestLengthError'));
    }

    // 逐字节进行 XOR 运算
    const resultBytes: number[] = [];
    for (let i = 0; i < 64; i++) {
        resultBytes.push(sha512Bytes[i] ^ whirlpoolBytes[i]);
    }

    // 返回128位十六进制字符串（小写）
    return bytesToLowerHex(resultBytes);
}

/**
 * 密码加密函数 - 兼容旧接口
 * @param ecid ECID作为盐值
 * @param password 原始密码
 * @returns 加密后的密码哈希
 */
export const encryptPassword = async (ecid: string, password: string): Promise<string> => {
    return getPasswordHashHex(ecid, password);
};
