const blake = require('blakejs')

exports.hexToUint8 = function(hexValue) {
  const length = (hexValue.length / 2) | 0;
  const uint8 = new Uint8Array(length);
  for (let i = 0; i < length; i++) uint8[i] = parseInt(hexValue.substr(i * 2, 2), 16);

  return uint8;
}

function array_crop (array) {
  var length = array.length - 1;
  var cropped_array = new Uint8Array(length);
  for (let i = 0; i < length; i++)
    cropped_array[i] = array[i+1];
  return cropped_array;
}

function equal_arrays (array1, array2) {
  for (let i = 0; i < array1.length; i++) {
    if (array1[i] != array2[i])	return false;
  }
  return true;
}

function uint8ToUint4(uintValue) {
  const uint4 = new Uint8Array(uintValue.length * 2);
  for (let i = 0; i < uintValue.length; i++) {
    uint4[i*2] = uintValue[i] / 16 | 0;
    uint4[i*2+1] = uintValue[i] % 16;
  }

  return uint4;
}

function uint4ToHex(uint4) {
  var hex = "";
  for (let i = 0; i < uint4.length; i++) hex += uint4[i].toString(16).toUpperCase();
  return hex;
}

function uint4ToUint8(uintValue) {
  const length = uintValue.length / 2;
  const uint8 = new Uint8Array(length);
  for (let i = 0; i < length; i++)	uint8[i] = uintValue[i*2] * 16 + uintValue[i*2+1];

  return uint8;
}

function uint5ToUint4(uint5) {
  var length = uint5.length / 4 * 5;
  var uint4 = new Uint8Array(length);
  for (let i = 1; i <= length; i++) {
    let n = i - 1;
    let m = i % 5;
    let z = n - ((i - m)/5);
    let right = uint5[z-1] << (5 - m);
    let left = uint5[z] >> m;
    uint4[n] = (left + right) % 16;
  }
  return uint4;
}

function stringToUint5(string) {
  var letter_list = letter_list = '13456789abcdefghijkmnopqrstuwxyz'.split('');
  var length = string.length;
  var string_array = string.split('');
  var uint5 = new Uint8Array(length);
  for (let i = 0; i < length; i++)	uint5[i] = letter_list.indexOf(string_array[i]);
  return uint5;
}

exports.uint8ToHex = function(uintValue) {
  let hex = "";
  let aux;
  for (let i = 0; i < uintValue.length; i++) {
    aux = uintValue[i].toString(16).toUpperCase();
    if(aux.length == 1)
      aux = '0'+aux;
    hex += aux;
    aux = '';
  }

  return(hex);
}

exports.getAccountPublicKey = function(account) {
  if ((!account.startsWith('xrb_1') && !account.startsWith('xrb_3')) || account.length !== 64) throw new Error(`Invalid NANO Account`);
  const account_crop = account.substring(4,64);
  const isValid = /^[13456789abcdefghijkmnopqrstuwxyz]+$/.test(account_crop);
  if (!isValid) throw new Error(`Invalid NANO account`);

  const key_uint4 = array_crop(uint5ToUint4(stringToUint5(account_crop.substring(0, 52))));
  const hash_uint4 = uint5ToUint4(stringToUint5(account_crop.substring(52, 60)));
  const key_array = uint4ToUint8(key_uint4);
  const blake_hash = blake.blake2b(key_array, null, 5).reverse();

  if (!equal_arrays(hash_uint4, uint8ToUint4(blake_hash))) throw new Error(`Incorrect checksum`);

  return uint4ToHex(key_uint4);
}



