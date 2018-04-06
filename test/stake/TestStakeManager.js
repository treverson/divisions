const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");

// ============ Test StakeManager ============ //

const StakeManager = artifacts.require('StakeManager');
const AWithdrawalBox = artifacts.require('AWithdrawalBox');
const MockWithdrawalBox = artifacts.require('MockWithdrawalBox');
const MockTreasury = artifacts.require('MockTreasury');
const MockCasper = artifacts.require('MockCasper');

contract('StakeManager', async accounts => {
    let casper;
    let validator;
    let treasury;
    let stakeManager;

    before(async () => {
        validator = accounts[9];
        casper = MockCasper.new();
        treasury = MockTreasury.new(casper.address);
        stakeManager = StakeManager.new(casper.address, validator, treasury.address);
        await treasury.transferTreasurership(stakeManager.address);
    });

    beforeEach(async () => {
        await stakeManager.transferValidatorship(validator);
    });

    it('transfers validatorship', async () => {

        let expectedNewValidator = accounts[8];
        await stakeManager.transferValidatorship(expectedNewValidator);

        let actualNewValidator = await stakeManager.validator();

        assert.equal(actualNewValidator, expectedNewValidator, "The validator was not set correctly");

        await expectThrow(stakeManager.transferValidatorship(0),
            "Cannot set the validator to address 0x0"
        );

        await expectThrow(
            stakeManager.transferValidatorship(accounts[3], { from: accounts[2] }),
            "Cannot set the validator from an account that is not the owner"
        );
    });

    it('logs an event on transferValidatorship', async () => {
        let oldValidator = await stakeManager.validator();
        let newValidator = accounts[8];

        expectEvent(
            stakeManager.transferTreasurership.sendTransaction(newValidator),
            stakeManager.ValidatorshipTransferred(),
            { oldValidator: oldValidator, newValidator: newValidator }
        );
    });

    it('sets the treasury', async () => {
        let expectedNewTreasury = accounts[7];

        await stakeManager.setTreasury(newTreasury);

        let actualNewTreasury = await stakeManager.treasury();
        assert.equal(actualNewTreasury, expectedNewTreasury, "The treasury was not set correctly");

        await expectThrow(stakeManager.setTreasury(0), "Cannot set the treasury to address 0x0");
        await expectThrow(
            stakeManager.setTreasury(accounts[2], { from: accounts[1] }),
            "Cannot set the treasury from an account that is not the owner"
        );
    });

    it('logs an event on setTreasury', async () => {
        let oldTreasury = stakeManager.treasury();
        let newTreasury = accounts[6];

        await expectEvent(
            stakeManager.setTreasury(newTreasury),
            stakeManager.TreasurySet(),
            { oldTreasury: oldTreasury, newTreasury: newTreasury }
        );
    });

    it('decides how much ether can be staked', async () => {
        // StakeManager can deploy withdrawalBoxes as soon as there's enough ether available

        // As of now, it stakes all ether that in currently in the treasury
        assert.fail('TODO');
    });

    it('makes casper deposits', async () => {
        
    });

    it('logs an event on makeStakeDeposit', () => {

    });

    it('forwards votes to casper and stores them alongside their unencoded parameters', async () => {

    });

    it('only stores votes if the vote was made without errors', async () => {

    });

    it('logs an event on vote', async () => {
        
    });

    it('sets logout messages at given WithdrawalBoxes', async () => {

    });
});