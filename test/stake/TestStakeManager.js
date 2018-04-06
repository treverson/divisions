const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");

// ============ Test StakeManager ============ //

const StakeManager = artifacts.require('StakeManager');
const AWithdrawalBox = artifacts.require('MockWithdrawalBox');
const MockTreasury = artifacts.require('MockTreasury');

contract('StakeManager', async accounts => {
    
});