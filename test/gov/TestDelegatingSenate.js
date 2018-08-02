const expectThrow = require("../../test-helpers/expectThrow");
const expectEvent = require("../../test-helpers/expectEvent");

const timeout = require('../../test-helpers/timeout');

// ============ Test DelegatingSenate ============ //

const DelegatingSenate = artifacts.require('DelegatingSenate');

const MockTokenVault = artifacts.require('MockTokenVault');
const MockDelegatingSenateSubject = artifacts.require('MockDelegatingSenateSubject');
const MockExecutor = artifacts.require('MockExecutor');
const MockGovernanceToken = artifacts.require('MockGovernanceToken');

const DEBATING_PERIOD_BLOCKS = 30;
const QOURUM_FRACTION = 0.1;
const QUORUM_MULTIPLIER = 1e18;

contract('DelegatingSenate', async accounts => {
    let senate;
    let token;
    let tokenVault;
    let president = accounts[1];

    beforeEach(async () => {
        token = await MockGovernanceToken.new(100e18);
        tokenVault = await MockTokenVault.new(token.address);

        senate = await DelegatingSenate.new(
            president,
            DEBATING_PERIOD_BLOCKS,
            QOURUM_FRACTION * QUORUM_MULTIPLIER,
            tokenVault.address
        );
    });

    it('makes proposals', async () => {
        let executor = await MockExecutor.new();
        let dataHash = web3.toHex("iwannamakeaproposal").padEnd(66, '0');
        let value = web3.toBigNumber(web3.toWei(2, 'ether'));
        let description = web3.toHex("This is a description").padEnd(66, '0');

        let proposalsLengthBefore = await senate.proposalsLength();

        let blockhash = (await senate.makeProposal(
            executor.address,
            dataHash,
            value,
            description,
            {
                from: president
            }
        )).receipt.blockHash;

        let blockNumber = web3.toBigNumber(
            (await web3.eth.getBlock(blockhash))
                .number
        );

        let proposalsLengthAfter = await senate.proposalsLength();

        assert.deepEqual(
            proposalsLengthAfter,
            proposalsLengthBefore.plus(1),
            "The number of proposals was not incremented"
        );

        let proposal = new Proposal(await senate.proposals(proposalsLengthBefore));
        // TODO fix?
        console.error("Warning: ignoring proposal.totalLockedTokens");
        delete proposal.totalLockedTokens;
        assert.deepEqual(
            proposal,
            {
                value: value,
                executor: executor.address,
                calldataHash: dataHash,
                description: description,
                createdAt: blockNumber,
                executed: false,
                totalYea: web3.toBigNumber(0),
                totalNay: web3.toBigNumber(0)
            },
            "The proposal was not created correctly"
        );

        await expectThrow(
            senate.makeProposal(accounts[6], dataHash, value, description, { from: president }),
            "The executor must be a smart contract"
        );

        await expectThrow(
            senate.makeProposal(executor.address, dataHash, value, description),
            "Only the president can make proposals"
        );
    });

    it('logs an event on makeProposal', async () => {
        let executor = await MockExecutor.new();
        let data = web3.toHex("iwannamakeaproposal");
        let value = web3.toBigNumber(web3.toWei(2, 'ether'));
        let description = web3.toHex("This is a description");

        let proposalsLengthBefore = await senate.proposalsLength();

        await expectEvent(
            senate.makeProposal(executor.address, data, value, description, { from: president }),
            senate.ProposalMade,
            {
                proposalIndex: proposalsLengthBefore,
                executor: executor.address,
                calldataHash: data.padEnd(66, '0'),
                value: value,
                description: description.padEnd(66, '0')
            }
        );
    });

    it('stores votes on proposals', async () => {
        await tokenVault.lockTokens(100e18);

        let weight = (await tokenVault.lockers(accounts[0]))[0];
        await timeout.resolve(1000);

        let executor = await MockExecutor.new();
        let data = web3.toHex("iwannamakeaproposal");
        let value = web3.toBigNumber(web3.toWei(2, 'ether'));
        let description = "This is a description";

        let proposalIndex = (await expectEvent(
            senate.makeProposal(executor.address, data, value, description, { from: president }),
            senate.ProposalMade
        )).proposalIndex;

        let voteIndex = (await expectEvent(
            senate.vote(proposalIndex, true),
            senate.Voted
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


    it('stores the voter\'s address with the proposal', async () => {
        await tokenVault.lockTokens(100e18);

        let weight = (await tokenVault.lockers(accounts[0]))[0];
        await timeout.resolve(1000);

        let executor = await MockExecutor.new();
        let data = web3.toHex("iwannamakeaproposal");
        let value = web3.toBigNumber(web3.toWei(2, 'ether'));
        let description = "This is a description";

        let proposalIndex = (await expectEvent(
            senate.makeProposal(executor.address, data, value, description, { from: president }),
            senate.ProposalMade
        )).proposalIndex;

        let expectedVoteIndex = (await expectEvent(
            senate.vote(proposalIndex, true),
            senate.Voted
        )).voteIndex;

        let actualVoteIndex = await senate.voteIndex(proposalIndex, accounts[0]);

        assert.deepEqual(
            actualVoteIndex,
            expectedVoteIndex,
            "The vote index was not correct"
        );
    });

    it('only allows voting during the debating period', async () => {
        await tokenVault.lockTokens(100e18);

        let weight = (await tokenVault.lockers(accounts[0]))[0];
        await timeout.resolve(1000);

        let executor = await MockExecutor.new();
        let data = web3.toHex("iwannamakeaproposal");
        let value = web3.toBigNumber(web3.toWei(2, 'ether'));
        let description = "This is a description";

        let proposalIndex = (await expectEvent(
            senate.makeProposal(executor.address, data, value, description, { from: president }),
            senate.ProposalMade
        )).proposalIndex;

        // Add some blocks to the chain to pass the debating period
        for (let i = 0; i < DEBATING_PERIOD_BLOCKS; i++) {
            await web3.eth.sendTransaction({ from: accounts[i % 2], to: accounts[1 - (i % 2)], value: 1 });
        }

        await expectThrow(
            senate.vote(proposalIndex, true),
            "Cannot vote after the debating period has ended"
        );
    });

    it('logs an event on vote', async () => {
        await tokenVault.lockTokens(100e18);

        let executor = await MockExecutor.new();
        let data = web3.toHex("iwannamakeaproposal");
        let value = web3.toBigNumber(web3.toWei(2, 'ether'));
        let description = "This is a description";

        let proposalIndex = (await expectEvent(
            senate.makeProposal(executor.address, data, value, description, { from: president }),
            senate.ProposalMade
        )).proposalIndex;

        await expectEvent(
            senate.vote(proposalIndex, true),
            senate.Voted,
            {
                proposalIndex: proposalIndex,
                voteIndex: '@any',
                voter: accounts[0],
                inSupport: true
            }
        );

    });

    it('executes batch proposals', async () => {
        let subject1 = await MockDelegatingSenateSubject.new(senate.address);
        let subject2 = await MockDelegatingSenateSubject.new(senate.address);
        let subject3 = await MockDelegatingSenateSubject.new(senate.address);

        await tokenVault.lockTokens(100e18);

        let weight = (await tokenVault.lockers(accounts[0]))[0];
        await timeout.resolve(1000);

        let executor = await MockExecutor.new();


        // executor.execute(subject1.address, subject2.address, subject3.address, "Hello World!");
        let calldata = "0x54d55029000000000000000000000000__subject1__000000000000000000000000__subject2__000000000000000000000000__subject3__0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000c48656c6c6f20576f726c64210000000000000000000000000000000000000000"
            .replace("__subject1__", subject1.address.substr(2))
            .replace("__subject2__", subject2.address.substr(2))
            .replace("__subject3__", subject3.address.substr(2));

        let calldataHash = web3.sha3(calldata, { encoding: 'hex' });

        let value = 0;
        let description = "executor.execute(subject1.address, subject2.address, subject3.address, \"Hello World!\");";

        let proposalIndex = (await expectEvent(
            senate.makeProposal(executor.address, calldataHash, value, description, { from: president }),
            senate.ProposalMade
        )).proposalIndex;

        await senate.vote(proposalIndex, true);

        await expectThrow(
            senate.executeProposal(proposalIndex, calldata),
            "A proposal cannot be executed when the debating period has not ended"
        );

        // Add some blocks to the chain to pass the debating period
        for (let i = 0; i < DEBATING_PERIOD_BLOCKS; i++) {
            await web3.eth.sendTransaction({ from: accounts[i % 2], to: accounts[1 - (i % 2)], value: 1 });
        }

        await expectThrow(
            senate.executeProposal(proposalIndex, "somewronghash"),
            "Cannot execute proposals if the bytecode is not correct"
        );

        await expectEvent(
            senate.executeProposal(proposalIndex, calldata),
            subject1.Message,
            {
                message: "Hello World!"
            }
        );

        let proposal = new Proposal(await senate.proposals(proposalIndex));

        assert(proposal.executed, "The proposal was not set to executed");

        await expectThrow(
            senate.executeProposal(proposalIndex, calldata),
            "A proposal can only be executed once"
        );

        proposalIndex = (await expectEvent(
            senate.makeProposal(executor.address, calldataHash, value, description, { from: president }),
            senate.ProposalMade
        )).proposalIndex;

        // Add some blocks to the chain to pass the debating period
        for (let i = 0; i < DEBATING_PERIOD_BLOCKS; i++) {
            await web3.eth.sendTransaction({ from: accounts[i % 2], to: accounts[1 - (i % 2)], value: 1 });
        }

        await expectThrow(
            senate.executeProposal(proposalIndex, calldata),
            "A proposal can only be executed when it has passed"
        );
    });

    it('executes simple proposals', async () => {
        let subject = await MockDelegatingSenateSubject.new(senate.address);

        await tokenVault.lockTokens(100e18);
        await timeout.resolve(1000);

        // senate.forwardCall(subject.address, subject.logEvent("Hello World!"))
        let calldata = "0x22bee494000000000000000000000000__subject__00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000064f302f1a20000000000000000000000000000000000000000000000000000000000000020000000000000000000000000000000000000000000000000000000000000000c48656c6c6f20576f726c6421000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
            .replace("__subject__", subject.address.substr(2));


        let calldataHash = web3.sha3(calldata, { encoding: 'hex' });

        let value = 0;
        let description = "senate.forwardCall(subject.address, subject.logEvent(\"Hello World!\"))";

        let proposalIndex = (await expectEvent(
            senate.makeProposal(senate.address, calldataHash, value, description, { from: president }),
            senate.ProposalMade
        )).proposalIndex;

        await senate.vote(proposalIndex, true);

        await expectThrow(
            senate.executeProposal(proposalIndex, calldata),
            "A proposal cannot be executed when the debating period has not ended"
        );

        // Add some blocks to the chain to pass the debating period
        for (let i = 0; i < DEBATING_PERIOD_BLOCKS; i++) {
            await web3.eth.sendTransaction({ from: accounts[i % 2], to: accounts[1 - (i % 2)], value: 1 });
        }

        await expectThrow(
            senate.executeProposal(proposalIndex, "somewronghash"),
            "Cannot execute proposals if the bytecode is not correct"
        );

        await expectEvent(
            senate.executeProposal(proposalIndex, calldata),
            subject.Message,
            {
                message: "Hello World!"
            }
        );

        let proposal = new Proposal(await senate.proposals(proposalIndex));

        assert(proposal.executed, "The porposal was not set to executed");

        await expectThrow(
            senate.executeProposal(proposalIndex, calldata),
            "A proposal can only be executed once"
        );

        proposalIndex = (await expectEvent(
            senate.makeProposal(senate.address, calldataHash, value, description, { from: president }),
            senate.ProposalMade
        )).proposalIndex;

        // Add some blocks to the chain to pass the debating period
        for (let i = 0; i < DEBATING_PERIOD_BLOCKS; i++) {
            await web3.eth.sendTransaction({ from: accounts[i % 2], to: accounts[1 - (i % 2)], value: 1 });
        }

        await expectThrow(
            senate.executeProposal(proposalIndex, calldata),
            "A proposal can only be executed when it has passed"
        );
    });

    it('logs an event on executeProposal', async () => {
        let subject1 = await MockDelegatingSenateSubject.new(senate.address);
        let subject2 = await MockDelegatingSenateSubject.new(senate.address);
        let subject3 = await MockDelegatingSenateSubject.new(senate.address);

        await tokenVault.lockTokens(100e18);

        await timeout.resolve(1000);

        let executor = await MockExecutor.new();

        // executor.execute(subject1.address, subject2.address, subject3.address, "Hello World!");
        let calldata = "0x54d55029000000000000000000000000__subject1__000000000000000000000000__subject2__000000000000000000000000__subject3__0000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000000c48656c6c6f20576f726c64210000000000000000000000000000000000000000"
            .replace("__subject1__", subject1.address.substr(2))
            .replace("__subject2__", subject2.address.substr(2))
            .replace("__subject3__", subject3.address.substr(2));
        let calldataHash = web3.sha3(calldata, { encoding: 'hex' });

        let value = 0;
        let description = "subject.setValue(123)";

        let proposalIndex = (await expectEvent(
            senate.makeProposal(executor.address, calldataHash, value, description, { from: president }),
            senate.ProposalMade
        )).proposalIndex;

        await senate.vote(proposalIndex, true);

        // Add some blocks to the chain to pass the debating period
        for (let i = 0; i < DEBATING_PERIOD_BLOCKS; i++) {
            await web3.eth.sendTransaction({ from: accounts[i % 2], to: accounts[1 - (i % 2)], value: 1 });
        }

        await expectEvent(
            senate.executeProposal(proposalIndex, calldata),
            senate.ProposalExecuted,
            { proposalIndex: proposalIndex }
        );

    });

    it('changes the voting rules', async () => {
        let debatingPeriod = web3.toBigNumber(100);
        let quorumFractionMultiplied = web3.toBigNumber(0.1)
            .mul(QUORUM_MULTIPLIER);

        await expectThrow(
            senate.changeVotingRules(debatingPeriod, quorumFractionMultiplied),
            "Can only change the voting rules by executing a proposal"
        );

        await tokenVault.lockTokens(100e18);

        await timeout.resolve(1000);

        let target = senate.address;
        let calldata = "0x158059e20000000000000000000000000000000000000000000000000000000000000064000000000000000000000000000000000000000000000000016345785d8a0000";
        let calldataHash = web3.sha3(calldata, { encoding: 'hex' });

        let value = 0;
        let description = "senate.changeVotingRules(100, 0.1e18);";

        let proposalIndex = (await expectEvent(
            senate.makeProposal(target, calldataHash, value, description, { from: president }),
            senate.ProposalMade
        )).proposalIndex;

        await senate.vote(proposalIndex, true);

        // Add some blocks to the chain to pass the debating period
        for (let i = 0; i < DEBATING_PERIOD_BLOCKS; i++) {
            await web3.eth.sendTransaction({ from: accounts[i % 2], to: accounts[1 - (i % 2)], value: 1 });
        }

        await senate.executeProposal(proposalIndex, calldata);

        let actualDebatingPeriod = await senate.debatingPeriodBlocks();
        let actualQuorumFractionMultiplied = await senate.quorumFractionMultiplied();

        assert.deepEqual(
            actualDebatingPeriod,
            debatingPeriod,
            "The debating period was not updated"
        );

        assert.deepEqual(
            actualQuorumFractionMultiplied,
            quorumFractionMultiplied,
            "The multiplied quorum fraction was not updated"
        );
    });

    it('logs an event on changeVotingRules', async () => {
        let debatingPeriod = web3.toBigNumber(100);
        let quorumFractionMultiplied = web3.toBigNumber(0.1)
            .mul(QUORUM_MULTIPLIER);

        await expectThrow(
            senate.changeVotingRules(debatingPeriod, quorumFractionMultiplied),
            "Can only change the voting rules by executing a proposal"
        );

        await tokenVault.lockTokens(100e18);

        await timeout.resolve(1000);

        let target = senate.address;
        let calldata = "0x158059e200000000000000000000000000000000000000000000000000000000000000640000000000000000000000000000000000000000000000000de0b6b3a7640000";
        let calldataHash = web3.sha3(calldata, { encoding: 'hex' });

        let value = 0;
        let description = "senate.changeVotingRules(100, 0.1e18);";

        let proposalIndex = (await expectEvent(
            senate.makeProposal(target, calldataHash, value, description, { from: president }),
            senate.ProposalMade
        )).proposalIndex;

        await senate.vote(proposalIndex, true);

        // Add some blocks to the chain to pass the debating period
        for (let i = 0; i < DEBATING_PERIOD_BLOCKS; i++) {
            await web3.eth.sendTransaction({ from: accounts[i % 2], to: accounts[1 - (i % 2)], value: 1 });
        }

        await expectEvent(
            senate.executeProposal(proposalIndex, calldata),
            senate.VotingRulesChanged
        );
    });

    it('checks that a proposal has passed', async () => {
        await tokenVault.lockTokens(100e18);
        await tokenVault.lockTokens(100e18, { from: accounts[1] });
        await tokenVault.lockTokens(100e18, { from: accounts[2] });
        await tokenVault.lockTokens(100e18, { from: accounts[3] });
        await tokenVault.lockTokens(1, { from: accounts[4] });
        await tokenVault.lockTokens(1, { from: accounts[5] });
        await tokenVault.lockTokens(1, { from: accounts[6] });
        await tokenVault.lockTokens(1, { from: accounts[7] });

        let executor = await MockExecutor.new();
        let data = web3.toHex("iwannamakeaproposal");
        let value = web3.toBigNumber(web3.toWei(2, 'ether'));
        let description = "This is a description";

        let proposalIndex = (await expectEvent(
            senate.makeProposal(executor.address, data, value, description, { from: president }),
            senate.ProposalMade
        )).proposalIndex;

        assert(!await senate.proposalPassed(proposalIndex),
            "The proposal was not voted on and should not pass"
        );

        // Yea += 1 => 1
        await senate.vote(proposalIndex, true, { from: accounts[4] });
        assert(!await senate.proposalPassed(proposalIndex),
            "Proposal did not get enough votes and should not pass"
        );

        // Nay += 100e18 => 100e18
        await senate.vote(proposalIndex, false, { from: accounts[1] });
        assert(!await senate.proposalPassed(proposalIndex),
            "Proposal got more nay than yea votes and should not pass"
        );

        // Nay += 1 => 100e18 + 1
        await senate.vote(proposalIndex, false, { from: accounts[5] });
        // Yea += 100e18 => 100e18 + 1
        await senate.vote(proposalIndex, true, { from: accounts[2] });
        assert(!await senate.proposalPassed(proposalIndex),
            "Proposal got the same amount of yea and nay votes and should not pass"
        );

        // Yea += 1 => 100e18 + 2
        await senate.vote(proposalIndex, true, { from: accounts[6] });
        assert(await senate.proposalPassed(proposalIndex),
            "Proposal got more yea than nay votes and should pass"
        );

    });

    it('checks that a proposals debating period has ended', async () => {
        let executor = await MockExecutor.new();
        let data = web3.toHex("iwannamakeaproposal");
        let value = web3.toBigNumber(web3.toWei(2, 'ether'));
        let description = "This is a description";

        let proposalIndex = (await expectEvent(
            senate.makeProposal(executor.address, data, value, description, { from: president }),
            senate.ProposalMade
        )).proposalIndex;

        assert(!await senate.debatingPeriodEnded(proposalIndex),
            "The proposal debating period has not ended yet"
        );

        // Add some blocks to the chain to pass the debating period
        for (let i = 0; i < DEBATING_PERIOD_BLOCKS; i++) {
            await web3.eth.sendTransaction({ from: accounts[i % 2], to: accounts[1 - (i % 2)], value: 1 });
        }

        assert(await senate.debatingPeriodEnded(proposalIndex),
            "The proposal debating period has ended"
        );
    });

    it('sets the president', async () => {

        let newPresident = accounts[9];

        await expectThrow(
            senate.setPresident(newPresident),
            "Only the president can set the president directly"
        );

        await tokenVault.lockTokens(100e18);

        let target = senate.address;

        // senate.setPresident(newPresident)
        let calldata = "0xb9424b43000000000000000000000000__newPresident__"
            .replace("__newPresident__", newPresident.substr(2));
        let calldataHash = web3.sha3(calldata, { encoding: 'hex' });

        let value = 0;
        let description = "senate.setPresident(" + newPresident + ");";

        let proposalIndex = (await expectEvent(
            senate.makeProposal(target, calldataHash, value, description, { from: president }),
            senate.ProposalMade
        )).proposalIndex;

        await senate.vote(proposalIndex, true);

        // Add some blocks to the chain to pass the debating period
        for (let i = 0; i < DEBATING_PERIOD_BLOCKS; i++) {
            await web3.eth.sendTransaction({ from: accounts[i % 2], to: accounts[1 - (i % 2)], value: 1 });
        }

        await senate.executeProposal(proposalIndex, calldata);

        assert.equal(
            await senate.president(),
            newPresident,
            "The president was not set"
        );

        await senate.setPresident(accounts[1], { from: newPresident });

        assert.equal(
            await senate.president(),
            president,
            "The president was not set"
        );

    });

    it('logs an event on setPresident', async () => {
        let newPresident = accounts[2];

        await expectEvent(
            senate.setPresident(newPresident, { from: president }),
            senate.PresidentSet,
            {
                previousPresident: president,
                newPresident: newPresident
            }
        );
    });

});

class Proposal {
    constructor(proposalTuple) {
        this.executor = proposalTuple[0];
        this.calldataHash = proposalTuple[1];
        this.value = proposalTuple[2];
        this.description = proposalTuple[3];
        this.createdAt = proposalTuple[4];
        this.votingEndsAt = proposalTuple[5];
        this.executed = proposalTuple[6];
        this.totalYea = proposalTuple[7];
        this.totalNay = proposalTuple[8];
    }
}

class Vote {
    constructor(voteTuple) {
        this.proposalIndex = voteTuple[0];
        this.weight = voteTuple[1];
        this.inSupport = voteTuple[2];
    }
}