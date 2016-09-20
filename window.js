var registerRequest = (new Uint8Array([72, 110, 164, 98, 36, 209, 187, 79, 182, 128, 243, 79, 124, 154, 217, 106, 143, 36, 236, 136, 190, 115, 234, 142, 90, 108, 101, 38, 14, 156, 184, 167, 44, 242, 77, 186, 95, 176, 163, 14, 38, 232, 59, 42, 197, 185, 226, 158, 27, 22, 30, 92, 31, 167, 66, 94, 115, 4, 51, 98, 147, 139, 152, 36])).buffer;
var logElt;

window.addEventListener("load", function() {
  logElt = document.getElementById("js-log");
  var console_log = console.log;

  console.log = function() {
    console_log.apply(console, arguments);

    var msg = Array.from(arguments).
      map(function(a){ return String(a) }).join(" ");

    logElt.value += "\n" + msg;
  }

  var central = new BleCentral();

  console.log("Scanning for U2F devices");
  central.withDevice().then(function(device) {
    device.withService().then(function(service) {
      console.log("Discovered service", service);
      service.withCharacteristics().then(function(characteristics) {
        console.log("Discovered characteristics", characteristics);
        characteristics.controlPointLength.readUint16().then(function(val) {
          console.log("controlPointLength: ", val);
        });
      });
    });
  });
});
