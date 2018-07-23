const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");

// ============ Test DivisionsToken ============ //

const DivisionsToken = artifacts.require('DivisionsToken');
const MockTokenRecipient = artifacts.require('MockTokenRecipient');

contract('DivisionsToken', async accounts => {
    let minter = accounts[1];
    let divisionsToken;
    let tokenRecipient;

    before(async () => {
        divisionsToken = await DivisionsToken.new();

        tokenRecipient = await MockTokenRecipient.new();
    });

    beforeEach(async () => {
        await divisionsToken.transferMintership(minter);
    });

    it('mints', async () => {
        let mintedAmount = 10e18;
        let recipient = accounts[2];
        let balanceBefore = await divisionsToken.balanceOf(recipient);
        let supplyBefore = await divisionsToken.totalSupply();

        await divisionsToken.mint(recipient, mintedAmount, { from: minter });
        let balanceAfter = await divisionsToken.balanceOf(recipient);

        assert.equal(
            balanceAfter.valueOf(),
            balanceBefore.plus(mintedAmount).valueOf(),
            "The minted amount was not added to the recipient's balance"
        );

        let supplyAfter = await divisionsToken.totalSupply();

        assert.equal(
            supplyAfter.valueOf(),
            supplyBefore.plus(mintedAmount).valueOf(),
            "The minted amount was not added to the total supply"
        );

        await expectThrow(
            divisionsToken.mint(recipient, mintedAmount),
            "Only the minter can mint"
        );

        await expectThrow(
            divisionsToken.mint(recipient, 0, { from: minter }),
            "Cannot mint 0"
        )

        await expectThrow(
            divisionsToken.mint(0, mintedAmount, { from: minter }),
            "Cannot mint to address 0x0"
        );
    });

    it('logs an event on mint', async () => {
        let mintedAmount = web3.toBigNumber(10e18);
        let recipient = accounts[2];

        await expectEvent(
            divisionsToken.mint(recipient, mintedAmount, { from: minter }),
            divisionsToken.Mint,
            { recipient: recipient, amount: mintedAmount }
        );
    });

    it('burns', async () => {
        let burnedAmount = 10e18;

        await divisionsToken.mint(minter, burnedAmount, { from: minter });

        let balanceBefore = await divisionsToken.balanceOf(minter);
        let totalSupplyBefore = await divisionsToken.totalSupply();

        await divisionsToken.burn(burnedAmount, { from: minter });

        let balanceAfter = await divisionsToken.balanceOf(minter);
        let totalSupplyAfter = await divisionsToken.totalSupply();

        assert.equal(
            balanceAfter.valueOf(),
            balanceBefore.minus(burnedAmount).valueOf(),
            "The balance of the minter was not deducted correctly"
        );

        assert.equal(
            totalSupplyAfter.valueOf(),
            totalSupplyBefore.minus(burnedAmount).valueOf(),
            "The total supply was not deducted correctly"
        );

        await divisionsToken.mint(minter, burnedAmount, { from: minter });
        await expectThrow(
            divisionsToken.burn(burnedAmount),
            "Only the minter can burn tokens"
        );

        let minterBalance = await divisionsToken.balanceOf(minter);

        await expectThrow(
            divisionsToken.burn(minterBalance.plus(1), { from: minter }),
            "Cannot burn more than the minter's balance"
        );

        await expectThrow(
            divisionsToken.burn(0, { from: minter }),
            "Cannot burn 0"
        );
    });

    it('logs an event on burn', async () => {
        let burnedAmount = web3.toBigNumber(10e18);
        await divisionsToken.mint(minter, burnedAmount, { from: minter });

        await expectEvent(
            divisionsToken.burn(burnedAmount, { from: minter }),
            divisionsToken.Burn,
            { amount: burnedAmount }
        );
    });

    it('transfers mintership', async () => {
        let newMinter = accounts[2];
        await divisionsToken.transferMintership(newMinter);
        let actualMinter = await divisionsToken.minter();

        assert.equal(actualMinter, newMinter, "The minter role was not transferred");

        await expectThrow(
            divisionsToken.transferMintership(minter, { from: accounts[4] }),
            "Only the owner can transfer mintership"
        );

        await expectThrow(
            divisionsToken.transferMintership(0),
            "Cannot tranfer mintership to address 0x0"
        );
    });

    it('logs an event on transferMintership', async () => {
        let newMinter = accounts[2];

        await expectEvent(
            divisionsToken.transferMintership(newMinter),
            divisionsToken.MintershipTransferred,
            { oldMinter: minter, newMinter: newMinter }
        );
    });

    it('approves and calls', async () => {
        let approvedAmount = web3.toBigNumber(10 ** 18);
        let data = web3.toHex("This is data");
        await divisionsToken.mint(accounts[0], approvedAmount, {from: minter});
        
        let allowanceBefore = await divisionsToken.allowance(accounts[0], tokenRecipient.address);

        await expectEvent(
            divisionsToken.approveAndCall(
                tokenRecipient.address, approvedAmount, data
            ),
            tokenRecipient.ReceiveApprovalCalled,
            {
                from: accounts[0],
                value: approvedAmount,
                msgValue: web3.toBigNumber(0),
                token: divisionsToken.address,
                extraData: data
            }
        );

        let allowanceAfter = await divisionsToken.allowance(accounts[0], tokenRecipient.address);

        assert.equal(
            allowanceAfter.valueOf(),
            allowanceBefore.plus(approvedAmount).valueOf(),
            "The approval was not updated"
        );
    });
});