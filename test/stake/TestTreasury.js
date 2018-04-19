const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");

// ============ Test Treasury ============ //

const Treasury = artifacts.require('Treasury');
const AWithdrawalBox = artifacts.require('AWithdrawalBox');

const MockCasper = artifacts.require('MockCasper');
const MockWithdrawalBox = artifacts.require('MockWithdrawalBox');
const MockStakeManager = artifacts.require('MockStakeManager');


const minDepositSize = web3.toWei(1, 'ether');
const epochLength = 20;
const dynastyLogoutDelay = 0;
const withdrawalDelay = 0;

contract('Treasury', async accounts => {
    let treasury;
    let casper;
    let stakeManager;

    before(async () => {
        stakeManager = accounts[1];
        casper = await MockCasper.new(minDepositSize, epochLength, dynastyLogoutDelay, withdrawalDelay);
        treasury = await Treasury.new(casper.address);
    });

    beforeEach(async () => {
        await treasury.setStakeManager(stakeManager);
    })

    it('sets the StakeManager', async () => {
        await treasury.setStakeManager(accounts[2]);
        let stakeManagerAfter = await treasury.stakeManager();
        assert.equal(stakeManagerAfter, accounts[2],
            "The StakeManager was not set");

        await expectThrow(treasury.setStakeManager(0),
            "Cannot set the StakeManager to address 0x0"
        );

        await expectThrow(
            treasury.setStakeManager(accounts[3], { from: accounts[2] }),
            "Cannot set the StakeManager from an account that is not the owner"
        );
    });

    it('logs an event on setStakeManager', async () => {
        let oldStakeManager = await treasury.stakeManager();
        let newStakeManager = accounts[6];
        await expectEvent(
            treasury.setStakeManager.sendTransaction(newStakeManager),
            treasury.StakeManagerSet(),
            { previousStakeManager: oldStakeManager, newStakeManager: newStakeManager },
        );
    });

    it('transfers ether', async () => {
        let transferredWei = web3.toWei(3, 'ether');
        await treasury.sendTransaction({ value: transferredWei });

        let recipient = accounts[7];
        let recipientBalanceBefore = await web3.eth.getBalance(recipient);

        await treasury.transfer(recipient, transferredWei, { from: stakeManager });

        let recipientBalanceAfter = await web3.eth.getBalance(recipient);

        assert.deepEqual(
            recipientBalanceAfter,
            recipientBalanceBefore.plus(transferredWei),
            "The ether was not transferred"
        );

        await treasury.sendTransaction({ value: transferredWei });
        await expectThrow(treasury.transfer(recipient, transferredWei), "Only the StakeManager can transfer ether");

    });

    it('logs an event on transfer', async () => {
        let transferredWei = web3.toBigNumber(web3.toWei(2, 'ether'));
        await treasury.sendTransaction({ value: transferredWei });

        let recipient = accounts[0];

        expectEvent(
            treasury.transfer.sendTransaction(recipient, transferredWei, { from: stakeManager }),
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
                { from: stakeManager }
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
            "Only the StakeManager can stake Ether"
        );
    });


    it('logs an event on stake', async () => {
        let stakedWei = web3.toBigNumber(web3.toWei(1, 'ether'));
        await treasury.sendTransaction({ value: stakedWei });

        let validatorAddress = accounts[8];
        let withdrawalBox = await MockWithdrawalBox.new();

        await expectEvent(
            treasury.stake.sendTransaction(stakedWei, validatorAddress, withdrawalBox.address, { from: stakeManager }),
            treasury.Stake(),
            {
                validatorAddress: validatorAddress,
                withdrawalBox: withdrawalBox.address,
                amount: stakedWei
            }
        );
    });

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
            { from: stakeManager }
        );

        await expectEvent(
            treasury.sweep.sendTransaction(withdrawalBox.address),
            treasury.Sweep(),
            { withdrawalBox: withdrawalBox }
        );

    });

    it('gets the total pool size in ether', async () => {
        let stakeManager = await MockStakeManager.new(casper.address, treasury.address);
        await treasury.setStakeManager(stakeManager.address);

        for (let i = 0; i < 40; i++) {
            let nextValidatorIndex = await casper.next_validator_index();
            let stake = web3.toWei(i % 5, 'ether');
            await treasury.sendTransaction({ value: stake, from: accounts[i % 10] });
            await stakeManager.makeStakeDeposit();
            if (i % 4 == 0) {
                let out = await expectEvent(
                    casper.doLogout.sendTransaction(nextValidatorIndex, 0),
                    casper.Logout()
                );
                await casper.increment_dynasty();
            }
            if (i % 2 == 0) {
                await casper.increment_epoch();
            }
        }

        let treasuryBalance = await web3.eth.getBalance(treasury.address);

        let depositScaleFactor = await casper.deposit_scale_factor(await casper.current_epoch());
        let currentDynasty = await casper.dynasty();

        let totalScaledActiveDeposit = web3.toBigNumber(0);
        let totalLoggedOutDeposit = web3.toBigNumber(0);
        let totalWithdrawalBoxBalance = web3.toBigNumber(0);

        let withdrawalBoxesLength = await stakeManager.withdrawalBoxesLength();

        for (let i = 0; i < withdrawalBoxesLength.toNumber(); i++) {
            let withdrawalBox = AWithdrawalBox.at(await stakeManager.withdrawalBoxes(i));

            let validatorIndex = await casper.validator_indexes(withdrawalBox.address);
            if (!validatorIndex.equals(0)) {
                let validator = new Validator(await casper.validators(validatorIndex));

                if (validator.endDynasty.gte(currentDynasty)) {
                    totalScaledActiveDeposit = totalScaledActiveDeposit.plus(validator.deposit);
                } else {
                    let endEpoch = await casper.dynasty_start_epoch(validator.endDynasty.add(1));
                    let endEpochDepositScaleFactor = await casper.deposit_scale_factor(endEpoch);

                    totalLoggedOutDeposit = totalLoggedOutDeposit
                        .add(validator.deposit
                            .times(endEpochDepositScaleFactor)
                        );
                }
            }
            totalWithdrawalBoxBalance = totalWithdrawalBoxBalance
                .add(web3.eth.getBalance(withdrawalBox.address));
        }

        let expectedTotalPoolSize = treasuryBalance
            .plus(totalLoggedOutDeposit)
            .plus(totalWithdrawalBoxBalance)
            .plus(totalScaledActiveDeposit
                .times(depositScaleFactor)
            );
        let actualTotalPoolSize = await treasury.getTotalPoolSize();

        assert.deepEqual(
            actualTotalPoolSize,
            expectedTotalPoolSize,
            "The total pool size was not correct"
        );
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