const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");

// ============ Test WithdrawalBox ============ //

const WithdrawalBox = artifacts.require('WithdrawalBox');

contract('WithdrawalBox', async accounts => {
    let withdrawalBox, recipient;
    
    before(async () => {
        recipient = accounts[1];
        withdrawalBox = await WithdrawalBox.new(recipient);
    });

    it('stores the block height of the moment it was deployed', async () => {
        let deploymentBlockNumber = (await web3.eth.getTransaction(withdrawalBox.transactionHash)).blockNumber;
        let deployedAt = await withdrawalBox.deployedAt();
        assert.equal(deployedAt.valueOf(), deploymentBlockNumber, "The block number of when the contract was deployed was not set");
    });

    it('can send claimed Ether to the recipient', async () => {
        let balanceBefore = await web3.eth.getBalance(recipient);

        let amount = web3.toWei(1, "ether");
        web3.eth.sendTransaction({ from: accounts[0], to: withdrawalBox.address, value: amount });
        let balance = await web3.eth.getBalance(withdrawalBox.address);
        await withdrawalBox.sweep({from: recipient});

        let balanceAfter = await web3.eth.getBalance(recipient);

        assert(balanceBefore.add(amount).minus(balanceAfter).lessThan(1e16), "The ether was not sent to the recipient");

        await expectThrow(
            withdrawalBox.sweep(),
            "Only the recipient can sweep the withdrawalbox"
        );
    });

    it('logs an event on sweep', async () => {
        let withdrawalBoxBalance = await web3.eth.getBalance(withdrawalBox.address);
        await expectEvent(
            withdrawalBox.sweep({from: recipient}),
            withdrawalBox.Sweep,
            { amount: withdrawalBoxBalance }
        );
    });
});