/**
 * @fileoverview Wrapper around a BLE device.
 */
'use strict';

function BleDevice(central, obj) {
  this.central_ = central;
  this.device_ = obj;
  this.service_ = null;

  this.address = this.device_.address;
  this.connected_ = this.device_.connected;
  this.connecting_ = this.device_.connecting;

  this.withConnected_ = [];
  this.withService_ = [];

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
BleDevice.prototype.withConnected = function() {
  var self = this;

  return self.central_.withAdapterPoweredOn().then(function() {
    return new Promise(function(resolve, reject) {
      if (self.connected_)
        return resolve();

      if (!self.connecting_)
        self.connect_();

      self.withConnected_.push(resolve);
    });
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
  if (changed.address != this.device_.address)
    return;

  this.connected_ = changed.connected;
  this.connecting_ = changed.connecting;

  if (this.connected_) {
    for(var cb; cb = this.withConnected_.shift();) {
      cb();
    }
  }
};

// Returns promise that is resolved when we've got the service for this device.
BleDevice.prototype.withService = function() {
  var self = this;

  return self.withConnected().then(function() {
    return new Promise(function(resolve, reject) {
      if (self.service_)
        return resolve(self.service_);

      self.discoverService_();
      self.withService_.push(resolve);
    });
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
  if (service.deviceAddress != this.device_.address)
    return false;

  if (service.uuid != BleService.UUID)
    return false;

  return true;
};

// Handle event where service was added.
BleDevice.prototype.serviceAdded_ = function(added) {
  if (!this.service_ && this.isOurService_(added)) {
    this.service_ = new BleService(this, added);

    for(var cb; cb = this.withService_.shift();) {
      cb(this.service_);
    }
  }
};

// Handle event where service was removed.
BleDevice.prototype.serviceRemoved_ = function(removed) {
  if (this.isOurService_(removed)) {
    console.log("U2F service removed", removed)
    this.service_ = null;
  }
};
