const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");
let TransactionListener = require('../../test-helpers/TransactionListener');
let transactionListener = new TransactionListener();
const timeout = require('../../test-helpers/timeout');

// ============ Test Senate ============ //

const Senate = artifacts.require('Senate');

const MockAddressBook = artifacts.require('MockAddressBook');
const MockTokenRecipient = artifacts.require('MockTokenRecipient');
const MockTokenVault = artifacts.require('MockTokenVault');

const DEBATING_PERIOD_SECS = 2;
const QOURUM_FRACTION = 0.5;
const QUORUM_MULTIPLIER = 10e18;

contract('Senate', async accounts => {
    let senate;
    let addressBook;
    let tokenVault;
    let president = accounts[1];

    before(async () => {
        addressBook = await MockAddressBook.new(accounts[0]);
    });

    beforeEach(async () => {
        senate = await Senate.new(
            addressBook.address,
            president,
            DEBATING_PERIOD_SECS,
            QOURUM_FRACTION * QUORUM_MULTIPLIER
        );

        tokenVault = await MockTokenVault.new(addressBook.address);

        await addressBook.registerEntry(
            tokenVault.address
        );
    });

    after(() => {
        transactionListener.dispose();
    })

    // it('makes proposals', async () => {
    //     let target = accounts[6];
    //     let dataHash = web3.toHex("iwannamakeaproposal").padEnd(66, '0');
    //     let value = web3.toBigNumber(web3.toWei(2, 'ether'));
    //     let description = web3.toHex("This is a description").padEnd(66, '0');

    //     let proposalsLengthBefore = await senate.proposalsLength();

    //     let blockhash = (await senate.makeProposal(target, dataHash, value, description, { from: president })).receipt.blockHash;
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
    //             calldataHash: dataHash,
    //             description: description,
    //             createdAt: blockTimestamp,
    //             executed: false,
    //             totalYea: web3.toBigNumber(0),
    //             totalNay: web3.toBigNumber(0)
    //         },
    //         "The proposal was not created correctly"
    //     );

    //     await expectThrow(
    //         senate.makeProposal(target, dataHash, value, description),
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

    // it('stores votes on proposals', async () => {
    //     await tokenVault.lockTokens(100e18);

    //     let weight = (await tokenVault.lockers(accounts[0]))[0];
    //     await timeout.resolve(1000);

    //     let target = accounts[6];
    //     let data = web3.toHex("iwannamakeaproposal");
    //     let value = web3.toBigNumber(web3.toWei(2, 'ether'));
    //     let description = "This is a description";

    //     let proposalIndex = (await transactionListener.listen(
    //         senate.makeProposal.sendTransaction(target, data, value, description, { from: president }),
    //         senate.ProposalMade()
    //     )).index;

    //     let voteIndex = (await transactionListener.listen(
    //         senate.vote.sendTransaction(proposalIndex, true),
    //         senate.Voted()
    //     )).voteIndex;

    //     let vote = new Vote(await senate.votes(proposalIndex, voteIndex));

    //     assert.deepEqual(
    //         vote,
    //         {
    //             voter: accounts[0],
    //             weight: weight,
    //             inSupport: true
    //         },
    //         "The vote was not stored correctly"
    //     );

    //     await expectThrow(
    //         senate.vote(proposalIndex, true),
    //         "Cannot vote more than once"
    //     );

    //     let lockedTokens = (await tokenVault.lockers(accounts[1]))[0];

    //     await tokenVault.unlockTokens(lockedTokens, { from: accounts[1] });

    //     await expectThrow(
    //         senate.vote(proposalIndex, false, { from: accounts[1] }),
    //         "Can only vote when more than 1 tokens have been locked"
    //     );

    //     await timeout.resolve(3000);

    //     await tokenVault.lockTokens(weight, { from: accounts[1] });

    //     await expectThrow(
    //         senate.vote(proposalIndex, true, { from: accounts[1] }),
    //         "Can only vote when the amount of locked tokens was increased last before the creation of the proposal"
    //     );


    // });


    // it('stores the voter\'s address with the proposal', async () => {
    //     await tokenVault.lockTokens(100e18);

    //     let weight = (await tokenVault.lockers(accounts[0]))[0];
    //     await timeout.resolve(1000);

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

    // it('only allows voting during the debating period', async () => {
    //     await tokenVault.lockTokens(100e18);

    //     let weight = (await tokenVault.lockers(accounts[0]))[0];
    //     await timeout.resolve(1000);

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
    //     await timeout.resolve(1000);

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
    //     await tokenVault.lockTokens(100e18);

    //     let weight = (await tokenVault.lockers(accounts[0]))[0];
    //     await timeout.resolve(1000);

    //     let target = addressBook.address;
    //     let calldata = "0xd61c205c656e7472790000000000000000000000000000000000000000000000000000000000000000000000000000006330a553fc93768f612722bb8c2ec78ac90b3bbc";
    //     let calldataHash = web3.sha3(calldata, {encoding: 'hex'});

    //     let value = 0;
    //     let description = "addressBook.setEntry(\"entry\", " + accounts[8] + ");";

    //     let proposalIndex = (await transactionListener.listen(
    //         senate.makeProposal.sendTransaction(target, calldataHash, value, description, { from: president }),
    //         senate.ProposalMade()
    //     )).index;

    //     await senate.vote(proposalIndex, true);

    //     await expectThrow(
    //         senate.executeProposal(proposalIndex, calldata),
    //         "A proposal cannot be executed when the debating period has not ended"
    //     );

    //     await timeout.resolve((DEBATING_PERIOD_SECS + 2) * 1000);


    //     await expectThrow(
    //         senate.executeProposal(proposalIndex, "somewronghash"),
    //         "Cannot execute proposals if the bytecode is not correct"
    //     );

    //     await expectEvent(
    //         senate.executeProposal.sendTransaction(proposalIndex, calldata),
    //         addressBook.EntrySet(),
    //         {
    //             identifier: '@any',
    //             entry: accounts[8]
    //         }
    //     );

    //     let proposal = new Proposal(await senate.proposals(proposalIndex));

    //     assert(proposal.executed, "The porposal was not set to executed");

    //     await expectThrow(
    //         senate.executeProposal(proposalIndex, calldata),
    //         "A proposal can only be executed once"
    //     );

    //     proposalIndex = (await transactionListener.listen(
    //         senate.makeProposal.sendTransaction(target, calldataHash, value, description, { from: president }),
    //         senate.ProposalMade()
    //     )).index;

    //     await timeout.resolve((DEBATING_PERIOD_SECS + 2) * 1000);

    //     await expectThrow(
    //         senate.executeProposal(proposalIndex, calldata),
    //         "A proposal can only be executed when it has passed"
    //     );
    // });

    // it('logs an event on executeProposal', async () => {
    //     await tokenVault.lockTokens(100e18);

    //     let weight = (await tokenVault.lockers(accounts[0]))[0];
    //     await timeout.resolve(1000);

    //     let target = addressBook.address;
    //     let calldata = "0xd61c205c656e7472790000000000000000000000000000000000000000000000000000000000000000000000000000006330a553fc93768f612722bb8c2ec78ac90b3bbc";
    //     let calldataHash = web3.sha3(calldata, { encoding: 'hex' });

    //     let value = 0;
    //     let description = "addressBook.setEntry(\"entry\", " + accounts[8] + ");";

    //     let proposalIndex = (await transactionListener.listen(
    //         senate.makeProposal.sendTransaction(target, calldataHash, value, description, { from: president }),
    //         senate.ProposalMade()
    //     )).index;

    //     await senate.vote(proposalIndex, true);

    //     await timeout.resolve((DEBATING_PERIOD_SECS + 2) * 1000);

    //     await expectEvent(
    //         senate.executeProposal.sendTransaction(proposalIndex, calldata),
    //         senate.ProposalExecuted(),
    //         { index: proposalIndex }
    //     );

    // });

    // it('changes the voting rules', async () => {
    //     let debatingPeriod = web3.toBigNumber(100);
    //     let quorumFractionMultiplied = web3.toBigNumber(0.1)
    //         .mul(QUORUM_MULTIPLIER);

    //     await expectThrow(
    //         senate.changeVotingRules(debatingPeriod, quorumFractionMultiplied),
    //         "Can only change the voting rules by executing a proposal"
    //     );
        
    //     await tokenVault.lockTokens(100e18);
        
    //     let weight = (await tokenVault.lockers(accounts[0]))[0];
    //     await timeout.resolve(1000);
        
    //     let target = senate.address;
    //     let calldata = "0x158059e200000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000de0b6b3a7640000";
    //     let calldataHash = web3.sha3(calldata, { encoding: 'hex' });
        
    //     let value = 0;
    //     let description = "senate.changeVotingRules(100, 0.1e18);";
        
    //     let proposalIndex = (await transactionListener.listen(
    //         senate.makeProposal.sendTransaction(target, calldataHash, value, description, { from: president }),
    //         senate.ProposalMade()
    //     )).index;
        
    //     await senate.vote(proposalIndex, true);
        
    //     await timeout.resolve((DEBATING_PERIOD_SECS + 2) * 1000);
        
    //     await senate.executeProposal(proposalIndex, calldata);
        
    //     let actualDebatingPeriod = await senate.debatingPeriod();
    //     let actualQuorumFractionMultiplied = await senate.quorumFractionMultiplied();
        
    //     assert.deepEqual(
    //         actualDebatingPeriod,
    //         debatingPeriod,
    //         "The debating period was not updated"
    //     );

    //     assert.deepEqual(
    //         actualQuorumFractionMultiplied,
    //         quorumFractionMultiplied,
    //         "The multiplied quorum fraction was not updated"
    //     );
    // });

    it('logs an event on changeVotingRules', async () => {
        let debatingPeriod = web3.toBigNumber(100);
        let quorumFractionMultiplied = web3.toBigNumber(0.1)
            .mul(QUORUM_MULTIPLIER);

        await expectThrow(
            senate.changeVotingRules(debatingPeriod, quorumFractionMultiplied),
            "Can only change the voting rules by executing a proposal"
        );
        
        await tokenVault.lockTokens(100e18);
        
        let weight = (await tokenVault.lockers(accounts[0]))[0];
        await timeout.resolve(1000);
        
        let target = senate.address;
        let calldata = "0x158059e200000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000de0b6b3a7640000";
        let calldataHash = web3.sha3(calldata, { encoding: 'hex' });
        
        let value = 0;
        let description = "senate.changeVotingRules(100, 0.1e18);";
        
        let proposalIndex = (await transactionListener.listen(
            senate.makeProposal.sendTransaction(target, calldataHash, value, description, { from: president }),
            senate.ProposalMade()
        )).index;
        
        await senate.vote(proposalIndex, true);
        
        await timeout.resolve((DEBATING_PERIOD_SECS + 2) * 1000);
        
        await expectEvent(
            senate.executeProposal.sendTransaction(proposalIndex, calldata),
            senate.VotingRulesChanged()
        );
    });

    // it('checks that a proposal has passed', async () => {

    // });

    // it('checks that a proposals debating period has ended', async () => {

    // });

});

class Proposal {
    constructor(proposalArray) {
        this.value = proposalArray[0];
        this.target = proposalArray[1];
        this.calldataHash = proposalArray[2];
        this.description = proposalArray[3];
        this.createdAt = proposalArray[4];
        this.executed = proposalArray[5];
        this.totalYea = proposalArray[6];
        this.totalNay = proposalArray[7];
    }
}

class Vote {
    constructor(voteArray) {
        this.voter = voteArray[0];
        this.weight = voteArray[1];
        this.inSupport = voteArray[2];
    }
}