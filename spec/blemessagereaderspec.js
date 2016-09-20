describe("BleMessageReader", function() {
  var cmdOrStatus;
  var data;

  beforeEach(function() {
    jasmine.addCustomEqualityTester(arrayBufferEquality);

    cmdOrStatus = BleMessage.CmdOrStatus.keepAlive;
    data = (new Uint8Array([0,1,2,3,4,5,6,7,8,9,10,11,12])).buffer;
  });

  it("can read a bleMessage in one fragment", function() {
    var fragment = (new Uint8Array(
      [cmdOrStatus, 0, 13, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    ).buffer;

    var reader = new BleMessageReader();
    reader.readFragment(fragment);

    expect(reader.bleMessage).not.toBe(null);
    expect(reader.bleMessage.cmdOrStatus).toEqual(cmdOrStatus);
    expect(reader.bleMessage.data).toEqual(data);
  });

  it("can read a bleMessage in multiple fragments", function() {
    var reader = new BleMessageReader();

    var fragment = (new Uint8Array(
      [cmdOrStatus, 0, 13, 0, 1, 2, 3, 4, 5, 6])
    ).buffer;

    reader.readFragment(fragment);
    expect(reader.bleMessage).toBe(null);

    var fragment = (new Uint8Array(
      [0x00, 7, 8, 9])
    ).buffer;

    reader.readFragment(fragment);
    expect(reader.bleMessage).toBe(null);

    var fragment = (new Uint8Array(
      [0x01, 10, 11, 12])
    ).buffer;

    reader.readFragment(fragment);
    expect(reader.bleMessage).not.toBe(null);
    expect(reader.bleMessage.cmdOrStatus).toEqual(cmdOrStatus);
    expect(reader.bleMessage.data).toEqual(data);
  });

  it("throws on continuation fragment before initial fragment", function() {
    var reader = new BleMessageReader();

    var fragment = (new Uint8Array([cmdOrStatus, 0, 13, 0])).buffer;
    reader.readFragment(fragment);

    var fragment = (new Uint8Array([0x01, 7])).buffer;
    expect(function() {
      reader.readFragment(fragment);
    }).toThrowError(/invalid BLE sequence number/);
  });

  it("throws on out of order fragments", function() {
    var reader = new BleMessageReader();
    var fragment = (new Uint8Array([0x00, 0, 13, 0])).buffer;

    expect(function() {
      reader.readFragment(fragment);
    }).toThrowError(/invalid BLE message fragment/);
  });

  it("throws on duplicate initial fragments", function() {
    var reader = new BleMessageReader();

    var fragment = (new Uint8Array([cmdOrStatus, 0, 13, 0])).buffer;
    reader.readFragment(fragment);

    var fragment = (new Uint8Array([cmdOrStatus, 1, 2, 3])).buffer;
    expect(function() {
      reader.readFragment(fragment);
    }).toThrowError(/invalid BLE message fragment/);
  });
});
