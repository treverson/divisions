pragma solidity 0.4.24;

import "./TokenVault.sol";

import "../util/AddressUtils.sol";

interface IDelegatingSenate {

    function president() external view returns (address);
    function debatingPeriod() external view returns (uint256);
    function quorumMultiplier() external pure returns (uint256);
    function quorumFractionMultiplied() external view returns (uint256);

    function proposalsLength() external view returns (uint256);

    function proposals(uint256 _index)
        external
        view
        returns (
            address executor,
            bytes calldataHash,
            uint256 value,
            bytes32 description,
            uint256 createdAt,
            bool executed,
            uint256 totalYea,
            uint256 totalNay,
            uint256 totalLockedTokens
        );

    function proposalVotesLength(uint256 _proposalIndex)
        external
        view
        returns (uint256);

    function votes(uint256 _proposalIndex, uint256 _voteIndex)
        external
        view
        returns(
            address voter,
            uint256 weight,
            bool inSupport
        );

    function delegate() external view returns (address);

    function makeProposal(
        address _executor,
        bytes32 _calldataHash,
        uint256 _value,
        bytes32 _description
    ) external;

    function vote(uint256 _proposalIndex, bool _inSupport) external;

    function voteIndex(uint256 _proposalIndex, address _voter)
        external
        view
        returns (uint256);


    function executeProposal(uint256 _proposalIndex, bytes _calldata)
        external
        payable;

    function changeVotingRules(uint256 _debatingPeriodMs, uint256 _quorum)
        external;

    function setPresident(address _newPresident) external;

    function debatingPeriodEnded(uint256 _proposalIndex)
        external
        view
        returns (bool);

    function proposalPassed() external view returns (bool);
        
    event ProposalMade(
        uint256 indexed proposalIndex,
        address indexed executor,
        bytes32 indexed calldatahash,
        uint256 value,
        bytes32 description
    );

    event Voted(uint256 indexed proposalIndex, uint256 indexed voteIndex, address indexed voter, bool _inSupport);
    event ProposalExecuted(uint256 indexed proposalIndex);

    event VotingRulesChanged(uint256 debatingPeriodMs, uint256 quorum);
    event PresidentSet(address previousPresident, address newPresident);
}

/* Senate that uses a delegate contract that executes a batch proposal */
contract DelegatingSenate  is IDelegatingSenate {    
    using AddressUtils for address;

    struct Proposal {
        address executor;
        bytes32 calldataHash;
        uint256 value;
        bytes32 description;
        uint256 createdAt;

        bool executed;

        uint256 totalYea;
        uint256 totalNay;
        uint256 totalLockedTokens;
        Vote[] votes;
        mapping(address => uint256) voteIndexes; 
    }

    struct Vote {
        address voter;
        uint256 weight;
        bool inSupport;
    }

    // Fields

    ATokenVault internal tokenVault_;

    address internal delegate_;

    address internal president_;
    uint256 internal debatingPeriod_;
    uint256 internal quorumFractionMultiplied_;

    Proposal[] internal proposals_;

    constructor(
        address _president,
        uint256 _debatingPeriod,
        uint256 _quorumFractionMultiplied,
        ATokenVault _tokenVault
    )
    public
    {
        president_ = _president;
        debatingPeriod_ = _debatingPeriod;
        quorumFractionMultiplied_ = _quorumFractionMultiplied;
        tokenVault_ = _tokenVault;
    }

    // Property getters

    function president() external view returns (address) {
        return president_;
    }

    function debatingPeriod() external view returns (uint256) {
        return debatingPeriod_;
    }

    function quorumMultiplier() external pure returns (uint256) {
        return 10e18;
    }

    function quorumFractionMultiplied() external view returns (uint256) {
        return quorumFractionMultiplied_;
    }

    function delegate() external view returns (address) {
        return delegate_;
    }

    function proposalsLength() external view returns (uint256) {
        return proposals_.length;
    }

    function proposals(uint256 _index)
        external
        view
        returns (
            address executor,
            bytes calldataHash,
            uint256 value,
            bytes32 description,
            uint256 createdAt,
            bool executed,
            uint256 totalYea,
            uint256 totalNay,
            uint256 totalLockedTokens
        );

    function proposalVotesLength(uint256 _proposalIndex)
        external
        view
        returns (uint256) 
    {
        return proposals_[_proposalIndex].votes.length;
    }

    function votes(uint256 _proposalIndex, uint256 _voteIndex)
        external
        view
        returns(
            address voter,
            uint256 weight,
            bool inSupport
        )
    {
        Vote storage vote = proposals_[_voteIndex].votes[_voteIndex];
        return (vote.voter, vote.weight, vote.inSupport);
    }

    // external functions

    function makeProposal(
        address _executor,
        bytes32 _calldataHash,
        uint256 _value,
        bytes32 _description
    ) 
        external 
        onlyPresident
        onlyContracts(_executor)
    {
        uint256 index = proposals_.length;
        proposals_.length++;
        Proposal storage proposal = proposals_[index];

        proposal.executor = _executor;
        proposal.calldataHash = _calldataHash;
        proposal.value = _value;
        proposal.description = _description;
        proposal.createdAt = block.timestamp;

        proposal.totalLockedTokens = tokenVault_.totalLockedLastBlock();
        
        // Push empty Vote as voteIndexes uses index 0 to indicate that
        // an account has not yet voted
        proposal.votes.length++;

        emit ProposalMade(index, _executor, _calldataHash, _value, _description);
    }

    function vote(uint256 _proposalIndex, bool _inSupport) external {
        Proposal storage proposal = proposals_[_proposalIndex];

        require(!debatingPeriodEnded(proposal), "The debating period has ended");
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

        emit Voted(_proposalIndex, voteIndex, msg.sender, _inSupport);
    }

    function voteIndex(uint256 _proposalIndex, address _voter)
        external
        view
        returns (uint256);


    function executeProposal(uint256 _proposalIndex, bytes _calldata)
        external
        payable;

    function changeVotingRules(uint256 _debatingPeriodMs, uint256 _quorum)
        external;

    function setPresident(address _newPresident) external;

    function debatingPeriodEnded(uint256 _proposalIndex)
        external
        view
        returns (bool);

    // internal functions 

    function debatingPeriodEnded(Proposal storage _proposal) internal view returns (bool) {
        //TODO
        return false;
    }

    // modifiers

    modifier onlyContracts(address _addr) {
        require(_addr.isContract(), "The address is not a contract");
        _;
    }

    modifier onlyPresident() {
        require(msg.sender == president_, "Can only be called by president");
        _;
    }

    modifier onlyByProposalExecution() {
        require(msg.sender == address(this), "Can only be called by executing a proposal");
        _;
    }

    modifier onlyPresidentOrByProposalExecution() {
        require(
            msg.sender == president_ || msg.sender == address(this),
            "Can only be called by president or by executing a proposal"
        );
        _;
    }

}