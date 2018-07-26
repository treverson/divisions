pragma solidity 0.4.24;

import "./TokenVault.sol";

import "../util/AddressUtils.sol";

interface IDelegatingSenate {

    function president() external view returns (address);
    function debatingPeriodBlocks() external view returns (uint256);
    function quorumMultiplier() external pure returns (uint256);
    function quorumFractionMultiplied() external view returns (uint256);
    
    function delegate() external view returns (address);

    function proposalsLength() external view returns (uint256);

    function proposals(uint256 _index)
        external
        view
        returns (
            address executor,
            bytes32 calldataHash,
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

    function changeVotingRules(
        uint256 _debatingPeriodBlocks,
        uint256 _quorumFractionMultiplied
    )
        external;

    function setPresident(address _newPresident) external;

    function debatingPeriodEnded(uint256 _proposalIndex)
        external
        view
        returns (bool);

    function proposalPassed(uint256 _proposalIndex)
        external
        view
        returns (bool);
        
    event ProposalMade(
        uint256 indexed proposalIndex,
        address indexed executor,
        bytes32 indexed calldataHash,
        uint256 value,
        bytes32 description
    );

    event Voted(
        uint256 indexed proposalIndex,
        uint256 indexed voteIndex,
        address indexed voter,
        bool inSupport
    );

    event ProposalExecuted(uint256 indexed proposalIndex);

    event VotingRulesChanged(
        uint256 debatingPeriodMs,
        uint256 quorumFractionMultiplied
    );
    event PresidentSet(address previousPresident, address newPresident);
}

/* Senate that uses a delegate contract that executes a batch proposal */
contract DelegatingSenate is IDelegatingSenate {    
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

    uint256 internal constant quorumMultiplier_ = 1e18;

    ATokenVault internal tokenVault_;

    address internal delegate_;

    address internal president_;
    uint256 internal debatingPeriodBlocks_;
    uint256 internal quorumFractionMultiplied_;

    Proposal[] internal proposals_;

    constructor(
        address _president,
        uint256 _debatingPeriodBlocks,
        uint256 _quorumFractionMultiplied,
        ATokenVault _tokenVault
    )
    public
    {
        president_ = _president;
        debatingPeriodBlocks_ = _debatingPeriodBlocks;
        quorumFractionMultiplied_ = _quorumFractionMultiplied;
        tokenVault_ = _tokenVault;
    }

    // Property getters

    function president() external view returns (address) {
        return president_;
    }

    function debatingPeriodBlocks() external view returns (uint256) {
        return debatingPeriodBlocks_;
    }

    function quorumMultiplier() external pure returns (uint256) {
        return quorumMultiplier_;
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
            bytes32 calldataHash,
            uint256 value,
            bytes32 description,
            uint256 createdAt,
            bool executed,
            uint256 totalYea,
            uint256 totalNay,
            uint256 totalLockedTokens
        ) 
    {
        Proposal storage proposal = proposals_[_index];
        return (
            proposal.executor, 
            proposal.calldataHash,
            proposal.value, 
            proposal.description,
            proposal.createdAt,
            proposal.executed,
            proposal.totalYea,
            proposal.totalNay,
            proposal.totalLockedTokens
        );
    }

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
        Vote storage vote = proposals_[_proposalIndex].votes[_voteIndex];
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
        proposal.createdAt = block.number;

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

        proposal.votes.push(
            Vote ({
                voter: msg.sender,
                weight: amountLocked,
                inSupport: _inSupport
            })
        );
        proposal.voteIndexes[msg.sender] = voteIndex;

        emit Voted(_proposalIndex, voteIndex, msg.sender, _inSupport);
    }

    function voteIndex(uint256 _proposalIndex, address _voter)
        external
        view
        returns (uint256) 
    {
        return proposals_[_proposalIndex].voteIndexes[_voter];
    }

    function executeProposal(uint256 _proposalIndex, bytes _calldata)
        external
        payable 
    {
        assert(delegate_ == address(0));
        Proposal storage proposal = proposals_[_proposalIndex];

        require(
            keccak256(_calldata) == proposal.calldataHash,
            "Calldata is not correct"
        );

        require(
            debatingPeriodEnded(proposal),
            "The debating period has not ended yet"
        );

        require(
            proposalPassed(proposal),
            "The proposal has not passed the vote"
        );

        require(!proposal.executed, "The proposal was already executed");

        // The proposal's executor is the current delegate
        delegate_ = proposal.executor;

        // Revert when call fails, so that we can retry with more gas,
        // since we don't know whether there was enough supplied
        // As the whole transaction gets reverted, proposal.executed
        // will be false again if this call fails
        require(proposal.executor.call.value(proposal.value)(_calldata));

        proposal.executed = true;

        // Reset the delegate to 0
        delegate_ = address(0);
        
        emit ProposalExecuted(_proposalIndex);
    }

    function forwardCall(address _target, bytes calldata)
        external
        payable
        onlyByProposalExecution
    {
        require(_target.call.value(msg.value)(calldata));
    }

    function changeVotingRules(
        uint256 _debatingPeriodBlocks,
        uint256 _quorumFractionMultiplied
    )
        external
        onlyByProposalExecution
    {
        debatingPeriodBlocks_ = _debatingPeriodBlocks;
        quorumFractionMultiplied_ = _quorumFractionMultiplied;

        emit VotingRulesChanged(_debatingPeriodBlocks, _quorumFractionMultiplied);
    }

    function setPresident(address _newPresident)
        external
        onlyPresidentOrByProposalExecution
    {
        emit Calldata(msg.data);
        emit PresidentSet(president_, _newPresident);
        president_ = _newPresident;
    }

    event Calldata(bytes d);

    function debatingPeriodEnded(uint256 _proposalIndex)
        external
        view
        returns (bool)
    {
        return debatingPeriodEnded(proposals_[_proposalIndex]);
    }

    function proposalPassed(uint256 _proposalIndex)
        external
        view
        returns (bool) 
    {
        return proposalPassed(proposals_[_proposalIndex]);
    }

    // internal functions 

    function debatingPeriodEnded(Proposal storage _proposal) internal view returns (bool) {
        uint256 debatingDeadline = _proposal.createdAt + debatingPeriodBlocks_;

        return block.number > debatingDeadline;
    }

    function proposalPassed(Proposal storage _proposal)
        internal
        view
        returns (bool) 
    {
        uint256 totalYea = _proposal.totalYea;
        uint256 totalNay = _proposal.totalNay;
        uint256 totalVotes = totalYea + totalNay;
        
        uint256 voteQuorum = (_proposal.totalLockedTokens * quorumFractionMultiplied_) / quorumMultiplier_;
        
        return totalVotes > voteQuorum && totalYea > totalNay;
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