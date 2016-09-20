/**
 * @fileoverview A helper for sending requests and receiving resposes.
 */
'use strict';

function BleClient() {
  this.central_ = null;
  this.device_ = null;
  this.service_ = null;
  this.characteristics_ = null;
  this.controlPointLength_ = null;
}

// Get ready for request/response.
BleClient.prototype.initialize = function() {
  var self = this;
  self.central_ = new BleCentral();

  return self.central_.withAdapterPoweredOn().then(function(central) {
    return central.discoverDevice();
  }).then(function(device) {
    self.device_ = device;
    return device.connect();
  }).then(function(device) {
    return device.discoverService();
  }).then(function(service) {
    self.service_ = service;
    return service.discoverCharacteristics();
  }).then(function(characteristics) {
    self.characteristics_ = characteristics;
    return characteristics.serviceRevision.readUtf8();
  }).then(function(serviceRevision) {
    if (serviceRevision != "1.0")
      throw new Error("unknown service revision");
  }).then(function() {
    return self.characteristics_.controlPointLength.readUint16();
  }).then(function(controlPointLength) {
    if (controlPointLength < 20)
      throw new Error("invalid control point length");

    if (controlPointLength > 512)
      throw new Error("invalid control point length");

    self.controlPointLength_ = controlPointLength;
  }).then(function() {
    return self.characteristics_.status.startNotify();
  }).then(function() {
    return self;
  });
};

// Make a request and resolve with the response.
BleClient.prototype.request = function(data) {
  var self = this;

  return self.sendRequest_(data).then(function() {
    return self.readResponse_();
  });
};

// Send a U2F request to the control point characteristic.
BleClient.prototype.sendRequest_ = function(data) {
  console.log("Sending request");
  var characteristic = this.characteristics_.controlPoint;
  var cpl = this.controlPointLength_;
  return characteristic.writeRequest(data, cpl);
};

// Read a U2F response from the status characteristic.
BleClient.prototype.readResponse_ = function(data) {
  console.log("Reading response");
  var characteristic = this.characteristics_.status;
  return characteristic.readResponse();
};
