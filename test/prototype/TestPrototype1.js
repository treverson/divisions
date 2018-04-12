const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");
let TransactionListener = require('../../test-helpers/TransactionListener');
let transactionListener = new TransactionListener();

// ============ Test Prototype 1 ============ //

let StakeManager = artifacts.require('StakeManager');
let MockCasper = artifacts.require('MockCasper');
let Treasury = artifacts.require('Treasury');
let WithdrawalBox = artifacts.require('WithdrawalBox');

const MIN_DEPOSIT_SIZE = web3.toWei(1, 'ether');
const EPOCH_LENGTH = 20;
const EPOCHS_BEFORE_LOGOUT = 10;


contract('Prototype 1', async accounts => {
    let casper;
    let stakeManager;
    let treasury;
    let validator;

    before(async () => {
        validator = accounts[1];

        casper = await MockCasper.new(MIN_DEPOSIT_SIZE, EPOCH_LENGTH);
        treasury = await Treasury.new(casper.address);
        stakeManager = await StakeManager.new(casper.address, validator, treasury.address, EPOCHS_BEFORE_LOGOUT);
        await treasury.transferTreasurership(stakeManager.address);
    });

    it('Completes a staking cycle', async () => {
        // Deposit
        await treasury.sendTransaction({ value: web3.toWei(5, 'ether'), from: accounts[9] });
        let stakeAmount = await stakeManager.getStakeAmount();

        let out = await expectEvent(
            stakeManager.makeStakeDeposit.sendTransaction(),
            casper.DepositCalled(),
            {
                validation_addr: validator,
                withdrawal_addr: '@any',
                amount: stakeAmount
            }
        );

        let withdrawalBox = WithdrawalBox.at(out.withdrawal_addr);
        let validatorIndex = await casper.validator_indexes(withdrawalBox.address);

        // Set logout message
        let logoutMessage = web3.toHex("logoutmessage");
        let logoutEpoch = 100;

        await expectEvent(
            stakeManager.setLogoutMessage.sendTransaction(
                withdrawalBox.address,
                logoutMessage,
                validatorIndex,
                logoutEpoch,
                { from: validator }
            ),
            withdrawalBox.LogoutMessageSet(),
            {
                messageRLP: logoutMessage,
                validatorIndex: validatorIndex,
                epoch: logoutEpoch
            }
        );

        // Vote
        let vote = web3.toHex("votemessage");
        let targetHash = "hash";
        let targetEpoch = 10;
        let sourceEpoch = 11;

        await expectEvent(
            stakeManager.vote.sendTransaction(
                vote,
                validatorIndex,
                targetHash,
                targetEpoch,
                sourceEpoch,
                { from: validator }
            ),
            casper.VoteCalled(),
            { vote_msg: vote }
        );

        // Logout
        logoutMessage = (await withdrawalBox.logoutMessage())[0];
        await casper.logout(logoutMessage);

        // Withdraw
        await expectEvent(
            casper.withdraw.sendTransaction(validatorIndex),
            withdrawalBox.EtherReceived(),
            { amount: stakeAmount }
        );

        await expectEvent(
            withdrawalBox.sweep.sendTransaction(),
            treasury.Deposit(),
            { from: withdrawalBox.address, amount: stakeAmount }
        )
    });
});