const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");

// ============ Test TokenVault ============ //

const TokenVault = artifacts.require('TokenVault');
const GovernanceToken = artifacts.require('GovernanceToken');

const GOV_TOKEN_INITIAL_SUPPLY = 180e6 * 1e18;

contract('TokenVault', async accounts => {
    let tokenVault;
    let govToken;

    before(async () => {

        govToken = await GovernanceToken.new(GOV_TOKEN_INITIAL_SUPPLY);

        tokenVault = await TokenVault.new(govToken.address);
    });

    it('locks tokens', async () => {
        let lockAmount = web3.toBigNumber(10e18);
        await govToken.approve(tokenVault.address, lockAmount);

        let balanceBefore = await govToken.balanceOf(accounts[0]);
        let lockerBefore = new Locker(await tokenVault.lockers(accounts[0]));

        let blockhash = (await tokenVault.lockTokens(lockAmount)).receipt.blockHash;
        let blockTimestamp = web3.toBigNumber((await web3.eth.getBlock(blockhash)).timestamp);

        let balanceAfter = await govToken.balanceOf(accounts[0]);
        let lockerAfter = new Locker(await tokenVault.lockers(accounts[0]));

        assert.deepEqual(
            balanceAfter,
            balanceBefore.minus(lockAmount),
            "The token balance was not deducted"
        );

        assert.deepEqual(
            lockerAfter,
            {
                amount: lockerBefore.amount.plus(lockAmount),
                lastIncreasedAt: blockTimestamp
            },
            "The locker was not updated correctly"
        );
    });

    it('locks tokens on receiveApproval', async () => {
        let lockAmount = web3.toBigNumber(10e18);

        let balanceBefore = await govToken.balanceOf(accounts[0]);
        let lockerBefore = new Locker(await tokenVault.lockers(accounts[0]));

        let blockhash = (await govToken.approveAndCall(tokenVault.address, lockAmount, "")).receipt.blockHash;
        let blockTimestamp = web3.toBigNumber((await web3.eth.getBlock(blockhash)).timestamp);

        let balanceAfter = await govToken.balanceOf(accounts[0]);
        let lockerAfter = new Locker(await tokenVault.lockers(accounts[0]));

        assert.deepEqual(
            balanceAfter,
            balanceBefore.minus(lockAmount),
            "The token balance was not deducted"
        );

        assert.deepEqual(
            lockerAfter,
            {
                amount: lockerBefore.amount.plus(lockAmount),
                lastIncreasedAt: blockTimestamp
            },
            "The locker was not updated correctly"
        );
    });

    it('logs an event on lockTokens', async () => {
        let lockAmount = web3.toBigNumber(10e18);
        await govToken.approve(tokenVault.address, lockAmount);

        await expectEvent(
            tokenVault.lockTokens(lockAmount),
            tokenVault.TokensLocked,
            { owner: accounts[0], amount: lockAmount }
        );
    });

    it('unlocks tokens', async () => {
        let lockAmount = web3.toBigNumber(10e18);
        await govToken.approve(tokenVault.address, lockAmount);
        await tokenVault.lockTokens(lockAmount);

        let lockerBefore = new Locker(await tokenVault.lockers(accounts[0]));
        let balanceBefore = await govToken.balanceOf(accounts[0]);

        await expectThrow(
            tokenVault.unlockTokens(lockerBefore.amount.add(1)),
            "Cannot unlock more than is locked"
        );

        await tokenVault.unlockTokens(lockerBefore.amount);

        let lockerAfter = new Locker(await tokenVault.lockers(accounts[0]));
        let balanceAfter = await govToken.balanceOf(accounts[0]);

        assert.deepEqual(
            balanceAfter,
            balanceBefore.plus(lockerBefore.amount),
            "The tokens were not sent back"
        );

        assert.deepEqual(
            lockerAfter,
            {
                amount: web3.toBigNumber(0),
                lastIncreasedAt: lockerBefore.lastIncreasedAt
            },
            "The locker was not updated correctly"
        );

    });

    it('logs an event on unlockTokens', async () => {
        let lockAmount = web3.toBigNumber(10e18);
        await govToken.approve(tokenVault.address, lockAmount);
        await tokenVault.lockTokens(lockAmount);

        await expectEvent(
            tokenVault.unlockTokens(lockAmount),
            tokenVault.TokensUnlocked,
            {
                owner: accounts[0],
                amount: lockAmount
            }
        );
    });

    it('keeps track of the total amount of locked tokens', async () => {
        let lockAmount = web3.toBigNumber(100e18);

        let totalLockedBefore = await tokenVault.totalLocked();
        
        await govToken.approve(tokenVault.address, lockAmount); 
        await tokenVault.lockTokens(lockAmount);

        let totalLockedAfter = await tokenVault.totalLocked();

        assert.deepEqual(
            totalLockedAfter,
            totalLockedBefore.add(lockAmount),
            "The total locked amount was not increased correctly"
        );

        totalLockedBefore = totalLockedAfter;

        await tokenVault.unlockTokens(lockAmount);

        totalLockedAfter = await tokenVault.totalLocked();

        assert.deepEqual(
            totalLockedAfter,
            totalLockedBefore.sub(lockAmount),
            "The total locked amount was not decreased correctly"
        );
    });
});

class Locker {
    constructor(lockerArray) {
        this.amount = lockerArray[0];
        this.lastIncreasedAt = lockerArray[1];
    }
}