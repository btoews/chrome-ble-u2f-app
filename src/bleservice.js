/**
 * @fileoverview Wrapper around a BLE service.
 */
'use strict';

function BleService(device, obj) {
  this.device_ = device;
  this.service_ = obj;
  this.characteristics_ = null;
}

BleService.UUID = "0000fffd-0000-1000-8000-00805f9b34fb";

BleService.prototype.withCharacteristics = function() {
  var self = this;

  return self.device_.withService().then(function() {
    if (self.characteristics_)
      return Promise.resolve(self.characteristics_);

    return self.discoverCharacteristics_().then(function(charSet) {
      self.validateCharacteristics_(charSet);
      return self.characteristics_ = charSet;
    });
  });
};

BleService.prototype.discoverCharacteristics_ = function() {
  var self = this;

  return new Promise(function(resolve, reject) {
    chrome.bluetoothLowEnergy.getCharacteristics(self.service_.instanceId, function(chars) {
      var charSet = new Object();
      chars.forEach(function(char) {
        self.addCharacteristic_(charSet, char);
      });
      return resolve(charSet);
    });
  });
};

BleService.prototype.addCharacteristic_ = function(charSet, char) {
  switch(char.uuid) {
    case BleCharacteristic.UUID.ControlPoint:
      charSet.controlPoint = new BleCharacteristic(char);
      break;
    case BleCharacteristic.UUID.Status:
      charSet.status = new BleCharacteristic(char);
      break;
    case BleCharacteristic.UUID.ControlPointLength:
      charSet.controlPointLength = new BleCharacteristic(char);
      break;
    case BleCharacteristic.UUID.ServiceRevision:
      charSet.serviceRevision = new BleCharacteristic(char);
      break;
    default:
      console.log("Unknown characteristic: ", char);
  }
};

BleService.prototype.validateCharacteristics_ = function(charSet) {
  if (!charSet.controlPoint) {
    throw "no control point characteristic";
  }

  if (!charSet.status) {
    throw "no status characteristic";
  }

  if (!charSet.controlPointLength) {
    throw "no control point length characteristic";
  }

  if (!charSet.serviceRevision) {
    throw "no service revision characteristic";
  }
}
