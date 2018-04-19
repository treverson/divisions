const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");

// ============ Test StakeManager ============ //

const StakeManager = artifacts.require('StakeManager');
const AWithdrawalBox = artifacts.require('AWithdrawalBox');
const MockTreasury = artifacts.require('MockTreasury');
const MockCasper = artifacts.require('MockCasper');

const MIN_DEPOSIT_SIZE = web3.toWei(1, 'ether');
const EPOCH_LENGTH = 20;
const EPOCHS_BEFORE_LOGOUT = 10;
const DYNASTY_LOGOUT_DELAY = 0;
const WITHDRAWAL_DELAY = 0;

contract('StakeManager', async accounts => {
    let casper;
    let validator;
    let treasury;
    let stakeManager;

    before(async () => {

        validator = accounts[9];

        casper = await MockCasper.new(MIN_DEPOSIT_SIZE, EPOCH_LENGTH, DYNASTY_LOGOUT_DELAY, WITHDRAWAL_DELAY);

        treasury = await MockTreasury.new(casper.address);

        stakeManager = await StakeManager.new(
            casper.address,
            validator,
            treasury.address,
            EPOCHS_BEFORE_LOGOUT
        );

        await treasury.setStakeManager(stakeManager.address);
    });

    beforeEach(async () => {
        await stakeManager.transferValidatorship(validator);
        await stakeManager.setTreasury(treasury.address);
        await casper.setRejectVote(false);
        await casper.setRejectLogout(false);
    });

    // it('transfers validatorship', async () => {

    //     let expectedNewValidator = accounts[8];
    //     await stakeManager.transferValidatorship(expectedNewValidator);

    //     let actualNewValidator = await stakeManager.validator();

    //     assert.equal(actualNewValidator, expectedNewValidator, "The validator was not set correctly");

    //     await expectThrow(stakeManager.transferValidatorship(0),
    //         "Cannot set the validator to address 0x0"
    //     );

    //     await expectThrow(
    //         stakeManager.transferValidatorship(accounts[3], { from: accounts[2] }),
    //         "Cannot set the validator from an account that is not the owner"
    //     );
    // });

    // it('logs an event on transferValidatorship', async () => {
    //     let oldValidator = await stakeManager.validator();
    //     let newValidator = accounts[8];

    //     expectEvent(
    //         stakeManager.transferValidatorship.sendTransaction(newValidator),
    //         stakeManager.ValidatorshipTransferred(),
    //         { oldValidator: oldValidator, newValidator: newValidator }
    //     );
    // });

    // it('sets the treasury', async () => {
    //     let expectedNewTreasury = accounts[7];

    //     await stakeManager.setTreasury(expectedNewTreasury);

    //     let actualNewTreasury = await stakeManager.treasury();
    //     assert.equal(actualNewTreasury, expectedNewTreasury, "The treasury was not set correctly");

    //     await expectThrow(stakeManager.setTreasury(0), "Cannot set the treasury to address 0x0");
    //     await expectThrow(
    //         stakeManager.setTreasury(accounts[2], { from: accounts[1] }),
    //         "Cannot set the treasury from an account that is not the owner"
    //     );
    // });

    // it('logs an event on setTreasury', async () => {
    //     let oldTreasury = await stakeManager.treasury();
    //     let newTreasury = accounts[6];

    //     await expectEvent(
    //         stakeManager.setTreasury.sendTransaction(newTreasury),
    //         stakeManager.TreasurySet(),
    //         { oldTreasury: oldTreasury, newTreasury: newTreasury }
    //     );
    // });

    // it('decides how much ether can be staked', async () => {
    //     let depositedWei = web3.toWei(2, 'ether');
    //     await treasury.sendTransaction({ value: depositedWei, from: accounts[8] });

    //     // StakeManager can deploy withdrawalBoxes as soon as there's enough ether available

    //     // As of now, it stakes all ether that in currently in the treasury
    //     let treasuryBalance = await web3.eth.getBalance(treasury.address);
    //     let stakeAmount = await stakeManager.getStakeAmount();

    //     assert.deepEqual(
    //         stakeAmount,
    //         treasuryBalance,
    //         "The stake amount was not equal to the balance of the treasury"
    //     );
    // });

    // it('makes casper deposits', async () => {
    //     await treasury.sendTransaction({ value: MIN_DEPOSIT_SIZE, from: accounts[8] });

    //     let numWithdrawalBoxesBefore = await stakeManager.withdrawalBoxesLength();

    //     let stakeAmount = await stakeManager.getStakeAmount();

    //     await expectEvent(
    //         stakeManager.makeStakeDeposit.sendTransaction(),
    //         treasury.StakeCalled(),
    //         {
    //             amount: stakeAmount,
    //             validatorAddress: validator,
    //             withdrawalBox: '@any'
    //         }
    //     );

    //     let numWithdrawalBoxesAfter = await stakeManager.withdrawalBoxesLength();

    //     assert.deepEqual(
    //         numWithdrawalBoxesAfter,
    //         numWithdrawalBoxesBefore.plus(1),
    //         "The number of withdrawalboxes was not incremented"
    //     );
    // });

    // it('logs an event on makeStakeDeposit', async () => {
    //     await treasury.sendTransaction({ value: MIN_DEPOSIT_SIZE, from: accounts[7] });

    //     let nextValidatorIndex = await casper.next_validator_index();

    //     await expectEvent(
    //         stakeManager.makeStakeDeposit.sendTransaction(),
    //         stakeManager.WithdrawalBoxDeployed(),
    //         {
    //             withdrawalBox: '@any',
    //         }
    //     );
    // });

    it('forwards votes to casper and stores them alongside their unencoded parameters', async () => {
        await treasury.sendTransaction({ value: MIN_DEPOSIT_SIZE, from: accounts[7] });

        await stakeManager.makeStakeDeposit();

        let lastWithdrawalBoxIndex = (await stakeManager.withdrawalBoxesLength()).minus(1);
        let withdrawalBoxAddress = await stakeManager.withdrawalBoxes(lastWithdrawalBoxIndex);

        let validatorIndex = await casper.validator_indexes(withdrawalBoxAddress);

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
                { from: validator }
            ),
            casper.VoteCalled(),
            { vote_msg: web3.fromAscii(messageRLP) }
        );

        let voteMessage = new VoteMessage(await stakeManager.getVoteMessage(validatorIndex, targetEpoch));

        delete voteMessage.castAt;

        assert.equal(web3.toAscii(voteMessage.messageRLP), messageRLP, "The encoded message was not stored correctly");
        assert.equal(web3.toAscii(voteMessage.targetHash).substr(0, targetHash.length), targetHash, "The target hash was not stored correctly");
        assert.equal(voteMessage.targetEpoch, targetEpoch, "The target epoch was not stored correctly");
        assert.equal(voteMessage.sourceEpoch, sourceEpoch, "The source epoch was not stored correctly");
        assert(voteMessage.accepted, "The vote message should be marked as accepted");
    });

    it('stores votes even is they were rejected by casper', async () => {
        await treasury.sendTransaction({ value: MIN_DEPOSIT_SIZE, from: accounts[7] });

        await stakeManager.makeStakeDeposit();

        let lastWithdrawalBoxIndex = (await stakeManager.withdrawalBoxesLength()).minus(1);
        let withdrawalBoxAddress = await stakeManager.withdrawalBoxes(lastWithdrawalBoxIndex);

        let validatorIndex = await casper.validator_indexes(withdrawalBoxAddress);

        let messageRLP = web3.toHex("iwannavote");
        let targetHash = web3.toHex("targetHash") + "00000000000000000000000000000000000000000000";
        let targetEpoch = web3.toBigNumber(100);
        let sourceEpoch = web3.toBigNumber(101);

        await casper.setRejectVote(true);

        await stakeManager.vote.sendTransaction(
            messageRLP,
            validatorIndex,
            targetHash,
            targetEpoch,
            sourceEpoch,
            { from: validator }
        );

        let voteMessage = new VoteMessage(await stakeManager.getVoteMessage(validatorIndex, targetEpoch));
        delete voteMessage.castAt;
        assert.deepEqual(
            voteMessage,
            {
                messageRLP: messageRLP,
                targetHash: targetHash,
                targetEpoch: targetEpoch,
                sourceEpoch: sourceEpoch,
                accepted: false
            }
        )
    });

    // it('only lets the validator cast votes', async () => {
    //     await treasury.sendTransaction({ value: MIN_DEPOSIT_SIZE, from: accounts[4] });

    //     await stakeManager.makeStakeDeposit();

    //     let lastWithdrawalBoxIndex = (await stakeManager.withdrawalBoxesLength()).minus(1);
    //     let withdrawalBoxAddress = await stakeManager.withdrawalBoxes(lastWithdrawalBoxIndex);
    //     let withdrawalBox = await AWithdrawalBox.at(withdrawalBoxAddress);

    //     let validatorIndex = await casper.validator_indexes(withdrawalBoxAddress);

    //     let messageRLP = "iwannavote";
    //     let targetHash = "targetHash";
    //     let targetEpoch = 100;
    //     let sourceEpoch = 101;

    //     await expectThrow(
    //         stakeManager.vote(
    //             messageRLP,
    //             validatorIndex,
    //             targetHash,
    //             targetEpoch,
    //             sourceEpoch,
    //         ),
    //         "Only the validator can cast votes"
    //     )
    // });

    // it('logs an event on vote', async () => {
    //     await treasury.sendTransaction({ value: MIN_DEPOSIT_SIZE, from: accounts[7] });

    //     await stakeManager.makeStakeDeposit();

    //     let lastWithdrawalBoxIndex = (await stakeManager.withdrawalBoxesLength()).minus(1);
    //     let withdrawalBoxAddress = await stakeManager.withdrawalBoxes(lastWithdrawalBoxIndex);
    //     let withdrawalBox = await AWithdrawalBox.at(withdrawalBoxAddress);

    //     let validatorIndex = await casper.validator_indexes(withdrawalBoxAddress);

    //     let messageRLP = "iwannavote";
    //     let targetHash = "targetHash";
    //     let targetEpoch = 100;
    //     let sourceEpoch = 101;

    //     await expectEvent(
    //         stakeManager.vote.sendTransaction(
    //             messageRLP,
    //             validatorIndex,
    //             targetHash,
    //             targetEpoch,
    //             sourceEpoch,
    //             { from: validator }
    //         ),
    //         stakeManager.VoteCast(),
    //         {
    //             messageRLP: web3.toHex(messageRLP),
    //             validatorIndex: web3.toBigNumber(validatorIndex),
    //             targetHash: web3.fromAscii(targetHash).padEnd(66, '0'), // = 8 bytes + '0x'
    //             targetEpoch: web3.toBigNumber(targetEpoch),
    //             sourceEpoch: web3.toBigNumber(sourceEpoch)
    //         }
    //     );
    // });

    // it('forwards logout messages to casper and stores them alongside their unencoded parameters', async () => {
    //     await treasury.sendTransaction({ value: MIN_DEPOSIT_SIZE, from: accounts[6] });

    //     await stakeManager.makeStakeDeposit();

    //     let lastWithdrawalBoxIndex = (await stakeManager.withdrawalBoxesLength()).minus(1);
    //     let withdrawalBoxAddress = await stakeManager.withdrawalBoxes(lastWithdrawalBoxIndex);

    //     let logoutMessageRLP = web3.toHex("iwannalogout");
    //     let validatorIndex = await casper.validator_indexes(withdrawalBoxAddress);
    //     let epoch = web3.toBigNumber(100);

    //     await expectEvent(
    //         stakeManager.logout.sendTransaction(
    //             withdrawalBoxAddress,
    //             logoutMessageRLP,
    //             validatorIndex,
    //             epoch
    //         ),
    //         casper.LogoutCalled(),
    //         {
    //             logout_msg: logoutMessageRLP
    //         }
    //     );

    //     let logoutMessage = new LogoutMessage(await stakeManager.logoutMessages(withdrawalBoxAddress));
    //     delete logoutMessage.setAt;
    //     assert.deepEqual(
    //         logoutMessage,
    //         {
    //             messageRLP: logoutMessageRLP,
    //             validatorIndex: validatorIndex,
    //             epoch: epoch
    //         },
    //         "The logout message was not stored correctly"
    //     );
    // });

    // it('reverts logouts when casper rejects the message', async () => {
    //     await treasury.sendTransaction({ value: MIN_DEPOSIT_SIZE, from: accounts[6] });

    //     await stakeManager.makeStakeDeposit();

    //     let lastWithdrawalBoxIndex = (await stakeManager.withdrawalBoxesLength()).minus(1);
    //     let withdrawalBoxAddress = await stakeManager.withdrawalBoxes(lastWithdrawalBoxIndex);

    //     let invalidLogoutMessageRLP = "invalidlogout";
    //     let validatorIndex = await casper.validator_indexes(withdrawalBoxAddress);
    //     let epoch = web3.toBigNumber(100);

    //     await casper.setRejectLogout(true);

    //     await expectThrow(
    //         stakeManager.logout(
    //             withdrawalBoxAddress,
    //             invalidLogoutMessageRLP,
    //             validatorIndex,
    //             epoch
    //         ),
    //         "It should only accept logouts accepted by casper"
    //     );
    // });

    // it('logs an event on logout', async () => {
    //     await treasury.sendTransaction({ value: MIN_DEPOSIT_SIZE, from: accounts[6] });

    //     await stakeManager.makeStakeDeposit();

    //     let lastWithdrawalBoxIndex = (await stakeManager.withdrawalBoxesLength()).minus(1);
    //     let withdrawalBoxAddress = await stakeManager.withdrawalBoxes(lastWithdrawalBoxIndex);

    //     let logoutMessageRLP = web3.toHex("iwannalogout");
    //     let validatorIndex = await casper.validator_indexes(withdrawalBoxAddress);
    //     let epoch = web3.toBigNumber(100);

    //     await expectEvent(
    //         stakeManager.logout.sendTransaction(
    //             withdrawalBoxAddress,
    //             logoutMessageRLP,
    //             validatorIndex,
    //             epoch
    //         ),
    //         stakeManager.Logout(),
    //         {
    //             withdrawalBox: withdrawalBoxAddress,
    //             messageRLP: logoutMessageRLP,
    //             validatorIndex: validatorIndex,
    //             epoch: epoch
    //         }
    //     );
    // });
});

class VoteMessage {

    constructor(voteMessageArray) {
        this.messageRLP = voteMessageArray[0];
        this.targetHash = voteMessageArray[1];
        this.targetEpoch = voteMessageArray[2];
        this.sourceEpoch = voteMessageArray[3];
        this.castAt = voteMessageArray[4];
        this.accepted = voteMessageArray[5];
    }
}

class LogoutMessage {
    constructor(logoutMessageArray) {
        this.messageRLP = logoutMessageArray[0];
        this.validatorIndex = logoutMessageArray[1];
        this.epoch = logoutMessageArray[2];
        this.setAt = logoutMessageArray[3];
    }
}