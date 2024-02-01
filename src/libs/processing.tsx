const lookup = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);

export function decodeBase64(base64: string): ArrayBuffer {
  let p = 0;
  let encoded1, encoded2, encoded3, encoded4;
  const arraybuffer = new ArrayBuffer(150528);
  let bytes = new Uint8Array(arraybuffer);
  for (let i = 0; i < base64.length; i += 4) {
    encoded1 = lookup[base64.charCodeAt(i)];
    encoded2 = lookup[base64.charCodeAt(i + 1)];
    encoded3 = lookup[base64.charCodeAt(i + 2)];
    encoded4 = lookup[base64.charCodeAt(i + 3)];
    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }
  return arraybuffer;
}

export function resizeUint8(baseArrayBuffer: ArrayBuffer, newByteSize: number) {
  var resizedArrayBuffer = new ArrayBuffer(newByteSize),
    len = baseArrayBuffer.byteLength,
    resizeLen = len > newByteSize ? newByteSize : len;

  new Uint8Array(resizedArrayBuffer, 0, resizeLen).set(
    new Uint8Array(baseArrayBuffer, 0, resizeLen),
  );

  return resizedArrayBuffer;
}

export function resizeFloat32(
  baseArrayBuffer: ArrayBuffer,
  newByteSize: number,
) {
  var resizedArrayBuffer = new ArrayBuffer(newByteSize),
    len = baseArrayBuffer.byteLength,
    resizeLen = len > newByteSize ? newByteSize : len;

  new Float32Array(resizedArrayBuffer, 0, resizeLen).set(
    new Float32Array(baseArrayBuffer, 0, resizeLen),
  );

  return resizedArrayBuffer;
}
