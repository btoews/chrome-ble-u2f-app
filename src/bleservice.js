/**
 * @fileoverview Wrapper around a BLE service.
 */
'use strict';

function BleService(obj) {
  // public
  this.characteristics = null;

  // private
  this.service_ = obj;
}

BleService.UUID = "0000fffd-0000-1000-8000-00805f9b34fb";

BleService.prototype.discoverCharacteristics = function() {
  var self = this;

  if (self.characteristics)
    return Promise.resolve(self.characteristics);

  return self.discoverCharacteristics_().then(function(charSet) {
    self.validateCharacteristics_(charSet);
    return self.characteristics = charSet;
  });
};

BleService.prototype.discoverCharacteristics_ = function() {
  var self = this;

  return new Promise(function(resolve, reject) {
    console.log("Discovering characteristics...");
    chrome.bluetoothLowEnergy.getCharacteristics(self.service_.instanceId, function(chars) {
      if (chrome.runtime.lastError)
        throw chrome.runtime.lastError;

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
    throw new Error("no control point characteristic");
  }

  if (!charSet.status) {
    throw new Error("no status characteristic");
  }

  if (!charSet.controlPointLength) {
    throw new Error("no control point length characteristic");
  }

  if (!charSet.serviceRevision) {
    throw new Error("no service revision characteristic");
  }
}
