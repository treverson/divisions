pragma solidity 0.4.24;

import "../token/GovernanceToken.sol";

import "./TokenVault.sol";

contract ASenate {
    struct Proposal {
        uint256 value; // Amount of wei that is to be sent
        address target; // Target address
        bytes32 calldataHash; // Hash of the calldata for this proposal
        bytes32 description; 
        uint256 createdAt; // Creation time

        bool executed; // Whether the proposal was executed

        uint256 totalYea; // The total amount of yea vote
        uint256 totalNay; // The total amount of nay vote
        uint256 totalLockedTokens; // The total amount of tokens that was locked at the time of creation
        Vote[] votes; //Every vote cast on this proposal
        mapping(address => uint256) voteIndexes; // The vote indexes for each voter's address
    }

    struct Vote {
        address voter;
        uint256 weight;
        bool inSupport;
    }
    
    address public president;

    uint256 public debatingPeriod;

    uint256 public constant quorumMultiplier = 10e18;
    uint256 public quorumFractionMultiplied;

    Proposal[] public proposals;

    ATokenVault internal tokenVault_;

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
        bytes32 _calldataHash,
        uint256 _value,
        bytes32 _description
    )
        external;

    function vote(uint256 _index, bool _inSupport) external; 

    function executeProposal(uint256 _index, bytes _calldata) external;

    // Can be called only by executing a proposal
    function changeVotingRules(uint256 _debatingPeriodMs, uint256 _quorum) external;
    function setPresident(address _newPresident) external;

    function proposalPassed(uint256 _index) external view returns (bool passed);
    function proposalDebatingPeriodEnded(uint256 _index) external view returns (bool ended);

    event ProposalMade(uint256 indexed index);
    event Voted(uint256 indexed proposalIndex, uint256 voteIndex, address voter, bool inSupport, uint256 weight);
    event ProposalExecuted(uint256 indexed index);

    event VotingRulesChanged();
    event PresidentSet(address previousPresident, address newPresident);
}

contract Senate is ASenate {
    constructor(
        address _president,
        uint256 _debatingPeriod,
        uint256 _quorumFractionMultiplied,
        ATokenVault _tokenVault
    )
        public 
    {
        president = _president;

        debatingPeriod = _debatingPeriod * 1 seconds;
        quorumFractionMultiplied = _quorumFractionMultiplied;
        tokenVault_ = _tokenVault;
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
        bytes32 _calldataHash,
        uint256 _value,
        bytes32 _description
    )
        external
        onlyPresident
    {
        uint256 index = proposals.length;
        proposals.length++;
        Proposal storage proposal = proposals[index];

        proposal.target = _target;
        proposal.calldataHash = _calldataHash;
        proposal.value = _value;
        proposal.description = _description;
        proposal.createdAt = block.timestamp;

        proposal.totalLockedTokens = tokenVault_.totalLockedLastBlock();
        
        // Push empty as voteIndexes uses index 0 to indicate that
        // an account has not yet voted
        proposal.votes.length++;

        emit ProposalMade(index);
    }

    function vote(uint256 _proposalIndex, bool _inSupport) external {
        Proposal storage proposal = proposals[_proposalIndex];

        require(!proposalDebatingPeriodEnded(proposal), "The debating period has ended");
        require(proposal.voteIndexes[msg.sender] == 0, "That address already voted");

        uint256 amountLocked;
        uint256 lastIncreasedAt;
        (amountLocked, lastIncreasedAt) = tokenVault_.lockers(msg.sender);
        
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

    function executeProposal(uint256 _index, bytes _calldata) external {
        Proposal storage proposal = proposals[_index];
        
        require(keccak256(_calldata) == proposal.calldataHash);
        
        require(proposalDebatingPeriodEnded(proposal), "The debating period has not ended yet");
        require(proposalPassed(proposal), "The proposal has not passed");
        
        require(!proposal.executed, "The proposal was already executed");
        proposal.executed = true;

        // Revert when call fails, so that we can retry with more gas,
        // since we don't know whether there was enough
        require(proposal.target.call.value(proposal.value)(_calldata));
        
        emit ProposalExecuted(_index);
    }
    
    function changeVotingRules(uint256 _debatingPeriod, uint256 _quorumFractionMultiplied)
        external
        onlyByProposalExecution 
    {
        debatingPeriod = _debatingPeriod * 1 seconds;
        quorumFractionMultiplied = _quorumFractionMultiplied;
        
        emit VotingRulesChanged();
    }

    function setPresident(address _newPresident)
        external
        onlyPresidentOrByProposalExecution
    {
        emit PresidentSet(president, _newPresident);
        president = _newPresident;
    }

    function proposalDebatingPeriodEnded(uint256 _index) external view returns (bool ended) {
        return ended = proposalDebatingPeriodEnded(proposals[_index]);
    }

    function proposalDebatingPeriodEnded(Proposal storage proposal) internal view returns (bool ended) {
        uint256 debatingDeadline = proposal.createdAt + debatingPeriod;

        return ended = block.timestamp > debatingDeadline;
    }

    function proposalPassed(uint256 _index) external view returns (bool passed) {
        return passed = proposalPassed(proposals[_index]);
    }

    function proposalPassed(Proposal storage proposal) internal view returns (bool passed) {
        uint256 totalYea = proposal.totalYea;
        uint256 totalNay = proposal.totalNay;
        uint256 totalVotes = totalYea + totalNay;
        
        uint256 voteQuorum = (proposal.totalLockedTokens * quorumFractionMultiplied) / quorumMultiplier;
        passed = totalVotes > voteQuorum;

        return passed = passed && proposal.totalYea > proposal.totalNay;
    }

    modifier onlyPresident() {
        require(
            msg.sender == president,
            "Can only be called by president"
        );
        _;
    }

    modifier onlyByProposalExecution() {
        require(
            msg.sender == address(this),
            "Can only be called by executing a proposal"
        );
        _;
    }

    modifier onlyPresidentOrByProposalExecution() {
        require(
            msg.sender == president || msg.sender == address(this),
            "Can only be called by president or by executing a proposal"
        );
        _;
    }
}