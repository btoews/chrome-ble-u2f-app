describe("BleMessageIterator", function() {
  var cmdOrStatus;
  var data;
  var bleMessage;

  beforeEach(function() {
    cmdOrStatus = BleMessage.CmdOrStatus.ping;
    data = (new Uint8Array([0,1,2,3,4,5,6,7,8,9,10,11,12])).buffer;
    bleMessage = new BleMessage(cmdOrStatus, data);
  });

  it("should send maxlen-3 data in initial fragment", function() {
    var iterator = new BleMessageIterator(bleMessage, 16)

    var expectedBytes = [cmdOrStatus, 0, 13, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    var expected = (new Uint8Array(expectedBytes)).buffer;
    var first = iterator.next();
    expect(first).toEqual(expected);

    var second = iterator.next();
    expect(second).toBe(null);
  });

  it("should send maxlen-1 data in continuation fragment", function() {
    var iterator = new BleMessageIterator(bleMessage, 8)

    var expectedBytes = [cmdOrStatus, 0, 13, 0, 1, 2, 3, 4];
    var expected = (new Uint8Array(expectedBytes)).buffer;
    var frag = iterator.next();
    expect(frag).toEqual(expected);

    expectedBytes = [0x00, 5, 6, 7, 8, 9, 10, 11];
    expected = (new Uint8Array(expectedBytes)).buffer;
    frag = iterator.next();
    expect(frag).toEqual(expected);

    expectedBytes = [0x01, 12];
    expected = (new Uint8Array(expectedBytes)).buffer;
    frag = iterator.next();
    expect(frag).toEqual(expected);
  });
});
