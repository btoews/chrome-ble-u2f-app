/**
 * @fileoverview Implements a BLE central.
 */
'use strict';

function BleCentral() {
  this.powered_ = null;
  this.discovering_ = null;
  this.device_ = null;

  this.withAdapterPoweredOn_ = [];
  this.withDevice_ = [];

  chrome.bluetooth.getAdapterState(this.adapterStateChanged.bind(this));
  chrome.bluetooth.onAdapterStateChanged.addListener(this.adapterStateChanged.bind(this));

  chrome.bluetooth.onDeviceAdded.addListener(this.deviceAdded_.bind(this));
  chrome.bluetooth.onDeviceChanged.addListener(this.deviceAdded_.bind(this));
  chrome.bluetooth.onDeviceRemoved.addListener(this.deviceRemoved_.bind(this));
}

BleCentral.prototype.withAdapterPoweredOn = function() {
  var self = this;

  return new Promise(function(resolve, reject) {
    if (self.powered_) {
      resolve();
    } else {
      self.withAdapterPoweredOn_.push(resolve);
    }
  });
};

BleCentral.prototype.adapterStateChanged = function(adapter) {
  this.powered_ = adapter.powered;
  this.discovering_ = adapter.discovering;

  if (this.powered_) {
    for(var cb; cb = this.withAdapterPoweredOn_.shift();) {
      cb();
    }
  }
};

BleCentral.prototype.withDevice = function() {
  var self = this;

  return self.withAdapterPoweredOn().then(function() {
    return new Promise(function(resolve, reject) {
      if (self.device_) {
        resolve(self.device_);
      } else {
        self.withDevice_.push(resolve);
        self.startDiscovery();
      }
    });
  });
};

BleCentral.prototype.isOurDevice_ = function(other) {
  return this.device_ && this.device_.address == other.address;
}

BleCentral.prototype.deviceAdded_ = function(added) {
  if (this.isOurDevice_(added)) {
    return;
  }

  var device = new BleDevice(this, added);
  if (device.hasService()) {
    console.log("Device added", device, added);
    this.stopDiscovery();
    this.device_ = device;
    for(var cb; cb = this.withDevice_.shift();) {
      cb(device);
    }
  }
}

BleCentral.prototype.deviceRemoved_ = function(removed) {
  if (this.isOurDevice_(removed)) {
    console.log("Device removed", removed, this.device_);
    this.startDiscovery();
    this.device_ = null;
  }
}

BleCentral.prototype.startDiscovery = function() {
  if (!this.discovering_) {
    chrome.bluetooth.startDiscovery();
  }
}

BleCentral.prototype.stopDiscovery = function() {
  if (this.discovering_) {
    chrome.bluetooth.stopDiscovery();
  }
}













// chrome.bluetooth.onAdapterStateChanged.addListener(function(state) {
//   console.log("adapter state changed: ", state);
// });
//
// chrome.bluetooth.onDeviceAdded.addListener(function(device) {
//   if (device.address == "67:71:BF:B1:ED:C5")
//     console.log("device added: ", device);
// });
//
// chrome.bluetooth.onDeviceChanged.addListener(function(device) {
//   if (device.address == "67:71:BF:B1:ED:C5")
//     console.log("device changed: ", device);
// });
//
// chrome.bluetooth.onDeviceRemoved.addListener(function(device) {
//   if (device.address == "67:71:BF:B1:ED:C5")
//     console.log("device removed: ", device);
// });
//
// chrome.bluetoothLowEnergy.onServiceAdded.addListener(function(service){
//   console.log("service added: ", service);
// });
//
// chrome.bluetoothLowEnergy.onServiceChanged.addListener(function(service){
//   console.log("service changed: ", service);
// });
//
// chrome.bluetoothLowEnergy.onServiceRemoved.addListener(function(service){
//   console.log("service removed: ", service);
// });
//
// chrome.bluetoothLowEnergy.onCharacteristicValueChanged.addListener(function(characteristic){
//   console.log("characteristic value changed: ", characteristic);
// });
//
// chrome.bluetoothLowEnergy.onDescriptorValueChanged.addListener(function(descriptor){
//   console.log("descriptor value changed: ", descriptor);
// });
