pragma solidity 0.4.24;

import "./IDelegatingSenate.sol";
import "./TokenVault.sol";

import "../util/AddressUtils.sol";
import "../token/ITokenRecipient.sol";
import "../token/CallingToken.sol";

import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/* Senate that uses a delegate contract that executes a batch proposal */
contract DelegatingSenate is IDelegatingSenate {    
    using SafeMath for uint256;
    using AddressUtils for address;

    struct Proposal {
        address executor;
        bytes32 calldataHash;
        uint256 value;
        bytes32 description;
        uint256 createdAt;
        uint256 votingEndsAt;

        bool executed;

        uint256 totalYea;
        uint256 totalNay;
    }

    struct Vote {
        uint256 proposalIndex;
        uint256 weight;
        bool inSupport;
    }

    // Fields

    uint256 internal constant quorumMultiplier_ = 1e18;

    ITokenVault internal tokenVault_;

    address internal delegate_;

    address internal president_;
    uint256 internal debatingPeriodBlocks_;
    uint256 internal quorumFractionMultiplied_;

    Proposal[] internal proposals_;

    mapping(address => mapping(uint256 => Vote)) votes;

    constructor(
        address _president,
        uint256 _debatingPeriodBlocks,
        uint256 _quorumFractionMultiplied,
        ITokenVault _tokenVault
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
            uint256 votingEndsAt,
            bool executed,
            uint256 totalYea,
            uint256 totalNay
        ) 
    {
        Proposal storage proposal = proposals_[_index];
        return (
            proposal.executor, 
            proposal.calldataHash,
            proposal.value, 
            proposal.description,
            proposal.createdAt,
            proposal.votingEndsAt,
            proposal.executed,
            proposal.totalYea,
            proposal.totalNay
        );
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
        proposal.votingEndsAt = block.number + debatingPeriodBlocks_;

        emit ProposalMade(index, _executor, _calldataHash, _value, _description);
    }
   
    function castVote(uint256 _proposalIndex, bool _inSupport) external {
        Proposal storage proposal = proposals_[_proposalIndex];
        CallingToken token = tokenVault_.token();

        uint256 lockedAmount;
        uint256 currentUnlockAtBlock;
        (lockedAmount, currentUnlockAtBlock) = tokenVault_.lockers(msg.sender);
        uint256 allowance = token.allowance(msg.sender, address(this));
        
        uint256 weight = allowance.add(lockedAmount);

        require(weight > 0, "Cannot vote with 0 weight");
        require(!debatingPeriodEnded(proposal), "The debating period has ended");

        Vote storage vote = votes[msg.sender][_proposalIndex];

        require(vote.weight == 0, "That address already voted");

        if(_inSupport)
            proposal.totalYea += weight;
        else
            proposal.totalNay += weight;

        // Tokens can be unlocked after the last debation period has ended
        uint256 unlockAtBlock = Math.max256(currentUnlockAtBlock, proposal.votingEndsAt);

        // Lock the allowedTokens
        tokenVault_.lockTokens(msg.sender, allowance, unlockAtBlock);

        // Register the vote
        vote.proposalIndex = _proposalIndex;
        vote.weight = weight;
        vote.inSupport = _inSupport;

        emit VoteCast(_proposalIndex, msg.sender, _inSupport, weight);
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
        emit PresidentSet(president_, _newPresident);
        president_ = _newPresident;
    }

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
        return block.number > _proposal.votingEndsAt;
    }

    function proposalPassed(Proposal storage _proposal)
        internal
        view
        returns (bool) 
    {
        uint256 totalYea = _proposal.totalYea;
        uint256 totalNay = _proposal.totalNay;
        uint256 totalVotes = totalYea + totalNay;
        
        uint256 voteQuorum = (tokenVault_.token().totalSupply() * quorumFractionMultiplied_) / quorumMultiplier_;
        
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