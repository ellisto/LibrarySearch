QUnit.test( "checkLibrary test", function( assert ) {
    var available = checkLibrary("9780143038276","Silver Spring")   
      //assert.ok( 1 == "1", "Passed!" );
    assert.ok(available == true)
});
