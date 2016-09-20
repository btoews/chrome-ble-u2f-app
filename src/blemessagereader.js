/**
 * @fileoverview Helper for reading a BLE message.
 */
'use strict';

function BleMessageReader() {
  this.cmdOrStatus = null;
  this.data = null;
  this.writePtr_ = null;
  this.lastSeq = -1;
  this.bleMessage = null;
}

// Read a fragment of a BLE message.
BleMessageReader.prototype.readFragment = function(fragment) {
  if (this.isInitialFragment_(fragment)) {
    this.readInitialFragment_(fragment);
  } else {
    this.readContinuationFragment_(fragment);
  }
};

// Is this a valid initial fragment? Throws if fragment is invalid.
BleMessageReader.prototype.isInitialFragment_ = function(fragment) {
  // The first byte of the first fragment is the command or status code. The
  // first byte of continuation fragments is the sequence number. Commands and
  // statuses have their high bit set to 1, while the sequence can never exceed
  // 2**7 - 1.
  var firstByte = new DataView(fragment, 0, 1);
  var isCmdOrStatus = firstByte.getUint8(0) >= 0b10000000;

  // Have this object's properties already been initialized?
  var notInitialized = this.data == null;

  if (isCmdOrStatus ^ notInitialized)
    throw new Error("invalid BLE message fragment");

  return isCmdOrStatus;
};

// Read the first fragment of a BLE message.
BleMessageReader.prototype.readInitialFragment_ = function(fragment) {
  var header = new DataView(fragment, 0, BleMessage.HeaderSize);

  this.cmdOrStatus = header.getUint8(0);
  var totalLength = header.getUint16(1, false);

  this.data = new ArrayBuffer(totalLength);
  this.writePtr_ = new Uint8Array(this.data, 0);

  this.readData_(fragment.slice(BleMessage.HeaderSize));
};

// Read a subsequent fragment of a BLE message.
BleMessageReader.prototype.readContinuationFragment_ = function(fragment) {
  var header = new DataView(fragment, 0, BleMessage.SequenceSize);
  var seq = header.getUint8(0);

  if (seq != ++this.lastSeq)
    throw new Error("invalid BLE sequence number");

  this.readData_(fragment.slice(BleMessage.SequenceSize));
};

// Append a Uint8Array to data.
BleMessageReader.prototype.readData_ = function(arybuf) {
  this.writePtr_.set(new Uint8Array(arybuf));

  var newOffset = this.writePtr_.byteOffset + arybuf.byteLength;
  this.writePtr_ = new Uint8Array(this.data, newOffset);

  this.checkDone_();
};

// Construct a BleMessage when we're done reading it.
BleMessageReader.prototype.checkDone_ = function() {
  if (this.writePtr_.byteLength == 0) {
    this.bleMessage = new BleMessage(this.cmdOrStatus, this.data);
  }
}
