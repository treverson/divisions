const expectThrow = require("../../test-helpers/expectThrow");
const web3Extensions = require("../../test-helpers/web3Extensions");
web3Extensions.init(web3);

// ============ Test WithdrawalBox ============ //

const WithdrawalBox = artifacts.require('WithdrawalBox');

contract('WithdrawalBox', async accounts => {
    let withdrawalBox, recipient;

    before(async () => {
        recipient = accounts[1];
        withdrawalBox = await WithdrawalBox.new(3, recipient);
    });

    it('stores the block height of the moment it was deployed', async () => {
        let deploymentBlockNumber = (await web3.eth.getTransaction(withdrawalBox.transactionHash)).blockNumber;
        let deployedAt = await withdrawalBox.deployedAt();
        assert.equal(deployedAt.valueOf(), deploymentBlockNumber, "The block number of when the contract was deployed was not set");
    });

    it('stores logout message', async () => {
        let logoutMsg = "iwannalogout";
        await withdrawalBox.setLogoutMessage(logoutMsg);
        assert.equal(logoutMsg, web3.toAscii(await withdrawalBox.logoutMessage()), "The logout message is not correct");
    });

    it('only allows its creator to set the logout message', async () => {
        let logoutMsg = "iwannalogout";
        await withdrawalBox.setLogoutMessage(logoutMsg);
        await expectThrow(withdrawalBox.setLogoutMessage(logoutMsg, {from: accounts[2]}),
            "cannot set the logout message from an address that is not the owner");
    });

    it('can send claimed Ether to the recipient', async () => {
        let balanceBefore = await web3.eth.getBalance(recipient);

        let amount = web3.toWei(1, "ether");
        web3.eth.sendTransaction({ from: accounts[0], to: withdrawalBox.address, value: amount });
        let balance = await web3.eth.getBalance(withdrawalBox.address);
        await withdrawalBox.sweep();

        let balanceAfter = await web3.eth.getBalance(recipient);
        assert.equal(balanceAfter.valueOf(), balanceBefore.add(amount).valueOf(), "The ether was not sent to the recipient");
    });
});