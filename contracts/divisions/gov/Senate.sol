pragma solidity 0.4.23;

import "../token/GovernanceToken.sol";

import "./AddressBook.sol";
import "./TokenVault.sol";

contract ASenate {
    struct Proposal {
        uint256 value;
        address target;
        bytes calldata;
        string description;
        uint256 createdAt;

        bool executed;
        bool succeeded;
        
        uint256 totalYea;
        uint256 totalNay;
        Vote[] votes;
        mapping(address => uint256) voteIndexes;
    }

    struct Vote {
        address voter;
        uint256 weight;
        bool inSupport;
    }
    
    AAddressBook addressBook;
    address public president;

    uint256 public debatingPeriodMs;
    Proposal[] public proposals;

    function proposalsLength() external view returns (uint256 length);

    function proposalVotesLength(uint256 _index) external view returns(uint256 length);

    function votes(uint256 _proposalIndex, uint256 _voteIndex) 
        external
        view
        returns (
            address voter,
            uint256 weight,
            bool inSupport
        );

    function voteIndexes(uint256 _proposalIndex, address _voter)
        external
        view
        returns
        (uint256 voteIndex);

    // Used by the president to create a new proposal
    function makeProposal(
        address _target,
        bytes _calldata,
        uint256 _value,
        string _description
    )
        external;

    function vote(uint256 _index, bool _inSupport) external; 

    function executeProposal(uint256 _index) external;

    // Can be called only by executing a proposal
    function changeVotingRules(uint256 _debatingPeriodMs) external;

    event ProposalMade(uint256 index);
    event Voted(uint256 indexed proposalIndex, uint256 voteIndex, address voter, bool inSupport, uint256 weight);
    event ProposalExecuted(uint256 indexed index, bool success);

    event VotingRulesChanged();
}

contract Senate is ASenate {
    constructor(
        AAddressBook _addressBook,
        address _president,
        uint256 _debatingPeriodMs
    )
        public 
    {
        president = _president;
        addressBook = _addressBook;
        debatingPeriodMs = _debatingPeriodMs;
    }

    function proposalsLength() external view returns (uint256 length) {
        return length = proposals.length;
    }

    function proposalVotesLength(uint256 _index) external view returns(uint256 length) {
        return length = proposals[_index].votes.length;
    }

    function votes(uint256 _proposalIndex, uint256 _voteIndex) 
        external
        view
        returns (
            address voter,
            uint256 weight,
            bool inSupport
    ) {
        Vote storage vote = proposals[_proposalIndex].votes[_voteIndex];
        return (voter = vote.voter, weight = vote.weight, inSupport = vote.inSupport);
    }

    function voteIndexes(uint256 _proposalIndex, address _voter)
        external
        view
        returns
        (uint256 voteIndex) 
    {
        return voteIndex = proposals[_proposalIndex].voteIndexes[_voter];
    }

    function makeProposal(
        address _target,
        bytes _calldata,
        uint256 _value,
        string _description
    )
        external
        onlyPresident
    {
        uint256 index = proposals.length;
        proposals.length++;
        Proposal storage proposal = proposals[index];

        proposal.target = _target;
        proposal.calldata = _calldata;
        proposal.value = _value;
        proposal.description = _description;
        proposal.createdAt = block.timestamp;

        // Push empty as voteIndexes uses index 0 to indicate that
        // an account has not yet voted
        proposal.votes.length++;

        emit ProposalMade(index);
    }

    function vote(uint256 _proposalIndex, bool _inSupport) external {
        Proposal storage proposal = proposals[_proposalIndex];

        require(!debatingPeriodEnded(proposal), "The debating period has ended");
        require(proposal.voteIndexes[msg.sender] == 0, "That address already voted");

        uint256 amountLocked;
        uint256 lastIncreasedAt;
        (amountLocked, lastIncreasedAt) = getTokenVault().lockers(msg.sender);
        
        require(amountLocked > 0, "Can only vote when more that 0 GOV is locked");
        require(lastIncreasedAt < proposal.createdAt, "Can only vote with GOV that is locked before the proposal was created");

        uint256 voteIndex = proposal.votes.length;

        if(_inSupport)
            proposal.totalYea += amountLocked;
        else
            proposal.totalNay += amountLocked;

        proposal.votes.push(Vote ({
            voter: msg.sender,
            weight: amountLocked,
            inSupport: _inSupport
        }));
        proposal.voteIndexes[msg.sender] = voteIndex;

        emit Voted(_proposalIndex, voteIndex, msg.sender, _inSupport, amountLocked);
    }

    function executeProposal(uint256 _index) external {
        Proposal storage proposal = proposals[_index];
        
        require(debatingPeriodEnded(proposal), "The debating period has not ended yet");
        require(proposalPassed(proposal), "The proposal has not passed");
        
        require(!proposal.executed, "The proposal was already executed");
        proposal.executed = true;
        bool success = proposal.target.call.value(proposal.value)(proposal.calldata);
        proposal.succeeded = success;
        
        emit ProposalExecuted(_index, success);
    }
    
    function changeVotingRules(uint256 _debatingPeriodMs) external {
        require(msg.sender == address(this), "Can only be called by executing a proposal");
        
        debatingPeriodMs = _debatingPeriodMs;
    }


    function getTokenVault() internal view returns (ATokenVault tokenVault) {
        return tokenVault = ATokenVault(addressBook.index(addressBook.getEntryIdentifier("TokenVault")));
    }

    function debatingPeriodEnded(Proposal storage proposal) internal view returns (bool ended) {
        uint256 debationDeadline = proposal.createdAt + debatingPeriodMs;

        return ended = block.timestamp > debationDeadline;
    }

    function proposalPassed(Proposal storage proposal) internal view returns (bool passed) {
        //TODO define passed in another way
        return passed = proposal.totalYea > proposal.totalNay;
    }

    modifier onlyPresident() {
        require(msg.sender == president, "Can only be called by president");
        _;
    }
}