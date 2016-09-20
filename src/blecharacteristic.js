/**
 * @fileoverview Wrapper around a BLE characteristic.
 */
'use strict';

function BleCharacteristic(obj) {
  // private
  this.characteristic_ = obj;
  this.validateProperties_();
  this.notifying_ = false;
  this.messageReader_ = null;
  this.lastMessage_ = null;
  this.withResponse_ = null;

  chrome.bluetoothLowEnergy.onCharacteristicValueChanged.addListener(this.valueChanged_.bind(this));
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

// Write ArrayBuffer to characteristic.
BleCharacteristic.prototype.writeValue = function(value) {
  var self = this;

  return new Promise(function(resolve, reject) {
    chrome.bluetoothLowEnergy.writeCharacteristicValue(self.characteristic_.instanceId, value, function() {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
};

// Frame a U2F request and send its fragments.
BleCharacteristic.prototype.writeRequest = function(data, maxLen) {
  var self = this;
  var msg = new BleMessage(BleMessage.CmdOrStatus.msg, data);
  var it = msg.iterator(maxLen);
  var frag;

  var writeNext = function() {
    if (frag = it.next()) {
      return self.writeValue(frag).then(writeNext);
    } else {
      return Promise.resolve();
    }
  };

  return writeNext();
};

// Read ArrayBuffer from characteristic.
BleCharacteristic.prototype.readValue = function() {
  var self = this;

  return new Promise(function(resolve, reject) {
    chrome.bluetoothLowEnergy.readCharacteristicValue(self.characteristic_.instanceId, function(ret) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(ret.value);
      }
    })
  });
};

// Read characteristic as Uint16.
BleCharacteristic.prototype.readUint16 = function() {
  return this.readValue().then(function(arrayBuf) {
    var view = new DataView(arrayBuf);
    return view.getUint16(0, false);
  });
};

// Read characteristic as utf-8.
BleCharacteristic.prototype.readUtf8 = function() {
  return this.readValue().then(function(arrayBuf) {
    var decoder = new TextDecoder("utf-8");
    return decoder.decode(arrayBuf);
  });
};

// Reads a BLE response and resolves with U2F response.
BleCharacteristic.prototype.readResponse = function() {
  var self = this;

  return new Promise(function(resolve, reject) {
    if (self.lastMessage_) {
      var msg = self.lastMessage_;
      self.lastMessage_ = null;
      resolve(msg);
    } else {
      self.withResponse_ = resolve;
    }
  });
};

BleCharacteristic.prototype.startNotify = function() {
  var self = this;

  return new Promise(function(resolve, reject) {
    chrome.bluetoothLowEnergy.startCharacteristicNotifications(self.characteristic_.instanceId, function() {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        self.notifying_ = true;
        resolve();
      }
    });
  });
};

// Handle event where characteristic value changes.
BleCharacteristic.prototype.valueChanged_ = function(characteristic) {
  if (characteristic.instanceId != this.characteristic_.instanceId)
    return;

  if (!this.notifying_)
    return;

  this.readFragment_(characteristic.value);
};

// Read incoming fragments into a BleMessageReader.
BleCharacteristic.prototype.readFragment_ = function(fragment) {
  if (this.messageReader_ == null)
    this.messageReader_ = new BleMessageReader();

  this.messageReader_.readFragment(fragment);

  if (this.messageReader_.bleMessage != null) {
    var msg = this.messageReader_.bleMessage.data;
    this.messageReader_ = null;

    if (this.withResponse_) {
      var cb = this.withResponse_;
      this.withResponse_ = null;
      cb(msg);
    } else {
      this.lastMessage_ = msg;
    }
  }
};

// Does this characteristic have the given property?
BleCharacteristic.prototype.hasProperty_ = function(property) {
  return this.characteristic_.properties.indexOf(property) >= 0;
};

// Check that this characteristic has the correct properties.
BleCharacteristic.prototype.validateProperties_ = function() {
  switch(this.characteristic_.uuid) {
  case BleCharacteristic.UUID.ControlPoint:
    if (!this.hasProperty_(BleCharacteristic.Properties.write))
      throw new Error("Characteristic isn't writable");
    break;
  case BleCharacteristic.UUID.Status:
    if (!this.hasProperty_(BleCharacteristic.Properties.notify))
      throw new Error("Characteristic isn't readable");
    break;
  case BleCharacteristic.UUID.ControlPointLength:
  case BleCharacteristic.UUID.ServiceRevision:
    if (!this.hasProperty_(BleCharacteristic.Properties.read))
      throw new Error("Characteristic isn't readable");
    break;
  }
};
