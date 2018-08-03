const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");

const BigNumber = require('bignumber.js');

// ============ Test TokenVault ============ //

const MockDelegatingSenate = artifacts.require('MockDelegatingSenate');

const TokenVault = artifacts.require('TokenVault');
const GovernanceToken = artifacts.require('GovernanceToken');

const GOV_TOKEN_INITIAL_SUPPLY = 180e6 * 1e18;

contract('TokenVault', async accounts => {
    let tokenVault;
    let govToken;
    let senate;

    before(async () => {

        senate = await MockDelegatingSenate.new();

        govToken = await GovernanceToken.new(GOV_TOKEN_INITIAL_SUPPLY);

        tokenVault = await TokenVault.new(senate.address, govToken.address);
    });

    it('locks tokens', async () => {
        let lockedAmount = web3.toBigNumber(100e18);

        let lockerBefore = new Locker(await tokenVault.lockers(accounts[0]));
        let unlockAtBlock = web3.toBigNumber(web3.eth.blockNumber + 1);
        await govToken.approve(tokenVault.address, lockedAmount);
        await tokenVault.lockTokens(accounts[0], lockedAmount, unlockAtBlock);

        let lockerAfter = new Locker(await tokenVault.lockers(accounts[0]));
        
        assert.deepEqual(
            lockerAfter,
            {
                amount: lockerBefore.amount.add(lockedAmount),
                unlockAtBlock: unlockAtBlock
            },
            "The locker was not updated correctly"
        );

        await govToken.approve(tokenVault.address, lockedAmount);

        await expectThrow(
            tokenVault.lockTokens(accounts[0], lockedAmount, unlockAtBlock.sub(1)),
            "Should throw when unlockAtBlock is less then current"
        );
    });

    it('locks tokens on receiveApproval', async () => {
        let lockedAmount = web3.toBigNumber(100e18);

        let lockerBefore = new Locker(await tokenVault.lockers(accounts[0]));
        let unlockAtBlock = web3.toBigNumber(web3.eth.blockNumber + 1);

        await govToken.approveAndCall(tokenVault.address, lockedAmount, "");

        let lockerAfter = new Locker(await tokenVault.lockers(accounts[0]));
        
        assert.deepEqual(
            lockerAfter,
            {
                amount: lockerBefore.amount.add(lockedAmount),
                unlockAtBlock: unlockAtBlock
            },
            "The locker was not updated correctly"
        );
    });

    it('logs an event on lockTokens', async () => {
        let lockedAmount = web3.toBigNumber(100e18);

        let lockerBefore = new Locker(await tokenVault.lockers(accounts[0]));

        let unlockAtBlock = web3.toBigNumber(BigNumber.max(
            web3.toBigNumber(web3.eth.blockNumber + 1),
            lockerBefore.unlockAtBlock
        ).valueOf());

        await expectEvent(
            govToken.approveAndCall(tokenVault.address, lockedAmount, ""),
            tokenVault.Lock,
            {
                addr: accounts[0],
                amount: lockedAmount,
                unlockAtBlock: unlockAtBlock
            }
        );
    });

    it('unlocks tokens', async () => {
        let lockedAmount = web3.toBigNumber(100e18);
        let unlockAtBlock = web3.toBigNumber(web3.eth.blockNumber + 1);
        await govToken.approveAndCall(tokenVault.address, lockedAmount, "");

        let balanceBefore = await govToken.balanceOf(accounts[0]);
        let lockerBefore = new Locker(await tokenVault.lockers(accounts[0]));

        await tokenVault.unlockTokens();

        let balanceAfter = await govToken.balanceOf(accounts[0]);
        let lockerAfter = new Locker(await tokenVault.lockers(accounts[0]));

        assert.deepEqual(
            balanceAfter,
            balanceBefore.add(lockerBefore.amount),
            "The tokens were not retributed"
        );

        assert.deepEqual(
            lockerAfter,
            {
                amount: web3.toBigNumber(0),
                unlockAtBlock: lockerBefore.unlockAtBlock
            },
            "The locker was not emptied"
        );

        await expectThrow(
            tokenVault.unlockTokens(),
            "Cannot unlock an empty locker"
        );

        unlockAtBlock = web3.toBigNumber(web3.eth.blockNumber + 20);
        await govToken.approve(tokenVault.address, lockedAmount);
        await tokenVault.lockTokens(accounts[0], lockedAmount, unlockAtBlock);

        await expectThrow(
            tokenVault.unlockTokens(),
            "Cannot unlock a locker for which there is time left"
        );

        
    });

    it('logs an event on unlockTokens', async () => {
        let locker = new Locker(await tokenVault.lockers(accounts[0]));

        // let blocksLeft = locker.unlockAtBlock.minus(web3.eth.blockNumber);
        // Let some blocks pass
        for(let i = 0; web3.eth.blockNumber <= locker.unlockAtBlock.toNumber(); i++) {
            let from = accounts[i % 2];
            let to = accounts[1 - i % 2];
            await govToken.transfer(to, 1, {from: from});
        }

        let lockedAmount = web3.toBigNumber(100e18);

        await govToken.approveAndCall(tokenVault.address, lockedAmount, "");

        locker = new Locker(await tokenVault.lockers(accounts[0]));

        await expectEvent(
            tokenVault.unlockTokens(),
            tokenVault.Unlock,
            {
                addr: accounts[0],
                amount: locker.amount
            }
        );
    });

});

class Locker {
    constructor(lockerArray) {
        this.amount = lockerArray[0];
        this.unlockAtBlock = lockerArray[1];
    }
}