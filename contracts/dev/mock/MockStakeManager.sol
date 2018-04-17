pragma solidity 0.4.21;

import "../../divisions/stake/StakeManager.sol";

import "./MockWithdrawalBox.sol";

contract MockStakeManager is AStakeManager {
    
    function MockStakeManager(ACasper _casper, ATreasury _treasury) public {
        casper = _casper;
        treasury = _treasury;
    }

    function withdrawalBoxesLength() external view returns (uint256 length) {
        return withdrawalBoxes.length;
    }

    function transferValidatorship(address _validator) external onlyOwner() {

    }

    function setTreasury(ATreasury _treasury) external onlyOwner() {

    }

    function getStakeAmount() public view returns (uint256 amount){ 
        return amount =  address(treasury).balance;
    }
    function makeStakeDeposit() external{
        AWithdrawalBox withdrawalBox = new MockWithdrawalBox();
        
        uint256 depositSize = getStakeAmount();

        treasury.stake(depositSize, validator, withdrawalBox);

        withdrawalBoxes.push(withdrawalBox);

        emit WithdrawalBoxDeployed(withdrawalBox);
    }
    
    function setLogoutMessage(AWithdrawalBox _withdrawalBox, bytes _messageRLP, uint256 _validatorIndex, uint256 _epoch) external {
        
    }
    
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

    function logout(
        AWithdrawalBox _withdrawalBox,
        bytes _messageRLP,
        uint256 _validatorIndex,
        uint256 _epoch
    )
        external
    {
    }

}