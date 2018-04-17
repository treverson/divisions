pragma solidity 0.4.21;

import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";

import "./ACasper.sol";
import "./StakeManager.sol";
import "./WithdrawalBox.sol";

contract ATreasury is Ownable {
    AStakeManager public stakeManager;
    ACasper public casper;

    uint256 public totalLoggedOutDeposit;

    function() external payable;

    function setStakeManager(AStakeManager _stakeManager) public onlyOwner();

    function transfer(address _to, uint256 _amount) external;
    function deposit() external payable;

    function stake(uint256 _amount, address _validatorAddress, AWithdrawalBox _withdrawalBox) external;
    
    function onLogout(AWithdrawalBox _withdrawalBox) external;

    function sweep(AWithdrawalBox _withdrawalBox) external;

    function getTotalPoolSize() external view returns(uint256 size);

    event StakeManagerSet(AStakeManager indexed previousStakeManager, AStakeManager indexed newStakeManager);

    event Transfer(address indexed to, uint256 amount);
    event Deposit(address indexed from, uint256 amount);
    event Stake(address indexed validatorAddress, AWithdrawalBox indexed withdrawalBox, uint256 amount);
    event Sweep(AWithdrawalBox withdrawalBox);
}

contract Treasury is ATreasury {
    using SafeMath for uint256;

    function Treasury(ACasper _casper) public {
        casper = _casper;
        totalLoggedOutDeposit = 0;
    }

    function() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function setStakeManager(AStakeManager _stakeManager) public onlyOwner {
        require(_stakeManager != address(0));

        emit StakeManagerSet(stakeManager, _stakeManager);
        stakeManager = _stakeManager;
    }

    function transfer(address _to, uint256 _amount) external onlyStakeManager {
        _to.transfer(_amount);
        emit Transfer(_to, _amount);
    }

    function deposit() external payable {
        handleDeposit(msg.sender, msg.value);
    }

    function stake(uint256 _amount, address _validatorAddress, AWithdrawalBox _withdrawalBox) external onlyStakeManager {
        casper.deposit.value(_amount)(_validatorAddress, _withdrawalBox);
        
        emit Stake(_validatorAddress, _withdrawalBox, _amount);
    }

    function onLogout(AWithdrawalBox _withdrawalBox) external onlyStakeManager {
        int128 validatorIndex = casper.validator_indexes(address(_withdrawalBox));
        int128 scaledDeposit;
        (scaledDeposit, , , ,) = casper.validators(validatorIndex);
        
        int128 currentEpoch = casper.current_epoch();
        _withdrawalBox.setLogoutEpoch(uint256(currentEpoch));

        uint256 depositScaleFactor = uint256(casper.deposit_scale_factor(currentEpoch));
        
        totalLoggedOutDeposit = totalLoggedOutDeposit.add(uint256(scaledDeposit).mul(depositScaleFactor));
    }

    function sweep(AWithdrawalBox _withdrawalBox) external {
        _withdrawalBox.sweep();

        int128 validatorIndex = casper.validator_indexes(address(_withdrawalBox));
        int128 scaledDeposit;
        (scaledDeposit, , , ,) = casper.validators(validatorIndex);

        int128 logoutEpoch = int128(_withdrawalBox.logoutEpoch());

        uint256 depositScaleFactor = uint256(casper.deposit_scale_factor(logoutEpoch));

        totalLoggedOutDeposit = totalLoggedOutDeposit.sub(uint256(scaledDeposit).mul(depositScaleFactor));

        emit Sweep(_withdrawalBox);
    }

    function getTotalPoolSize() external view returns(uint256 size) {
        size = address(this).balance;

        uint256 depositScaleFactor = uint256(casper.deposit_scale_factor(casper.current_epoch()));
        uint256 totalScaledDeposit = 0;
        
        for(uint256 i = 0; i < stakeManager.withdrawalBoxesLength(); i ++) {
            AWithdrawalBox withdrawalBox = stakeManager.withdrawalBoxes(i);
            if(withdrawalBox.logoutEpoch() == 0) continue;
        
            int128 validatorIndex = casper.validator_indexes(address(withdrawalBox));
            int128 scaledDeposit;
            (scaledDeposit, , , ,) = casper.validators(validatorIndex);
        
            totalScaledDeposit += uint256(scaledDeposit);
        }
        
        size += totalScaledDeposit * depositScaleFactor;

        return size += totalLoggedOutDeposit;
    }

    function handleDeposit(address sender, uint256 value) internal {
        emit Deposit(sender, value);
    }

    modifier onlyStakeManager() {
        require(msg.sender == address(stakeManager));
        _;
    }
}