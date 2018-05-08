const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");
let TransactionListener = require('../../test-helpers/TransactionListener');
let transactionListener = new TransactionListener();
const BigNumber = require('bignumber.js');

// ============ Test Senate ============ //

const Senate = artifacts.require('Senate');
const AddressBook = artifacts.require('AddressBook');

const MockGovernanceToken = artifacts.require('MockGovernanceToken');
const MockTokenRecipient = artifacts.require('MockTokenRecipient');

const DEBATING_PERIOD_MS = 1000 * 20; //20s
const GOV_TOKEN_INITIAL_SUPPLY = 180e6 * 1e18;

contract('Senate', async accounts => {
    let senate;
    let addressBook;
    let govToken;
    let president = accounts[1];

    before(async () => {
        govToken = await MockGovernanceToken.new(GOV_TOKEN_INITIAL_SUPPLY);
        addressBook = await AddressBook.new(accounts[0]);

        senate = await Senate.new(
            govToken.address,
            addressBook.address,
            president,
            DEBATING_PERIOD_MS);
    });

    // it('makes proposals', async () => {
    //     let target = accounts[6];
    //     let data = web3.toHex("iwannamakeaproposal");
    //     let value = web3.toBigNumber(web3.toWei(2, 'ether'));
    //     let description = "This is a description";

    //     let proposalsLengthBefore = await senate.proposalsLength();

    //     let blockhash = (await senate.makeProposal(target, data, value, description, { from: president })).receipt.blockHash;
    //     let blockTimestamp = web3.toBigNumber((await web3.eth.getBlock(blockhash)).timestamp);

    //     let proposalsLengthAfter = await senate.proposalsLength();

    //     assert.deepEqual(
    //         proposalsLengthAfter,
    //         proposalsLengthBefore.plus(1),
    //         "The number of proposals was not incremented"
    //     );

    //     let proposal = new Proposal(await senate.proposals(proposalsLengthBefore));

    //     assert.deepEqual(
    //         proposal,
    //         {
    //             value: value,
    //             target: target,
    //             calldata: data,
    //             description: description,
    //             createdAt: blockTimestamp,
    //             executed: false,
    //             succeeded: false,
    //             totalYea: web3.toBigNumber(0),
    //             totalNay: web3.toBigNumber(0)
    //         },
    //         "The proposal was not created correctly"
    //     );

    //     await expectThrow(
    //         senate.makeProposal(target, data, value, description),
    //         "Only the president can make proposals"
    //     );
    // });

    // it('logs an event on makeProposal', async () => {
    //     let target = accounts[6];
    //     let data = web3.toHex("iwannamakeaproposal");
    //     let value = web3.toBigNumber(web3.toWei(2, 'ether'));
    //     let description = "This is a description";

    //     let proposalsLengthBefore = await senate.proposalsLength();

    //     await expectEvent(
    //         senate.makeProposal.sendTransaction(target, data, value, description, { from: president }),
    //         senate.ProposalMade(),
    //         { index: proposalsLengthBefore }
    //     );
    // });

    it('stores votes on proposals', async () => {
        let target = accounts[6];
        let data = web3.toHex("iwannamakeaproposal");
        let value = web3.toBigNumber(web3.toWei(2, 'ether'));
        let description = "This is a description";

        let proposalIndex = (await transactionListener.listen(
            senate.makeProposal.sendTransaction(target, data, value, description, {from: president}),
            senate.ProposalMade()
        )).index;

        console.log(proposalIndex.valueOf());
    });

    // it('logs an event on vote', async () => {
    //     assert.fail('TODO');
    // });

    // it('executes proposals', async () => {
    //     assert.fail('TODO');
    // });

    // it('logs an event on executeProposal', async () => {
    //     assert.fail('TODO');
    // });

    // it('changes the voting rules', async () => {
    //     assert.fail('TODO');
    // });

    // it('logs an event on changeVotingRules', async () => {
    //     assert.fail('TODO');
    // });


});

class Proposal {
    constructor(proposalArray) {
        this.value = proposalArray[0];
        this.target = proposalArray[1];
        this.calldata = proposalArray[2];
        this.description = proposalArray[3];
        this.createdAt = proposalArray[4];
        this.executed = proposalArray[5];
        this.succeeded = proposalArray[6];
        this.totalYea = proposalArray[7];
        this.totalNay = proposalArray[8];
    }
}