const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");
let TransactionListener = require('../../test-helpers/TransactionListener');
let transactionListener = new TransactionListener();

// ============ Test Prototype 2 ============ //

const path = require('path');
const conf = require(path.join(__dirname, '..', '..', 'migrations', 'migrationConfig'));

let StakeManager = artifacts.require('StakeManager');
let MockCasper = artifacts.require('MockCasper');
let Treasury = artifacts.require('Treasury');
let WithdrawalBox = artifacts.require('WithdrawalBox');

let DivisionToken = artifacts.require('DivisionsToken');
let Exchange = artifacts.require('Exchange');

let GovernanceToken = artifacts.require('GovernanceToken');
let Senate = artifacts.require('Senate');
let TokenVault = artifacts.require('TokenVault');

contract('Prototype 2', async accounts => {
    let casper;
    let stakeManager;
    let treasury;
    let validator;
    let president;
    let divToken;
    let exchange;
    let senate;
    let tokenVault;
    let govToken;

    before(async () => {
        validator = accounts[0];
        president = accounts[0];

        casper = await MockCasper.deployed();
        treasury = await Treasury.deployed();
        stakeManager = await StakeManager.deployed();
        divToken = await DivisionToken.deployed();
        exchange = await Exchange.deployed();
        govToken = await GovernanceToken.deployed();
        senate = await Senate.deployed();
        tokenVault = await TokenVault.deployed();
    });

    it('Completes a staking cycle', async () => {
        // Place buy order
        await exchange.placeBuyOrder({ value: web3.toWei(1, 'ether') });

        // Deposit
        let stakeAmount = await stakeManager.getStakeableAmount();
        console.log(casper.address);
        let out = await expectEvent(
            stakeManager.makeStakeDeposit(),
            casper.DepositCalled(),
            {
                validation_addr: validator,
                withdrawal_addr: '@any',
                amount: stakeAmount
            }
        );

        let divBalance = await divToken.balanceOf(accounts[0]);

        let withdrawalBox = WithdrawalBox.at(out.withdrawal_addr);
        let validatorIndex = await casper.validator_indexes(withdrawalBox.address);

        // Vote
        let vote = web3.toHex("votemessage");
        let targetHash = "hash";
        let targetEpoch = 10;
        let sourceEpoch = 11;

        await expectEvent(
            stakeManager.vote(
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
            casper.withdraw(validatorIndex),
            withdrawalBox.EtherReceived(),
            { amount: stakeAmount }
        );

        // Sweep
        await expectEvent(
            treasury.sweep(withdrawalBox.address),
            treasury.Deposit(),
            { from: withdrawalBox.address, amount: stakeAmount }
        )

        // Place sell order
        await divToken.approveAndCall(
            exchange.address,
            divBalance,
            ""
        );

        let weiReserve = await exchange.weiReserve();
        let divReserve = await exchange.divReserve();
        let price = await exchange.divPrice();
        let divReserveInWei = await exchange.toWei(divReserve);

        // Refill exchange
        await stakeManager.refillExchange();

        assert.deepEqual(
            await exchange.payments(accounts[0]),
            web3.toBigNumber(web3.toWei(1, 'ether')),
            "The sell order was not filled"
        );
    });
});