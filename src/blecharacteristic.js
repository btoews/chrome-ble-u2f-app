/**
 * @fileoverview Wrapper around a BLE characteristic.
 */
'use strict';

function BleCharacteristic(obj) {
  this.characteristic_ = obj;
  this.value_ = obj.value;
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

BleCharacteristic.prototype.readValue = function() {
  var self = this;

  return new Promise(function(resolve, reject) {
    if (self.value_)
      return resolve(self.value_)

    chrome.bluetoothLowEnergy.readCharacteristicValue(self.characteristic_.instanceId, function(ret) {
      console.log("char read", ret);
    })
  });
}

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
