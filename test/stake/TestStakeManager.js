const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");

// ============ Test StakeManager ============ //

const StakeManager = artifacts.require('StakeManager');
const AWithdrawalBox = artifacts.require('AWithdrawalBox');
const MockTreasury = artifacts.require('MockTreasury');
const MockCasper = artifacts.require('MockCasper');

contract('StakeManager', async accounts => {
    let casper;
    let validator;
    let treasury;
    let stakeManager;

    before(async () => {
        validator = accounts[9];
        casper = await MockCasper.new();
        treasury = await MockTreasury.new(casper.address);
        stakeManager = await StakeManager.new(casper.address, validator, treasury.address);
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
        let depositedWei = web3.toWei(32, 'ether');
        await treasury.sendTransaction({ value: depositedWei, from: accounts[8] });

        let numWithdrawalBoxesBefore = await stakeManager.withdrawalBoxesCount();
        let maxStakeAmount = await stakeManager.maxStakeAmount();

        await expectEvent(
            stakeManager.makeStakeDeposit.sendTransaction(),
            treasury.StakeCalled(),
            {
               amount: depositedWei,
               validtorAddress: validator,
               withdrawalBox: '@any'
            }
        );

        let numWithdrawalBoxesAfter = await stakeManager.withdrawalBoxesCount();

        assert.equal(
            numWithdrawalBoxesAfter.valueOf(),
            numWithdrawalBoxesBefore.plus(1).valueOf(),
            "The number of withdrawalboxes was not incremented"
        );
    });

    it('logs an event on makeStakeDeposit', async () => {
        let depositedWei = web3.toWei(32, 'ether');
        await treasury.sendTransaction({ value: depositedWei, from: accounts[7] });

        let nextValidatorIndex = await casper.next_validator_index();

        await expectEvent(
            stakeManager.makeStakeDeposit.sendTransaction(),
            stakeManager.WithdrawalBoxDeployed(),
            {
                withdrawalBox: '@any',
                validatorIndex: nextValidatorIndex
            }
        );
    });

    it('forwards votes to casper and stores them alongside their unencoded parameters', async () => {
        let depositedWei = web3.toWei(32, 'ether');
        await treasury.sendTransaction({ value: depositedWei, from: accounts[7] });

        await stakeManager.makeStakeDeposit();

        let lastWithdrawalBoxIndex = (await stakeManager.withdrawalBoxesCount()).minus(1);
        let withdrawalBoxAddress = await stakeManager.withdrawalBox(lastWithdrawalBoxIndex);
        let withdrawalBox = await AWithdrawalBox.at(withdrawalBoxAddress);

        let validatorIndex = await withdrawalBox.validatorIndex();

        let messageRLP = "iwannavote";
        let targetHash = "targetHash";
        let targetEpoch = 100;
        let sourceEpoch = 101;

        await expectEvent(
            stakeManager.vote.sendTransaction(
                messageRLP,
                validatorIndex,
                targetHash,
                targetEpoch,
                sourceEpoch,
                {from: validator}
            ),
            casper.VoteCalled(),
            { vote_msg: messageRLP }
        );

        let voteMessage = new VoteMessage(await stakeManager.getVoteMessage(validatorIndex, targetEpoch));
        assert.equal(voteMessage.messageRLP, messageRLP, "The encoded message was not stored correctly");
        assert.equal(voteMessage.validatorIndex, validatorIndex, "The validator index was not stored correctly");
        assert.equal(voteMessage.targetHash, targetHash, "The target hash was not stored correctly");
        assert.equal(voteMessage.targetEpoch, targetEpoch, "The target epoch was not stored correctly");
        assert.equal(voteMessage.sourceEpoch, sourceEpoch, "The source epoch was not stored correctly");
    });

    it('only lets the validator cast votes', async () => {
        let depositedWei = web3.toWei(32, 'ether');
        await treasury.sendTransaction({ value: depositedWei, from: accounts[4] });

        await stakeManager.makeStakeDeposit();

        let lastWithdrawalBoxIndex = (await stakeManager.withdrawalBoxesCount()).minus(1);
        let withdrawalBoxAddress = await stakeManager.withdrawalBox(lastWithdrawalBoxIndex);
        let withdrawalBox = await AWithdrawalBox.at(withdrawalBoxAddress);

        let validatorIndex = await withdrawalBox.validatorIndex();

        let messageRLP = "iwannavote";
        let targetHash = "targetHash";
        let targetEpoch = 100;
        let sourceEpoch = 101;

        await expectThrow(
            stakeManager.vote(
                messageRLP,
                validatorIndex,
                targetHash,
                targetEpoch,
                sourceEpoch,
            ),
            "Only the validator can cast votes"
        )
    });

    it('only stores votes if the vote was made without errors', async () => {
        assert.fail('TODO');
    });

    it('logs an event on vote', async () => {
        let depositedWei = web3.toWei(32, 'ether');
        await treasury.sendTransaction({ value: depositedWei, from: accounts[7] });

        await stakeManager.makeStakeDeposit();

        let lastWithdrawalBoxIndex = (await stakeManager.withdrawalBoxesCount()).minus(1);
        let withdrawalBoxAddress = await stakeManager.withdrawalBox(lastWithdrawalBoxIndex);
        let withdrawalBox = await AWithdrawalBox.at(withdrawalBoxAddress);

        let validatorIndex = await withdrawalBox.validatorIndex();

        let messageRLP = "iwannavote";
        let targetHash = "targetHash";
        let targetEpoch = 100;
        let sourceEpoch = 101;

        await expectEvent(
            stakeManager.vote.sendTransaction(
                messageRLP,
                validatorIndex,
                targetHash,
                targetEpoch,
                sourceEpoch
            ),
            StakeManager.VoteCast(),
            {
                messageRLP: messageRLP,
                validatorIndex: validatorIndex,
                targetHash: targetHash,
                targetEpoch: targetEpoch,
                sourceEpoch: sourceEpoch
            }
        );
    });

    it('sets logout messages at given WithdrawalBoxes', async () => {
        let depositedWei = web3.toWei(32, 'ether');
        await treasury.sendTransaction({ value: depositedWei, from: accounts[6] });

        await stakeManager.makeStakeDeposit();

        let lastWithdrawalBoxIndex = (await stakeManager.withdrawalBoxesCount()).minus(1);
        let withdrawalBoxAddress = await stakeManager.withdrawalBox(lastWithdrawalBoxIndex);
        let withdrawalBox = await AWithdrawalBox.at(withdrawalBoxAddress);

        let logoutMessageRLP = "iwannalogout";
        let validatorIndex = await withdrawalBox.validatorIndex();
        let epoch = 100;
        await expectEvent(
            stakeManager.setLogoutMessage.sendTransaction(
                withdrawalBox.address,
                messageRLP,
                validatorIndex,
                epoch
            ),
            withdrawalBox.LogoutMessageSet(),
            {
                messageRLP: logoutMessageRLP,
                validatorIndex: validatorIndex,
                epoch: epoch
            }
        );

    });

    it('logs an event on setLogoutMessage', async () => {
        let depositedWei = web3.toWei(32, 'ether');
        await treasury.sendTransaction({ value: depositedWei, from: accounts[6] });

        await stakeManager.makeStakeDeposit();

        let lastWithdrawalBoxIndex = (await stakeManager.withdrawalBoxesCount()).minus(1);
        let withdrawalBoxAddress = await stakeManager.withdrawalBox(lastWithdrawalBoxIndex);
        let withdrawalBox = await AWithdrawalBox.at(withdrawalBoxAddress);

        let logoutMessageRLP = "iwannalogout";
        let validatorIndex = await withdrawalBox.validatorIndex();
        let epoch = 100;
        await expectEvent(
            stakeManager.setLogoutMessage.sendTransaction(
                withdrawalBox.address,
                messageRLP,
                validatorIndex,
                epoch
            ),
            stakeManager.LogoutMessageSet(),
            {
                withdrawalBox: withdrawalBox.address,
                messageRLP: logoutMessageRLP,
                validatorIndex: validatorIndex,
                epoch: epoch
            }
        );
    });
});

class VoteMessage {

    constructor(voteMessageArray) {
        this.voteMessageArray = voteMessageArray;
        this.messageRLP = voteMessageArray[0];
        this.targetHash = voteMessageArray[1];
        this.targetEpoch = voteMessageArray[2];
        this.sourceEpoch = voteMessageArray[3];
        this.castAt = voteMessageArray[4];
    }
}