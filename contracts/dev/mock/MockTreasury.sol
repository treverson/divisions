pragma solidity 0.4.21;

import "../../divisions/stake/Treasury.sol";
import "../../divisions/stake/ACasper.sol";

contract MockTreasury is ATreasury {
    
    function MockTreasury(ACasper _casper) public {
        casper = _casper;
    }

    function() external payable {}

    function transferTreasurership(address _treasurer) public onlyOwner {
        treasurer = _treasurer;
    }

    function transfer(address _to, uint256 _amount) external {
        _to.transfer(_amount);
    }
    function deposit() external payable {
    }

    function stake(uint256 _amount, address _validatorAddress, AWithdrawalBox _withdrawalBox) external {
        emit StakeCalled(_amount, _validatorAddress, _withdrawalBox);
    }

    function onVote(uint256 _scaledDepositBeforeVote, uint256 _scaledDepositAfterVote) external {
        emit OnVoteCalled(_scaledDepositBeforeVote, _scaledDepositAfterVote);
    }

    function onLogout(AWithdrawalBox _withdrawalBox) external {
        emit OnLogoutCalled(_withdrawalBox);
    }

    function sweep(AWithdrawalBox _withdrawalBox) external {
        emit SweepCalled(_withdrawalBox);
    }

    event StakeCalled(uint256 amount, address indexed validatorAddress, AWithdrawalBox indexed withdrawalBox);
    event OnVoteCalled(uint256 scaledDepositBeforeVote, uint256 scaledDepositAfterVote);
    event OnLogoutCalled(AWithdrawalBox withdrawalBox);
    event SweepCalled(AWithdrawalBox withdrawalBox);
}