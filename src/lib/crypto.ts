import CryptoJS from 'crypto-js';

export function getEncrpytKey() {
    return "1234567abc"
}

export function decrypt(ciphertext: string): string {
    const key = getEncrpytKey()
    const decryptedBytes = CryptoJS.AES.decrypt(ciphertext, key);
    return decryptedBytes.toString(CryptoJS.enc.Utf8);
}

export function encrypt(ciphertext: string): string {
    const key = getEncrpytKey()
    const encryptedBytes = CryptoJS.AES.encrypt(ciphertext, key);
    return encryptedBytes.toString();

}

export function maskKey(key: string, unmaskLength: number): string {
    if (key.length <= unmaskLength)
        return key

    let key1 = key.slice(0, unmaskLength)
    return key1 + "********"
}
