pragma solidity ^0.4.21;

import "../../divisions/stake/Treasury.sol";
import "../../divisions/stake/ACasper.sol";

contract MockTreasury is ATreasury {
    
    function MockTreasury(address _treasurer, ACasper _casper) public {
        transferTreasurership(_treasurer);
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
    }

}