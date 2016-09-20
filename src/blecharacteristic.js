/**
 * @fileoverview Wrapper around a BLE characteristic.
 */
'use strict';

function BleCharacteristic(obj) {
  this.characteristic_ = obj;
  this.validateProperties_();
}

BleCharacteristic.UUID = {
  ControlPoint:       "f1d0fff1-deaa-ecee-b42f-c9ba7ed623bb",
  Status:             "f1d0fff2-deaa-ecee-b42f-c9ba7ed623bb",
  ControlPointLength: "f1d0fff3-deaa-ecee-b42f-c9ba7ed623bb",
  ServiceRevision:    "00002a28-0000-1000-8000-00805f9b34fb"
}

BleCharacteristic.Properties = {
  write:  "write",
  read:   "read",
  notify: "notify"
};

BleCharacteristic.prototype.writeValue = function(value) {
  var self = this;

  return new Promise(function(resolve, reject) {
    chrome.bluetoothLowEnergy.writeCharacteristicValue(self.characteristic_.instanceId, value, function() {
      resolve();
    });
  });
};

BleCharacteristic.prototype.readValue = function() {
  var self = this;

  return new Promise(function(resolve, reject) {
    chrome.bluetoothLowEnergy.readCharacteristicValue(self.characteristic_.instanceId, function(ret) {
      resolve(ret.value);
    })
  });
};

BleCharacteristic.prototype.readUint8 = function() {
  return this.readValue().then(function(arrayBuf) {
    var view = new DataView(arrayBuf);
    return view.getUint8(0);
  });
};

BleCharacteristic.prototype.readUint16 = function() {
  return this.readValue().then(function(arrayBuf) {
    var view = new DataView(arrayBuf);
    return view.getUint16(0, false);
  });
};

BleCharacteristic.prototype.hasProperty_ = function(property) {
  return this.characteristic_.properties.indexOf(property) >= 0;
};

BleCharacteristic.prototype.validateProperties_ = function() {
  switch(this.characteristic_.uuid) {
  case BleCharacteristic.UUID.ControlPoint:
    if (!this.hasProperty_(BleCharacteristic.Properties.write))
      throw "Characteristic isn't writable";
    break;
  case BleCharacteristic.UUID.Status:
    if (!this.hasProperty_(BleCharacteristic.Properties.notify))
      throw "Characteristic isn't readable";
    break;
  case BleCharacteristic.UUID.ControlPointLength:
  case BleCharacteristic.UUID.ServiceRevision:
    if (!this.hasProperty_(BleCharacteristic.Properties.read))
      throw "Characteristic isn't readable";
    break;
  }
};
