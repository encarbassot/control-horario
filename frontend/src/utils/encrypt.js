import { JSEncrypt } from 'jsencrypt';

export function encryptMessage(message, publicKeyPem) {
  const encrypt = new JSEncrypt();
  encrypt.setPublicKey(publicKeyPem);
  return encrypt.encrypt(message);
}



export function hashPassword(password){
  return password
}