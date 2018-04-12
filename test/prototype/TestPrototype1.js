const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");
let TransactionListener = require('../../test-helpers/TransactionListener');
let transactionListener = new TransactionListener();

// ============ Test Prototype 1 ============ //

let StakeManager = artifacts.require('StakeManager');
let MockCasper = artifacts.require('MockCasper');
let Treasury = artifacts.require('Treasury');

const MIN_DEPOSIT_SIZE = web3.toWei(1, 'ether');
const EPOCH_LENGTH = 20;
const EPOCHS_BEFORE_LOGOUT = 10;


contract('Prototype 1', async accounts => {
    let casper;
    let stakeManager;
    let treasury;
    
    before(async () => {
        casper = await MockCasper.new(MIN_DEPOSIT_SIZE, EPOCH_LENGTH);
        treasury = await Treasury.new(casper.address);
    });
});