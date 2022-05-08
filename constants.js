const iv = Buffer.alloc(16); // zeroed-out iv
const key='E4j<'
const algorithm= 'aes-128-cbc'
const crypto = require('crypto');

const paddedKey = Buffer.concat([Buffer.from(key), Buffer.alloc(12)]); // make it 128 bits key

async function encrypt(plainText) {
    const cipher = crypto.createCipheriv(algorithm, paddedKey, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }
  
  async function decrypt(encrypted) {
    const decrypt = crypto.createDecipheriv(algorithm, paddedKey, iv);
    let text = decrypt.update(encrypted, 'base64', 'utf8');
    text += decrypt.final('utf8')
    return text;
  }

module.exports.encrypt = encrypt; 
module.exports.decrypt = decrypt;
