const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");

// ============ Test Treasury ============ //

const Treasury = artifacts.require('Treasury');
const MockCasper = artifacts.require('MockCasper');

contract('Treasury', async accounts => {
    let treasury;
    let casper;
    let treasurer;

    before(async () => {
        treasurer = accounts[1];
        casper = await MockCasper.new();
        treasury = await Treasury.new(treasurer, casper.address);
    });

    beforeEach(async () => {
        await treasury.transferTreasurership(treasurer);
    })

    it('sets the treasurer', async () => {
        let treasurerBefore = await treasury.treasurer();
        assert.equal(treasurerBefore, treasurer,
            "The treasurer was not set correctly in the constructor");

        await treasury.transferTreasurership(accounts[2]);
        let treasurerAfter = await treasury.treasurer();
        assert.equal(treasurerAfter, accounts[2],
            "The treasurer was not set");

        await expectThrow(treasury.transferTreasurership(0),
            "cannot set the treasurer to address 0x0"
        );

        await expectThrow(
            treasury.transferTreasurership(accounts[3], { from: accounts[2] }),
            "cannot set the treasurer from an address that is not the owner"
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
        let withdrawalBox = accounts[9];

        let nextValidatorIndex = await casper.nextValidatorIndex();
        let startDynasty = (await casper.dynasty()).plus(2);
        
        await expectEvent(
            treasury.stake.sendTransaction(
                stakedWei,
                validatorAddress,
                withdrawalBox,
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
            treasury.stake(stakedWei, validatorAddress, withdrawalBox),
            "Only the teasurer can stake Ether"
        );
    });

    it('logs an event on stake', async () => {
        let stakedWei = web3.toBigNumber(web3.toWei(1, 'ether'));
        await treasury.sendTransaction({ value: stakedWei });
        
        let validatorAddress = accounts[8];
        let withdrawalBox = accounts[9];

        await expectEvent(
            treasury.stake.sendTransaction(stakedWei, validatorAddress, withdrawalBox, { from: treasurer }),
            treasury.Stake(),
            {
                validatorAddress: validatorAddress,
                withdrawalBox: withdrawalBox,
                amount: stakedWei
            }
        );
    });
});