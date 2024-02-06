const lookup = typeof Uint8Array === 'undefined' ? [] : new Uint8Array(256);

export function decodeBase64(base64: string): ArrayBuffer {
  var bufferLength = 150528,
    len = 150528 / 4,
    i,
    p = 0,
    encoded1,
    encoded2,
    encoded3,
    encoded4;
  if (base64[base64.length - 1] === '=') {
    bufferLength--;
    if (base64[base64.length - 2] === '=') {
      bufferLength--;
    }
  }
  var arraybuffer = new ArrayBuffer(bufferLength),
    bytes = new Uint8Array(arraybuffer);
  for (i = 0; i < len; i += 4) {
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

export function base64ToFloat32Array(base64: string): Float32Array {
  const blob = atob(base64);
  const fLen = 150528 / Float32Array.BYTES_PER_ELEMENT;
  console.log('fLen => ', fLen);
  const dView = new DataView(new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT));
  let fAry = new Float32Array(fLen);
  let p = 0;

  for (let j = 0; j < fLen; j++) {
    p = j * 4;
    dView.setUint8(0, blob.charCodeAt(p));
    dView.setUint8(1, blob.charCodeAt(p + 1));
    dView.setUint8(2, blob.charCodeAt(p + 2));
    dView.setUint8(3, blob.charCodeAt(p + 3));
    fAry[j] = dView.getFloat32(0, true);
  }
  console.log('fAry => ', fAry.byteLength);
  return fAry;
}
