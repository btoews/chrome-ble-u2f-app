/**
 * @fileoverview Wrapper around a BLE message.
 */
'use strict';

function BleMessage(cmdOrStatus, data) {
  this.cmdOrStatus = cmdOrStatus;
  this.data = data;
}

BleMessage.HeaderSize   = 3; // uint8(cmdOrStatus) | uint16(len(data))
BleMessage.SequenceSize = 1; // uint8(cmdOrStatus) | uint16(len(data))

BleMessage.CmdOrStatus = {
  ping:      0x81,
  keepAlive: 0x81,
  msg:       0x83,
  error:     0xbf
};

// Get a BleMessageIterator for this message.
BleMessage.prototype.iterator = function(maxLen) {
  return new BleMessageIterator(this, maxLen);
};
