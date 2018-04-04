const expectThrow = require("../../test-helpers/expectThrow");
const web3Extensions = require("../../test-helpers/web3Extensions");
web3Extensions.init(web3);

// ============ Test Treasury ============ //

const Treasury = artifacts.require('Treasury');

contract('Treasury', async accounts => {
    let treasury;

    before(async () => {
        treasury = Treasury.new(accounts[1]);
    });
    
    it('sets the treasurer', async () => {
        let treasurerBefore = await treasury.treasurer();
        assert.equal(treasurerBefore, accounts[1], 
            "The treasurer was not set correctly in the constructor");

        await treasury.setTreasurer(accounts[2]);
        let treasurerAfter = await treasury.treasurer();
        assert.equal(treasurerAfter, accounts[2],
            "The treasurer was not set");

        await expectThrow(treasury.setTreasurer(0),
            "cannot set the treasurer to address 0x0");
        await expectThrow(
            treasury.setTreasurer(accounts[3]), {from: accounts[2]},
            "cannot set the treasurer from an address that is not the owner");
    });

    it('updates the total pool balance when a pool deposit is made', async () => {
        let depositedWei = web3.toWei(2, 'ether');
        let totalPoolBalanceBefore = await treasury.totalPoolBalance();
        
        await treasury.depositToPool({value: depositedWei});
        let totalPoolBalanceAfter = await treasury.totalPoolBalance();
        assert.equal(
            totalPoolBalanceAfter.valueOf(),
            totalPoolBalanceBefore.plus(depositedWei).valueOf(),
            "The total pool balance was not updated correctly"
        );

    });

    it('updates the pool balance when a withdrawal is made from the pool', async () => {
        
    });

    it('transfers ether within the pool', async () => {

    });

    it('', async () => {

    });
});