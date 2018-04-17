pragma solidity 0.4.21;

import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";

import "./ACasper.sol";
import "./WithdrawalBox.sol";

contract ATreasury is Ownable {
    address public treasurer;
    ACasper public casper;

    uint256 public totalScaledDeposit;
    uint256 public totalLoggedOutDeposit;

    function() external payable;

    function transferTreasurership(address _treasurer) public onlyOwner();

    function transfer(address _to, uint256 _amount) external;
    function deposit() external payable;

    function stake(uint256 _amount, address _validatorAddress, AWithdrawalBox _withdrawalBox) external;
    function onVote(uint256 _scaledDepositBeforeVote, uint256 _scaledDepositAfterVote) external;
    function onLogout(AWithdrawalBox _withdrawalBox) external;

    function sweep(AWithdrawalBox _withdrawalBox) external;

    function getTotalPoolSize() external returns(uint256);

    event TreasurershipTransferred(address indexed previousTreasurer, address indexed newTreasurer);

    event Transfer(address indexed to, uint256 amount);
    event Deposit(address indexed from, uint256 amount);
    event Stake(address indexed validatorAddress, AWithdrawalBox indexed withdrawalBox, uint256 amount);
    event Sweep(AWithdrawalBox withdrawalBox);
}

contract Treasury is ATreasury {
    using SafeMath for uint256;

    function Treasury(ACasper _casper) public {
        casper = _casper;
        totalScaledDeposit = 0;
        totalLoggedOutDeposit = 0;
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
        
        int128 depositScaleFactor = casper.deposit_scale_factor(casper.current_epoch());

        uint256 scaledAmount = _amount / uint256(depositScaleFactor);

        totalScaledDeposit = totalScaledDeposit.add(scaledAmount);

        emit Stake(_validatorAddress, _withdrawalBox, _amount);
    }

   
    function onVote(uint256 _scaledDepositBeforeVote, uint256 _scaledDepositAfterVote) external onlyTreasurer {
        // Update the totalScaledDeposit
    }

    function onLogout(AWithdrawalBox _withdrawalBox) external onlyTreasurer {
        
        uint256 scaledDeposit = _withdrawalBox.scaledDeposit();
        totalScaledDeposit = totalScaledDeposit.sub(scaledDeposit);
        
        int128 currentEpoch = casper.current_epoch();
        _withdrawalBox.setLogoutEpoch(uint256(currentEpoch));

        uint256 depositScaleFactor = uint256(casper.deposit_scale_factor(currentEpoch));
        
        totalLoggedOutDeposit = totalLoggedOutDeposit.add(uint256(scaledDeposit).mul(depositScaleFactor));
    }

    function sweep(AWithdrawalBox _withdrawalBox) external {
        _withdrawalBox.sweep();
        int128 logoutEpoch = int128(_withdrawalBox.logoutEpoch());

        uint256 depositScaleFactor = uint256(casper.deposit_scale_factor(logoutEpoch));

        uint256 scaledDeposit = _withdrawalBox.scaledDeposit();
        totalLoggedOutDeposit = totalLoggedOutDeposit.sub(scaledDeposit.mul(depositScaleFactor));

        emit Sweep(_withdrawalBox);
    }

    function getTotalPoolSize() external returns(uint256) {
        uint256 depositScaleFactor = uint256(casper.deposit_scale_factor(casper.current_epoch()));
        return address(this).balance + totalLoggedOutDeposit + depositScaleFactor * totalScaledDeposit;
    }

    function handleDeposit(address sender, uint256 value) internal {
        emit Deposit(sender, value);
    }

    modifier onlyTreasurer() {
        require(msg.sender == treasurer);
        _;
    }
}