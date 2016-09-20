describe("BleMessage", function() {
  var cmdOrStatus;
  var data;
  var bleMessage;

  beforeEach(function() {
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
});
