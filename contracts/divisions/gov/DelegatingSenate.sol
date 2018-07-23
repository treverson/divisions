pragma solidity 0.4.24;

import "../util/AddressUtils.sol";

interface IDelegatingSenate {

    function proposals(uint256 _index)
        external
        view
        returns (address executor); // what else?

    function proposalVotesLength(uint256 _proposalIndex)
        external
        view
        returns (uint256 length);

    function votes(uint256 _proposalIndex, uint256 _voteIndex)
        external
        view
        returns(bool inSupport); // what else?

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
        
    event ProposalMade();
    event Vote();
    event ProposalExecuted(uint256 indexed proposalIndex);

    event VotingRulesChanged(uint256 debatingPeriodMs, uint256 quorum);
    event PresidentSet(address previousPresident, address newPresident);
}

/* Senate that uses a delegate contract that executes a batch proposal */
contract DelegatingSenate  is IDelegatingSenate {

    struct Proposal {
        address executor;
        uint256 target;
    }

    using AddressUtils for address;

    address internal delegate_;

    function delegate() external view returns (address) {
        return delegate_;
    }   

    modifier onlyContracts(address _addr) {
        require(_addr.isContract(), "The address is not a contract");
        _;
    }

}