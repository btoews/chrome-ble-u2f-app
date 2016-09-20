var arrayBufferEquality = function(a, b) {
  if (a.constructor == ArrayBuffer ^ b.constructor == ArrayBuffer)
    return false; // not same type

  if (a.constructor != ArrayBuffer)
    return; // not ArrayBuffer

  if (a.byteLength != b.byteLength)
    return false;

  a = new Uint8Array(a);
  b = new Uint8Array(b);

  for (index in a) {
    if (a[index] != b[index])
      return false;
  }

  return true;
}
