pragma solidity ^0.4.21;

import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";

import "./ACasper.sol";
import "./WithdrawalBox.sol";

contract ATreasury is Ownable {
    address public treasurer;
    ACasper public casper;

    function() external payable;

    function transferTreasurership(address _treasurer) public onlyOwner();

    function transfer(address _to, uint256 _amount) external;
    function deposit() external payable;

    function stake(uint256 _amount, address _validatorAddress, AWithdrawalBox _withdrawalBox) external;

    event TreasurershipTransferred(address indexed previousTreasurer, address indexed newTreasurer);

    event Transfer(address indexed to, uint256 amount);
    event Deposit(address indexed from, uint256 amount);
    event Stake(address indexed validatorAddress, AWithdrawalBox indexed withdrawalBox, uint256 amount);
}

contract Treasury is ATreasury {
    using SafeMath for uint256;

    function Treasury(address _treasurer, ACasper _casper) public {
        transferTreasurership(_treasurer);
        casper = _casper;
    }

    function() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function transferTreasurership(address _treasurer) public onlyOwner {
        require(_treasurer != address(0));

        emit TreasurershipTransferred(treasurer, _treasurer);
        treasurer = _treasurer;
    }

    function transfer(address _to, uint256 _amount) external onlyTreasurer {
        _to.transfer(_amount);
        emit Transfer(_to, _amount);
    }

    function deposit() external payable {
        handleDeposit(msg.sender, msg.value);
    }

    function stake(uint256 _amount, address _validatorAddress, AWithdrawalBox _withdrawalBox) external onlyTreasurer {
        casper.deposit.value(_amount)(_validatorAddress, _withdrawalBox);
        emit Stake(_validatorAddress, _withdrawalBox, _amount);
    }

    function handleDeposit(address sender, uint256 value) internal {
        emit Deposit(sender, value);
    }

    modifier onlyTreasurer() {
        require(msg.sender == treasurer);
        _;
    }
}