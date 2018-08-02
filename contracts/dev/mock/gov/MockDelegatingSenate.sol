pragma solidity 0.4.24;

import "../../../divisions/gov/IDelegatingSenate.sol";

contract MockDelegatingSenate is IDelegatingSenate {

    address internal delegate_;

    function setDelegate(address _delegate) external {
        delegate_ = _delegate;
    }

    function president() external view returns (address) {
        return address(0);
    }
    function debatingPeriodBlocks() external view returns (uint256) {
        return 0;
    }
    function quorumMultiplier() external pure returns (uint256) {
        return 0;
    }
    function quorumFractionMultiplied() external view returns (uint256) {
        return 0;
    }
    
    function delegate() external view returns (address) {
        return delegate_;
    }

    function proposalsLength() external view returns (uint256) {
        return 0;
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
        return (address(0), 0, 0, 0, 0, 0, false, 0, 0);
    }

    function makeProposal(
        address _executor,
        bytes32 _calldataHash,
        uint256 _value,
        bytes32 _description
    ) external {
    }

    function castVote(uint256 _proposalIndex, bool _inSupport) external {

    }

    function executeProposal(uint256 _proposalIndex, bytes _calldata)
        external
        payable
        {
        }

    function changeVotingRules(
        uint256 _debatingPeriodBlocks,
        uint256 _quorumFractionMultiplied
    )
        external
    {
    }

    function setPresident(address _newPresident) external{
    }

    function debatingPeriodEnded(uint256 _proposalIndex)
        external
        view
        returns (bool)
    {
        return false;
    }

    function proposalPassed(uint256 _proposalIndex)
        external
        view
        returns (bool)
    {
        return false;
    }
}