const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");
let TransactionListener = require('../../test-helpers/TransactionListener');
let transactionListener = new TransactionListener();
const timeout = require('../../test-helpers/timeout');
const BigNumber = require('bignumber.js');

// ============ Test Senate ============ //

const Senate = artifacts.require('Senate');
const AddressBook = artifacts.require('AddressBook');

const MockTokenRecipient = artifacts.require('MockTokenRecipient');
const MockTokenVault = artifacts.require('MockTokenVault');

const DEBATING_PERIOD_SECS = 20; 

contract('Senate', async accounts => {
    let senate;
    let addressBook;
    let tokenVault;
    let president = accounts[1];

    before(async () => {
        addressBook = await AddressBook.new(accounts[0]);

        tokenVault = await MockTokenVault.new(addressBook.address);

        await addressBook.registerEntry(
            tokenVault.address
        );

        senate = await Senate.new(
            addressBook.address,
            president,
            DEBATING_PERIOD_SECS);
    });

    after(() => {
        transactionListener.dispose();
    })

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
        await tokenVault.lockTokens(100e18);

        let weight = (await tokenVault.lockers(accounts[0]))[0];

        let target = accounts[6];
        let data = web3.toHex("iwannamakeaproposal");
        let value = web3.toBigNumber(web3.toWei(2, 'ether'));
        let description = "This is a description";

        let proposalIndex = (await transactionListener.listen(
            senate.makeProposal.sendTransaction(target, data, value, description, { from: president }),
            senate.ProposalMade()
        )).index;

        let voteIndex = (await transactionListener.listen(
            senate.vote.sendTransaction(proposalIndex, true),
            senate.Voted()
        )).voteIndex;

        let vote = new Vote(await senate.votes(proposalIndex, voteIndex));

        assert.deepEqual(
            vote,
            {
                voter: accounts[0],
                weight: weight,
                inSupport: true
            },
            "The vote was not stored correctly"
        );

        await expectThrow(
            senate.vote(proposalIndex, true),
            "Cannot vote more than once"
        );

        let lockedTokens = (await tokenVault.lockers(accounts[1]))[0];
        await tokenVault.unlockTokens(lockedTokens, { from: accounts[1] });

        await expectThrow(
            senate.vote(proposalIndex, false, { from: accounts[1] }),
            "Can only vote when more than 1 tokens have been locked"
        );
        
        await timeout.resolve(3000);

        await tokenVault.lockTokens(weight, { from: accounts[1] });

        await expectThrow(
            senate.vote(proposalIndex, true, { from: accounts[1] }),
            "Can only vote when the amount of locked tokens was increased last before the creation of the proposal"
        );
    });

    // it('stores the voter\'s address with the proposal', async () => {
    //     await tokenVault.lockTokens(100e18);

    //     let weight = (await tokenVault.lockers(accounts[0]))[0];

    //     let target = accounts[6];
    //     let data = web3.toHex("iwannamakeaproposal");
    //     let value = web3.toBigNumber(web3.toWei(2, 'ether'));
    //     let description = "This is a description";

    //     let proposalIndex = (await transactionListener.listen(
    //         senate.makeProposal.sendTransaction(target, data, value, description, { from: president }),
    //         senate.ProposalMade()
    //     )).index;

    //     let expectedVoteIndex = (await transactionListener.listen(
    //         senate.vote.sendTransaction(proposalIndex, true),
    //         senate.Voted()
    //     )).voteIndex;

    //     let actualVoteIndex = await senate.voteIndexes(proposalIndex, accounts[0]);

    //     assert.deepEqual(
    //         actualVoteIndex,
    //         expectedVoteIndex,
    //         "The vote index was not correct"
    //     );
    // });

    // it('only allows voting during the debation period', async () => {
    //     await tokenVault.lockTokens(100e18);

    //     let weight = (await tokenVault.lockers(accounts[0]))[0];

    //     let target = accounts[6];
    //     let data = web3.toHex("iwannamakeaproposal");
    //     let value = web3.toBigNumber(web3.toWei(2, 'ether'));
    //     let description = "This is a description";

    //     let proposalIndex = (await transactionListener.listen(
    //         senate.makeProposal.sendTransaction(target, data, value, description, { from: president }),
    //         senate.ProposalMade()
    //     )).index;
        
    //     await timeout.resolve((DEBATING_PERIOD_SECS + 3) * 1000);
        
    //     await expectThrow(
    //         senate.vote(proposalIndex, true),
    //         "Cannot vote after the debating period has ended"
    //     );
    // });

    // it('logs an event on vote', async () => {
    //     await tokenVault.lockTokens(100e18);

    //     let weight = (await tokenVault.lockers(accounts[0]))[0];

    //     let target = accounts[6];
    //     let data = web3.toHex("iwannamakeaproposal");
    //     let value = web3.toBigNumber(web3.toWei(2, 'ether'));
    //     let description = "This is a description";

    //     let proposalIndex = (await transactionListener.listen(
    //         senate.makeProposal.sendTransaction(target, data, value, description, { from: president }),
    //         senate.ProposalMade()
    //     )).index;

    //     await expectEvent(
    //         senate.vote.sendTransaction(proposalIndex, true),
    //         senate.Voted(),
    //         {
    //             proposalIndex: proposalIndex,
    //             voteIndex: '@any',
    //             voter: accounts[0],
    //             inSupport: true,
    //             weight: weight
    //         }
    //     );

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

class Vote {
    constructor(voteArray) {
        this.voter = voteArray[0];
        this.weight = voteArray[1];
        this.inSupport = voteArray[2];
    }
}