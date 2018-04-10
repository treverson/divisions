pragma solidity ^0.4.21;

import "../../divisions/stake/Treasury.sol";
import "../../divisions/stake/StakeManager.sol";

contract MockStakeManager is AStakeManager {
    function transferValidatorship(address _validator) external onlyOwner() {

    }

    function setTreasury(ATreasury _treasury) external onlyOwner() {

    }

    function getStakeAmount() public view returns (uint256){ 

    }
    function makeStakeDeposit() external{

    }
    
    function setLogoutMessage(AWithdrawalBox _withdrawalBox, bytes _messageRLP, uint256 _validatorIndex, uint256 _epoch) external;
    
    function vote(
        bytes _voteMessage,
        uint256 _validatorIndex,
        bytes32 _targetHash,
        uint256 _targetEpoch,
        uint256 _sourceEpoch
        )
        external 
    {

    }

    function getVoteMessage(uint256 _validatorIndex, uint256 _targetEpoch)
        public
        view
        returns (
            bytes,
            bytes32,
            uint256,
            uint256,
            uint256
        ) 
    {

    }

    function withdrawalBoxesCount() external view returns (uint256) {

    }

}