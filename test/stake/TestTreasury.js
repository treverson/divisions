const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");

// ============ Test Treasury ============ //

const Treasury = artifacts.require('Treasury');
const MockCasper = artifacts.require('MockCasper');
const MockWithdrawalBox = artifacts.require('MockWithdrawalBox');

const minDepositSize = web3.toWei(1, 'ether');
const epochLength = 20;

contract('Treasury', async accounts => {
    let treasury;
    let casper;
    let treasurer;

    before(async () => {
        treasurer = accounts[1];
        casper = await MockCasper.new(minDepositSize, epochLength);
        treasury = await Treasury.new(casper.address);
    });

    beforeEach(async () => {
        await treasury.transferTreasurership(treasurer);
    })

    it('sets the treasurer', async () => {
        await treasury.transferTreasurership(accounts[2]);
        let treasurerAfter = await treasury.treasurer();
        assert.equal(treasurerAfter, accounts[2],
            "The treasurer was not set");

        await expectThrow(treasury.transferTreasurership(0),
            "Cannot set the treasurer to address 0x0"
        );

        await expectThrow(
            treasury.transferTreasurership(accounts[3], { from: accounts[2] }),
            "Cannot set the treasurer from an account that is not the owner"
        );
    });

    it('logs an event on transferTreasurership', async () => {
        let oldTreasurer = await treasury.treasurer();
        let newTreasurer = accounts[6];
        await expectEvent(
            treasury.transferTreasurership.sendTransaction(newTreasurer),
            treasury.TreasurershipTransferred(),
            { previousTreasurer: oldTreasurer, newTreasurer: newTreasurer },
        );
    });

    it('transfers ether', async () => {
        let transferredWei = web3.toWei(3, 'ether');
        await treasury.sendTransaction({ value: transferredWei });

        let recipient = accounts[7];
        let recipientBalanceBefore = await web3.eth.getBalance(recipient);

        await treasury.transfer(recipient, transferredWei, { from: treasurer });

        let recipientBalanceAfter = await web3.eth.getBalance(recipient);

        assert.equal(
            recipientBalanceAfter.valueOf(),
            recipientBalanceBefore.plus(transferredWei).valueOf(),
            "The ether was not transferred"
        );

        await treasury.sendTransaction({ value: transferredWei });
        await expectThrow(treasury.transfer(recipient, transferredWei), "Only the treasurer can transfer ether");

    });

    it('logs an event on transfer', async () => {
        let transferredWei = web3.toBigNumber(web3.toWei(2, 'ether'));
        await treasury.sendTransaction({ value: transferredWei });

        let recipient = accounts[0];

        expectEvent(
            treasury.transfer.sendTransaction(recipient, transferredWei, { from: treasurer }),
            treasury.Transfer(),
            { to: recipient, amount: transferredWei }
        );
    });

    it('logs an event on deposit', async () => {
        let investedWei = web3.toBigNumber(web3.toWei(3, 'ether'));

        await expectEvent(
            treasury.deposit.sendTransaction({ value: investedWei }),
            treasury.Deposit(),
            { from: accounts[0], amount: investedWei },
        );

    });

    it('stakes ether with Casper', async () => {
        let stakedWei = web3.toBigNumber(web3.toWei(3, 'ether'));
        await treasury.sendTransaction({ value: stakedWei });

        let validatorAddress = accounts[8];
        let withdrawalBox = await MockWithdrawalBox.new();

        let nextValidatorIndex = await casper.next_validator_index();
        let startDynasty = (await casper.dynasty()).plus(2);

        await expectEvent(
            treasury.stake.sendTransaction(
                stakedWei,
                validatorAddress,
                withdrawalBox.address,
                { from: treasurer }
            ),
            casper.Deposit(),
            {
                _from: treasury.address,
                _validator_index: nextValidatorIndex,
                _validation_address: validatorAddress,
                _start_dyn: startDynasty,
                _amount: stakedWei
            }
        );

        await treasury.sendTransaction({ value: stakedWei });
        await expectThrow(
            treasury.stake(stakedWei, validatorAddress, withdrawalBox.address),
            "Only the teasurer can stake Ether"
        );
    });

    it('updates the totalScaledDeposit on stake', async () => {

        let stakedWei = web3.toBigNumber(web3.toWei(3, 'ether'));
        await treasury.sendTransaction({ value: stakedWei });

        let validatorAddress = accounts[8];
        let withdrawalBox = await MockWithdrawalBox.new();

        let nextValidatorIndex = await casper.next_validator_index();
        let startDynasty = (await casper.dynasty()).plus(2);

        let depositScaleFactor = await casper.deposit_scale_factor(await casper.current_epoch());
        let totalScaledDepositBefore = await treasury.totalScaledDeposit();
        
        await treasury.stake.sendTransaction(
            stakedWei,
            validatorAddress,
            withdrawalBox.address,
            { from: treasurer }
        );

        let totalScaledDepositAfter = await treasury.totalScaledDeposit();

        assert.equal(
            totalScaledDepositAfter.valueOf(),
            totalScaledDepositBefore.add(stakedWei.dividedBy(depositScaleFactor)).valueOf(),
            "The total scaled deposit was not updated correctly"
        );
    });

    it('updates the totalScaledDeposit on vote', async () => {
        assert.fail('TODO');
    })

    /* TODO To StakeManager */
    // it('sets the withdrawalBox\'s scaledDeposit on stake', async () => {
    //     let stakedWei = web3.toBigNumber(web3.toWei(3, 'ether'));
    //     await treasury.sendTransaction({ value: stakedWei });

    //     let validatorAddress = accounts[8];
    //     let withdrawalBox = await MockWithdrawalBox.new();

    //     let nextValidatorIndex = await casper.next_validator_index();
    //     let startDynasty = (await casper.dynasty()).plus(2);

    //     let depositScaleFactor = await casper.deposit_scale_factor(await casper.current_epoch());

    //     await treasury.stake(
    //         stakedWei,
    //         validatorAddress,
    //         withdrawalBox.address,
    //         { from: treasurer }
    //     );

    //     let expectedScaledDeposit = stakedWei.divToInt(depositScaleFactor);
    //     let actualScaledDeposit = await withdrawalBox.scaledDeposit();

    //     assert.equal(
    //         actualScaledDeposit.valueOf(),
    //         expectedScaledDeposit.valueOf(),
    //         "The scaled deposit was not stored"
    //     );

    //     assert.fail('TODO: to StakeManager');

    // });

    it('logs an event on stake', async () => {
        let stakedWei = web3.toBigNumber(web3.toWei(1, 'ether'));
        await treasury.sendTransaction({ value: stakedWei });

        let validatorAddress = accounts[8];
        let withdrawalBox = await MockWithdrawalBox.new();

        await expectEvent(
            treasury.stake.sendTransaction(stakedWei, validatorAddress, withdrawalBox.address, { from: treasurer }),
            treasury.Stake(),
            {
                validatorAddress: validatorAddress,
                withdrawalBox: withdrawalBox.address,
                amount: stakedWei
            }
        );
    });

    it('updates the totalScaledDeposit and totalLoggedOutDeposit on logout', async () => {
        let stakedWei = web3.toBigNumber(web3.toWei(3, 'ether'));
        await treasury.sendTransaction({ value: stakedWei });

        let validatorAddress = accounts[8];
        let withdrawalBox = await MockWithdrawalBox.new();

        let nextValidatorIndex = await casper.next_validator_index();
        let startDynasty = (await casper.dynasty()).plus(2);

        let depositScaleFactor = await casper.deposit_scale_factor(await casper.current_epoch());

        await treasury.stake(
            stakedWei,
            validatorAddress,
            withdrawalBox.address,
            { from: treasurer }
        );

        let totalScaledDepositBefore = await treasury.totalScaledDeposit();
        let totalLoggedOutDepositBefore = await treasury.totalLoggedOutDeposit();

        let scaledDeposit = new Validator(await casper.validators(nextValidatorIndex)).deposit;

        await treasury.onLogout(withdrawalBox.address, { from: treasurer });

        let totalScaledDepositAfter = await treasury.totalScaledDeposit();
        let totalLoggedOutDepositAfter = await treasury.totalLoggedOutDeposit();

        assert.equal(
            totalScaledDepositAfter.valueOf(),
            totalScaledDepositBefore.minus(scaledDeposit).valueOf(),
            "The total scaled deposit was not updated correctly"
        );

        assert.equal(
            totalLoggedOutDepositAfter.valueOf(),
            totalLoggedOutDepositBefore.plus(scaledDeposit.times(depositScaleFactor)).valueOf(),
            "The total logged out deposit was not updated correctly"
        );
    });



    it('checks that only the treasurer can call onLogout', async () => {
        let stakedWei = web3.toBigNumber(web3.toWei(3, 'ether'));
        await treasury.sendTransaction({ value: stakedWei });

        let validatorAddress = accounts[8];
        let withdrawalBox = await MockWithdrawalBox.new();

        let nextValidatorIndex = await casper.next_validator_index();
        let startDynasty = (await casper.dynasty()).plus(2);

        let depositScaleFactor = await casper.deposit_scale_factor(await casper.current_epoch());

        await treasury.stake(
            stakedWei,
            validatorAddress,
            withdrawalBox.address,
            { from: treasurer }
        );

        let totalScaledDepositBefore = await treasury.totalScaledDeposit();
        let totalLoggedOutDepositBefore = await treasury.totalLoggedOutDeposit();

        let scaledDeposit = new Validator(await casper.validators(nextValidatorIndex)).deposit;

        await expectThrow(
            treasury.onLogout(withdrawalBox.address),
            "Only the treasurer can call onLogout"
        );
    })

    /* TODO To StakeManager */
    // it('sets the WithdrawalBox\'s logout epoch on logout', async () => {
    //     let currentEpoch = await casper.current_epoch();
    //     let stakedWei = web3.toBigNumber(web3.toWei(3, 'ether'));

    //     await treasury.sendTransaction({ value: stakedWei });

    //     let validatorAddress = accounts[8];
    //     let withdrawalBox = await MockWithdrawalBox.new();

    //     let depositScaleFactor = await casper.deposit_scale_factor(await casper.current_epoch());

    //     await treasury.stake(
    //         stakedWei,
    //         validatorAddress,
    //         withdrawalBox.address,
    //         { from: treasurer }
    //     );

    //     await treasury.onLogout(withdrawalBox.address, { from: treasurer });

    //     let logoutEpoch = await withdrawalBox.logoutEpoch();
    //     assert.equal(
    //         logoutEpoch.valueOf(),
    //         currentEpoch.valueOf(),
    //         "The logout epoch was not stored correctly"
    //     );

    //     assert.fail('TODO: to StakeManager');
    // });

    it('sweeps WithdrawalBoxes', async () => {
        let stakedWei = web3.toBigNumber(web3.toWei(3, 'ether'));
        await treasury.sendTransaction({ value: stakedWei });

        let validatorAddress = accounts[8];
        let withdrawalBox = await MockWithdrawalBox.new();

        let depositScaleFactor = await casper.deposit_scale_factor(await casper.current_epoch());

        await treasury.stake(
            stakedWei,
            validatorAddress,
            withdrawalBox.address,
            { from: treasurer }
        );

        await treasury.onLogout(withdrawalBox.address, { from: treasurer });

        let totalLoggedOutDepositBefore = await treasury.totalLoggedOutDeposit();

        await expectEvent(
            treasury.sweep.sendTransaction(withdrawalBox.address),
            treasury.Sweep(),
            { withdrawalBox: withdrawalBox }
        );

        let totalLoggedOutDepositAfter = await treasury.totalLoggedOutDeposit();
        let scaledDeposit = await withdrawalBox.scaledDeposit();

        assert.equal(
            totalLoggedOutDepositAfter.valueOf(),
            totalLoggedOutDepositBefore.minus(scaledDeposit.times(depositScaleFactor)).valueOf(),
            "The total logged out deposit was not updated correctly"
        );
    });

    it('gets the total pool size in ether', async () => {
        assert.fail('TODO');
    });
});

class Validator {
    constructor(validatorArray) {
        this.deposit = validatorArray[0];
        this.startDynasty = validatorArray[1];
        this.endDynasty = validatorArray[2];
        this.addr = validatorArray[3];
        this.withdrawalAddr = validatorArray[4];
    }
}