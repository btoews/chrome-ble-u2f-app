/**
 * @fileoverview Helper for fragmenting a BLE message.
 */
'use strict';

function BleMessageIterator(bleMessage, maxLen) {
  this.bleMessage = bleMessage;
  this.maxLen = maxLen;
  // this.raw = this.makeRaw_(bleMessage);
  this.readPtr = new Uint8Array(this.bleMessage.data, 0);
  this.lastSeq = -1;
}

// Get the next fragment to write.
BleMessageIterator.prototype.next = function() {
  var isInitial = this.lastSeq == -1
  var hdrSize = isInitial ? BleMessage.HeaderSize : BleMessage.SequenceSize;

  var dataLen = this.readPtr.byteLength;
  if (dataLen + hdrSize > this.maxLen)
    dataLen = this.maxLen - hdrSize;

  if (dataLen <= 0)
    return null;

  var frag = new ArrayBuffer(dataLen + hdrSize);

  var hdr = new DataView(frag, 0, hdrSize);
  isInitial ? this.writeHeader_(hdr) : this.writeSequence_(hdr);

  var data = new Uint8Array(frag, hdrSize);
  data.set(this.readPtr.slice(0, dataLen));

  var newOffset = this.readPtr.byteOffset + dataLen;
  this.readPtr = new Uint8Array(this.bleMessage.data, newOffset);

  return frag;
}

// Write the BLE header to the given DataView.
BleMessageIterator.prototype.writeHeader_ = function(hdr) {
  hdr.setUint8(0, this.bleMessage.cmdOrStatus);
  hdr.setUint16(1, this.bleMessage.data.length, false);
}

// Write the BLE sequence number to the given DataView.
BleMessageIterator.prototype.writeSequence_ = function(hdr) {
  hdr.setUint8(0, ++this.lastSeq);
}
