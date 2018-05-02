const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");
let TransactionListener = require('../../test-helpers/TransactionListener');
let transactionListener = new TransactionListener();

// ============ Test GovernanceToken ============ //

const GovernanceToken = artifacts.require('GovernanceToken');
const MockTokenRecipient = artifacts.require('MockTokenRecipient');

const INITIAL_SUPPLY = web3.toBigNumber(100e18);

contract('GovernanceToken', async accounts => {
    let govToken;
    let tokenRecipient;
    before(async () => {
        govToken = await GovernanceToken.new(INITIAL_SUPPLY);
        tokenRecipient = await MockTokenRecipient.new();
    });

    it('Has a total supply equal to the initial supply', async () =>{
        assert.deepEqual(
            await govToken.totalSupply(),
            INITIAL_SUPPLY,
            "The total supply was not equal to the initial supply"
        );
    });

    it('approves and calls', async () => {
        let approvedAmount = 10 ** 18;
        let data = web3.toHex("This is data");
        
        let allowanceBefore = await govToken.allowance(accounts[0], tokenRecipient.address);

        await expectEvent(
            govToken.approveAndCall.sendTransaction(
                tokenRecipient.address, approvedAmount, data
            ),
            tokenRecipient.ReceiveApprovalCalled(),
            {
                from: accounts[0],
                value: approvedAmount,
                token: govToken.address,
                extraData: data
            }
        );

        let allowanceAfter = await govToken.allowance(accounts[0], tokenRecipient.address);

        assert.equal(
            allowanceAfter.valueOf(),
            allowanceBefore.plus(approvedAmount).valueOf(),
            "The approval was not updated"
        );
    });

});