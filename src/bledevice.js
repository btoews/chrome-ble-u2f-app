/**
 * @fileoverview Wrapper around a BLE device.
 */
'use strict';

function BleDevice(obj) {
  // public
  this.service = null;
  this.connected = obj.connected;
  this.address = obj.address;

  // private
  this.device_ = obj;
  this.connecting_ = obj.connecting;
  this.whenConnected_ = [];
  this.whenServiceDiscovered_ = [];

  chrome.bluetooth.onDeviceChanged.addListener(this.deviceChanged_.bind(this));
  chrome.bluetoothLowEnergy.onServiceAdded.addListener(this.serviceAdded_.bind(this));
  chrome.bluetoothLowEnergy.onServiceChanged.addListener(this.serviceAdded_.bind(this));
  chrome.bluetoothLowEnergy.onServiceRemoved.addListener(this.serviceRemoved_.bind(this));
}

// Does this device advertise the U2F service?
BleDevice.prototype.hasService = function() {
  return this.device_.uuids && this.device_.uuids.indexOf(BleService.UUID) >= 0;
};

// Returns promise that is resolved when we are connected to this device.
BleDevice.prototype.connect = function() {
  var self = this;

  return new Promise(function(resolve, reject) {
    if (self.connected)
      return resolve(self);

    if (!self.connecting_)
      self.connect_();

    self.whenConnected_.push(resolve);
  });
};

// Connect to this device.
BleDevice.prototype.connect_ = function() {
  console.log("Connecting to device...");
  chrome.bluetoothLowEnergy.connect(this.address, function() {
    if (chrome.runtime.lastError) {
      var msg = chrome.runtime.lastError.message;
      console.log("Error connecting to device: " + msg);
    }
  });

  this.connecting = true;
};

// Handle event where device was changed.
BleDevice.prototype.deviceChanged_ = function(changed) {
  if (chrome.runtime.lastError)
    throw chrome.runtime.lastError;

  if (changed.address != this.device_.address)
    return;

  this.connected = changed.connected;
  this.connecting_ = changed.connecting;

  if (this.connected) {
    for(var cb; cb = this.whenConnected_.shift();) {
      cb(this);
    }
  }
};

// Returns promise that is resolved when we've got the service for this device.
BleDevice.prototype.discoverService = function() {
  var self = this;

  return new Promise(function(resolve, reject) {
    if (self.service)
      return resolve(self.service);

    self.discoverService_();
    self.whenServiceDiscovered_.push(resolve);
  });
};

BleDevice.prototype.discoverService_ = function() {
  console.log("Discovering service...");
  chrome.bluetoothLowEnergy.getServices(this.device_.address, function(services) {
    // We *should* be able to use this list of services, but
    // getCharacteristics will return an empty list unless we wait for
    // the onServiceChanged event. This seems like a bug?
  });
};

// Is this the U2F service from this device?
BleDevice.prototype.isOurService_ = function(service) {
  if (service.deviceAddress == this.device_.address) {
    if (service.uuid == BleService.UUID)
      return true
  }
  return false;
};

// Handle event where service was added.
BleDevice.prototype.serviceAdded_ = function(added) {
  if (chrome.runtime.lastError)
    throw chrome.runtime.lastError;

  if (!this.service && this.isOurService_(added)) {
    this.service = new BleService(added);

    for(var cb; cb = this.whenServiceDiscovered_.shift();) {
      cb(this.service);
    }
  }
};

// Handle event where service was removed.
BleDevice.prototype.serviceRemoved_ = function(removed) {
  if (chrome.runtime.lastError)
    throw chrome.runtime.lastError;

  if (this.isOurService_(removed)) {
    console.log("U2F service removed", removed)
    this.service = null;
  }
};
