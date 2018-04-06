pragma solidity ^0.4.21;

import "../../divisions/stake/Treasury.sol";

contract MockTreasury is ATreasury {
    function() external payable {}

    function transferTreasurership(address _treasurer) public onlyOwner {

    }

    function transfer(address _to, uint256 _amount) external {

    }
    function deposit() external payable {

    }

    function stake(uint256 _amount, address _validatorAddress, AWithdrawalBox _withdrawalBox) external {

    }

}