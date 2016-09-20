/**
 * @fileoverview A helper for sending requests and receiving resposes.
 */
'use strict';

function BleClient() {
  this.central_ = new BleCentral();
}

// Make a request and resolve with the response.
BleClient.prototype.request = function(data) {
  



  return new Promise(function(resolve, reject) {
  });
};

BleClient.prototype.sendRequest_ = function(data) {
  var msg = new BleMessage(BleMessage.CmdOrStatus.msg, data);
  var iterator = msg.iterator();
  var fragment;

  return new Promise(function(resolve, reject) {
    var sendNextFragment = function() {
      if (fragment = iterator.next()) {
      } else {
        resolve();
      }
    }
  });
};
