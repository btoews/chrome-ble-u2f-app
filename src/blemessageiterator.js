/**
 * @fileoverview Helper for fragmenting a BLE message.
 */
'use strict';

function BleMessageIterator(bleMessage, maxLen) {
  if (maxLen <= 3)
    throw new Error("maxLen_ must be greater than four")

  this.bleMessage_ = bleMessage;
  this.maxLen_ = maxLen;
  // this.raw = this.makeRaw_(bleMessage_);
  this.readPtr_ = new Uint8Array(this.bleMessage_.data, 0);
  this.sequence_ = -1;
}

// Get the next fragment to write.
BleMessageIterator.prototype.next = function() {
  var isInitial = this.sequence_ == -1
  var hdrSize = isInitial ? BleMessage.HeaderSize : BleMessage.SequenceSize;

  var dataLen = this.readPtr_.byteLength;
  if (dataLen + hdrSize > this.maxLen_)
    dataLen = this.maxLen_ - hdrSize;

  if (dataLen <= 0)
    return null;

  var frag = new ArrayBuffer(dataLen + hdrSize);

  var hdr = new DataView(frag, 0, hdrSize);
  isInitial ? this.writeHeader_(hdr) : this.writeSequence_(hdr);

  var data = new Uint8Array(frag, hdrSize);
  data.set(this.readPtr_.slice(0, dataLen));

  var newOffset = this.readPtr_.byteOffset + dataLen;
  this.readPtr_ = new Uint8Array(this.bleMessage_.data, newOffset);

  this.sequence_++;
  return frag;
}

// Write the BLE header to the given DataView.
BleMessageIterator.prototype.writeHeader_ = function(hdr) {
  hdr.setUint8(0, this.bleMessage_.cmdOrStatus);
  hdr.setUint16(1, this.bleMessage_.data.byteLength, false);
}

// Write the BLE sequence number to the given DataView.
BleMessageIterator.prototype.writeSequence_ = function(hdr) {
  hdr.setUint8(0, this.sequence_);
}
