const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");

// ============ Test StakeManager ============ //

const StakeManager = artifacts.require('StakeManager');
const AWithdrawalBox = artifacts.require('AWithdrawalBox');
const MockTreasury = artifacts.require('MockTreasury');

contract('StakeManager', async accounts => {
    let validator;
    let treasury;
    let stakeManager;
    

    before(async () => {
        validator = accounts[9];
        
    });

});