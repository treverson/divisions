const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");
let TransactionListener = require('../../test-helpers/TransactionListener');
let transactionListener = new TransactionListener();

// ============ Test Prototype 2 ============ //

let StakeManager = artifacts.require('StakeManager');
let MockCasper = artifacts.require('MockCasper');
let Treasury = artifacts.require('Treasury');
let WithdrawalBox = artifacts.require('WithdrawalBox');
let DivisionToken = artifacts.require('DivisionsToken');
let Exchange = artifacts.require('Exchange');

const MIN_DEPOSIT_SIZE = web3.toWei(1, 'ether');
const EPOCH_LENGTH = 20;
const DYNASTY_LOGOUT_DELAY = 0;
const WITHDRAWAL_DELAY = 0;


contract('Prototype 2', async accounts => {
    let casper;
    let stakeManager;
    let treasury;
    let validator;
    let divToken;
    let exchange;

    before(async () => {
        validator = accounts[1];

        casper = await MockCasper.new(MIN_DEPOSIT_SIZE, EPOCH_LENGTH, DYNASTY_LOGOUT_DELAY, WITHDRAWAL_DELAY);
        treasury = await Treasury.new(casper.address);
        stakeManager = await StakeManager.new(casper.address, validator, treasury.address);
        await treasury.setStakeManager(stakeManager.address);
    });

    it('Completes a staking cycle', async () => {
        // Deposit
        await treasury.sendTransaction({ value: web3.toWei(5, 'ether'), from: accounts[9] });
        let stakeAmount = await stakeManager.getStakeableAmount();

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
        await stakeManager.logout(
            withdrawalBox.address,
            "logoutMessageRLP",
            validatorIndex,
            0
        );

        // Withdraw
        await expectEvent(
            casper.withdraw.sendTransaction(validatorIndex),
            withdrawalBox.EtherReceived(),
            { amount: stakeAmount }
        );

        // Sweep
        await expectEvent(
            treasury.sweep.sendTransaction(withdrawalBox.address),
            treasury.Deposit(),
            { from: withdrawalBox.address, amount: stakeAmount }
        )
    });
});