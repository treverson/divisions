pragma solidity ^0.4.21;

import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";

import "./ACasper.sol";
import "./WithdrawalBox.sol";

contract ATreasury is Ownable {
    address public treasurer;
    ACasper public casper;

    function() external payable;

    function totalPoolBalance() external view returns (uint256);

    function transferTreasurership(address _treasurer) public onlyOwner();

    function depositToPool() public payable;
    function withdrawFromPool(address _to, uint256 _amount) external;
    
    function stake(address _to, uint256 _amount, address _validatorAddress, BaseWithdrawalBox withdrawalBox) external;
    function deposit() external payable;

    event TreasurershipTransferred(address indexed previousTreasurer, address indexed newTreasurer);

    event DepositToPool(address indexed from, uint256 amount);
    event WithdrawFromPool(address indexed from, uint256 amount);

    event Deposit(address indexed from, uint256 amount);
    event Stake(address indexed to, address indexed validatorAddress, BaseWithdrawalBox indexed withdrawalBox, uint256 amount);
}

contract Treasury is ATreasury {
    using SafeMath for uint256;

    //Wei that is not in the treasury, but invested in other contracts
    uint256 private weiInvested = 0;

    function Treasury(address _treasurer, ACasper _casper) public {
        transferTreasurership(_treasurer);
        casper = _casper;
    }

    function() external payable {
    }

    function totalPoolBalance() external view returns (uint256) {
        return weiInvested.add(address(this).balance);
    }

    function transferTreasurership(address _treasurer) public onlyOwner {
        require(_treasurer != address(0));

        emit TreasurershipTransferred(treasurer, _treasurer);
        treasurer = _treasurer;
    }

    function deposit() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    modifier onlyTreasurer() {
        require(msg.sender == treasurer);
        _;
    }
}