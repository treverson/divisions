pragma solidity 0.4.24;

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
            uint256 votingEndsAt,
            bool executed,
            uint256 totalYea,
            uint256 totalNay
        );

    function votes(address _voter, uint256 _proposalIndex)
        external
        view
        returns (
             uint256 proposalIndex,
            uint256 weight,
            bool inSupport
        );

    function makeProposal(
        address _executor,
        bytes32 _calldataHash,
        uint256 _value,
        bytes32 _description
    ) external;

    function castVote(uint256 _proposalIndex, bool _inSupport) external;

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

    event VoteCast(
        uint256 indexed proposalIndex,
        address indexed voter,
        bool inSupport,
        uint256 weight
    );

    event ProposalExecuted(uint256 indexed proposalIndex);

    event VotingRulesChanged(
        uint256 debatingPeriodMs,
        uint256 quorumFractionMultiplied
    );
    event PresidentSet(address previousPresident, address newPresident);
}
