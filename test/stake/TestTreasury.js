const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");

// ============ Test Treasury ============ //

const Treasury = artifacts.require('Treasury');

contract('Treasury', async accounts => {
    let treasury;
    let treasurer;
    before(async () => {
        treasurer = accounts[1];
        treasury = await Treasury.new(treasurer);
    });

    beforeEach(async () => {
        await treasury.transferTreasurership(treasurer);
    })

    it('sets the treasurer', async () => {
        let treasurerBefore = await treasury.treasurer();
        assert.equal(treasurerBefore, accounts[1],
            "The treasurer was not set correctly in the constructor");

        await treasury.transferTreasurership(accounts[2]);
        let treasurerAfter = await treasury.treasurer();
        assert.equal(treasurerAfter, accounts[2],
            "The treasurer was not set");

        await expectThrow(treasury.transferTreasurership(0),
            "cannot set the treasurer to address 0x0");
        await expectThrow(
            treasury.transferTreasurership(accounts[3]), { from: accounts[2] },
            "cannot set the treasurer from an address that is not the owner");
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

    it('updates the total pool balance when a pool deposit is made', async () => {
        let depositedWei = web3.toWei(2, 'ether');
        let totalPoolBalanceBefore = await treasury.totalPoolBalance();

        await treasury.depositToPool({ value: depositedWei });
        let totalPoolBalanceAfter = await treasury.totalPoolBalance();
        assert.equal(
            totalPoolBalanceAfter.valueOf(),
            totalPoolBalanceBefore.plus(depositedWei).valueOf(),
            "The total pool balance was not updated correctly"
        );
    });

    it('updates the pool balance when a withdrawal is made from the pool', async () => {
        let withdrawnWei = web3.toWei(3, 'ether');
        await treasury.depositToPool({ value: withdrawnWei });

        let totalPoolBalanceBefore = await treasury.totalPoolBalance();

        await treasury.withdrawFromPool(accounts[4], withdrawnWei, { from: treasurer });

        let totalPoolBalanceAfter = await treasury.totalPoolBalance();
        assert.equal(
            totalPoolBalanceAfter.valueOf(),
            totalPoolBalanceBefore.minus(withdrawnWei).valueOf(),
            "The total pool balance was not updated correctly"
        );

        await treasury.depositToPool({ value: withdrawnWei });
        await expectThrow(
            treasury.withdrawFromPool(accounts[1], withdrawnWei, { from: accounts[2] },
                "Cannot withdraw with account that is not the treasurer")
        );

    });

    it('sends withdrawn ether to the correct address', async () => {
        let withdrawnWei = web3.toWei(3, 'ether');
        await treasury.sendTransaction({ value: withdrawnWei });

        let accountBalanceBefore = await web3.eth.getBalance(accounts[5]);
        await treasury.withdrawFromPool(accounts[5], withdrawnWei, { from: treasurer });

        let accountBalanceAfter = await web3.eth.getBalance(accounts[5]);

        assert.equal(
            accountBalanceAfter.valueOf(),
            accountBalanceBefore.plus(withdrawnWei).valueOf(),
            "The ether was not withdrawn to the account"
        );
    });

    it('invests ether within the pool', async () => {
        let transferedWei = web3.toWei(3, 'ether');
        await treasury.sendTransaction({ value: transferedWei });

        let totalPoolBalanceBefore = await treasury.totalPoolBalance();
        let transferTo = accounts[6];
        let accountBalanceBefore = await web3.eth.getBalance(transferTo);

        await treasury.invest(transferTo, transferedWei, { from: treasurer });

        let totalPoolBalanceAfter = await treasury.totalPoolBalance();
        let accountBalanceAfter = await web3.eth.getBalance(transferTo);

        assert.equal(
            totalPoolBalanceAfter.valueOf(),
            totalPoolBalanceBefore.valueOf(),
            "When transfering withing the pool, the total pool balance should not be altered"
        );

        await treasury.sendTransaction({ value: transferedWei });
        await expectThrow(
            treasury.invest(accounts[3], transferedWei, { from: accounts[0] },
                "Only the treasurer can transfer Ether from the Treasury"
            ));
    });

    it('logs an event on invest', async () => {
        let transferedWei = web3.toWei(3, 'ether');
        await treasury.sendTransaction({ value: transferedWei });

        let transferTo = accounts[2];

        await expectEvent(
            treasury.invest(transferTo, transferedWei, { from: treasurer }),
            treasury.Transfer(),
            { to: transferTo, amount: transferedWei },
        );
    });

    it('logs an event on deposit', async () => {
        let investedWei = web3.toWei(3, 'ether');

        await expectEvent(
            treasury.deposit({ value: investedWei }),
            treasury.Deposit(),
            { from: accounts[0], amount: investedWei },
        );
    });
});