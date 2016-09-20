/**
 * @fileoverview Implements a BLE central.
 */
'use strict';

function BleCentral() {
  // public
  this.device = null;
  this.powered = null;

  // private
  this.discovering_ = null;
  this.whenAdapterPoweredOn_ = [];
  this.whenDeviceDiscovered_ = [];

  chrome.bluetooth.getAdapterState(this.adapterStateChanged_.bind(this));
  chrome.bluetooth.onAdapterStateChanged.addListener(this.adapterStateChanged_.bind(this));

  chrome.bluetooth.onDeviceAdded.addListener(this.deviceAdded_.bind(this));
  chrome.bluetooth.onDeviceChanged.addListener(this.deviceAdded_.bind(this));
  chrome.bluetooth.onDeviceRemoved.addListener(this.deviceRemoved_.bind(this));
}

BleCentral.prototype.withAdapterPoweredOn = function() {
  var self = this;

  return new Promise(function(resolve, reject) {
    if (self.powered) {
      resolve(self);
    } else {
      self.whenAdapterPoweredOn_.push(resolve);
    }
  });
};

BleCentral.prototype.adapterStateChanged_ = function(adapter) {
  if (chrome.runtime.lastError)
    throw chrome.runtime.lastError;

  this.powered = adapter.powered;
  this.discovering_ = adapter.discovering;

  if (this.powered) {
    for(var cb; cb = this.whenAdapterPoweredOn_.shift();) {
      cb(this);
    }
  }
};

BleCentral.prototype.discoverDevice = function() {
  var self = this;

  return new Promise(function(resolve, reject) {
    if (self.device) {
      resolve(self.device);
    } else {
      self.whenDeviceDiscovered_.push(resolve);
      self.startDiscovery();
    }
  });
};

BleCentral.prototype.isOurDevice_ = function(other) {
  return this.device && this.device.address == other.address;
};

BleCentral.prototype.deviceAdded_ = function(added) {
  if (chrome.runtime.lastError)
    throw chrome.runtime.lastError;

  if (this.isOurDevice_(added))
    return;

  var device = new BleDevice(added);
  if (device.hasService()) {
    console.log("Device added", device, added);
    this.stopDiscovery();
    this.device = device;
    for(var cb; cb = this.whenDeviceDiscovered_.shift();) {
      cb(device);
    }
  }
};

BleCentral.prototype.deviceRemoved_ = function(removed) {
  if (chrome.runtime.lastError)
    throw chrome.runtime.lastError;

  if (this.isOurDevice_(removed)) {
    console.log("Device removed", removed, this.device);
    this.device = null;
  }
};

BleCentral.prototype.startDiscovery = function() {
  if (this.discovering_)
    return;

  chrome.bluetooth.startDiscovery(function() {
    if (chrome.runtime.lastError)
      throw chrome.runtime.lastError;
  });
};

BleCentral.prototype.stopDiscovery = function() {
  if (!this.discovering_)
    return;

  chrome.bluetooth.stopDiscovery(function() {
    if (chrome.runtime.lastError)
      throw chrome.runtime.lastError;
  });
};
