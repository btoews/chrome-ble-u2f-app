describe("BleMessage", function() {
  var cmdOrStatus;
  var data;
  var bleMessage;

  beforeEach(function() {
    jasmine.addCustomEqualityTester(arrayBufferEquality);

    cmdOrStatus = BleMessage.CmdOrStatus.msg;
    data = (new Uint8Array([0,1,2,3,4,5,6,7,8,9])).buffer;
    bleMessage = new BleMessage(cmdOrStatus, data);
  });

  it("should have the right cmdOrStatus", function() {
    expect(bleMessage.cmdOrStatus).toEqual(cmdOrStatus);
  });

  it("should have the right data", function() {
    expect(bleMessage.data).toEqual(data);
  });

  it("can go through BleMessageIterator, back through BleMessageReader, and be the same", function() {
    var iterator = bleMessage.iterator(4);
    var reader = new BleMessageReader();

    for(var frag; frag = iterator.next();) {
      reader.readFragment(frag);
    }

    expect(reader.bleMessage).not.toBe(null);
    expect(reader.bleMessage.cmdOrStatus).toEqual(bleMessage.cmdOrStatus);
    expect(reader.bleMessage.data).toEqual(bleMessage.data);
  });
});
