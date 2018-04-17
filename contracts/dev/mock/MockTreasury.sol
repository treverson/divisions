pragma solidity 0.4.21;

import "../../divisions/stake/Treasury.sol";

contract MockTreasury is ATreasury {
    
    function MockTreasury(ACasper _casper) public {
        casper = _casper;
    }

    function() external payable {}

    function setStakeManager(AStakeManager _stakeManager) public onlyOwner {
        stakeManager = _stakeManager;
    }

    function transfer(address _to, uint256 _amount) external {
        _to.transfer(_amount);
    }
    function deposit() external payable {
    }

    function stake(uint256 _amount, address _validatorAddress, AWithdrawalBox _withdrawalBox) external {
        emit StakeCalled(_amount, _validatorAddress, _withdrawalBox);
    }

    function onLogout(AWithdrawalBox _withdrawalBox) external {
        emit OnLogoutCalled(_withdrawalBox);
    }

    function sweep(AWithdrawalBox _withdrawalBox) external {
        emit SweepCalled(_withdrawalBox);
    }

    function getTotalPoolSize() external view returns(uint256 size) {
        return size = address(this).balance;
    }

    event StakeCalled(uint256 amount, address indexed validatorAddress, AWithdrawalBox indexed withdrawalBox);
    event OnLogoutCalled(AWithdrawalBox withdrawalBox);
    event SweepCalled(AWithdrawalBox withdrawalBox);
}