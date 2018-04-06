const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");

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
        let validatorIndex = web3.toBigNumber(10);
        let epoch = web3.toBigNumber(3);
        await withdrawalBox.setLogoutMessage(logoutMsg, validatorIndex, epoch);

        let logoutMessage = await withdrawalBox.logoutMessage();

        assert.equal(web3.toAscii(logoutMessage[0]), logoutMsg, "The logout message is not correct");
        assert.equal(logoutMessage[1].valueOf(), validatorIndex.valueOf(), "The validator index was not stored");
        assert.equal(logoutMessage[2].valueOf(), epoch.valueOf(), "The epoch was not stored");
    });

    it('only allows its creator to set the logout message', async () => {
        let logoutMsg = "iwannalogout";
        let validatorIndex = web3.toBigNumber(10);
        let epoch = web3.toBigNumber(3);

        await expectThrow(withdrawalBox.setLogoutMessage(logoutMsg, validatorIndex, epoch, { from: accounts[2] }),
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

    it('logs an event on sweep', async () => {
        let withdrawalBoxBalance = await web3.eth.getBalance(withdrawalBox.address);
        await expectEvent(
            withdrawalBox.sweep.sendTransaction(),
            withdrawalBox.Sweep(),
            { amount: withdrawalBoxBalance }
        );
    });

    it('logs an event on setLogoutMessage', async () => {
        let logoutMsg = "iwannalogout";
        let validatorIndex = web3.toBigNumber(10);
        let epoch = web3.toBigNumber(3);

        await expectEvent(
            withdrawalBox.setLogoutMessage.sendTransaction(logoutMsg, validatorIndex, epoch),
            withdrawalBox.LogoutMessageSet(),
            {
                messageRLP: web3.toHex(logoutMsg),
                validatorIndex: validatorIndex,
                epoch: epoch
            }
        );
    });
});