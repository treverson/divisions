pragma solidity 0.4.23;

import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";

import "./ACasper.sol";
import "./StakeManager.sol";
import "./WithdrawalBox.sol";

contract ATreasury is Ownable {
    AStakeManager public stakeManager;
    AExchange public exchange;
    ACasper public casper;

    function() external payable;

    function setStakeManager(AStakeManager _stakeManager) public onlyOwner();
    function setExchange(AExchange _exchange) external onlyOwner();

    function transfer(address _to, uint256 _amount) external;
    function deposit() external payable;

    function transferToExchange(uint256 _amount) external;

    function stake(uint256 _amount, address _validatorAddress, AWithdrawalBox _withdrawalBox) external;

    function sweep(AWithdrawalBox _withdrawalBox) external;

    function getTotalPoolSize() external view returns(uint256 size);

    event StakeManagerSet(AStakeManager indexed previousStakeManager, AStakeManager indexed newStakeManager);
    event ExchangeSet(AExchange indexed previousExchange, AExchange indexed newExchange);

    event Transfer(address indexed to, uint256 amount);
    event Deposit(address indexed from, uint256 amount);
    event Stake(address indexed validatorAddress, AWithdrawalBox indexed withdrawalBox, uint256 amount);
    event Sweep(AWithdrawalBox withdrawalBox);
}

contract Treasury is ATreasury {
    using SafeMath for uint256;

    struct TotalPoolSizeCache {
        bytes32 txHash;
        uint256 totalPoolSize;
    }

    TotalPoolSizeCache private poolSizeCache;

    constructor(ACasper _casper) public {
        casper = _casper;
    }

    function() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function setStakeManager(AStakeManager _stakeManager) public onlyOwner {
        require(_stakeManager != address(0), "StakeManager cannot be 0");

        emit StakeManagerSet(stakeManager, _stakeManager);
        stakeManager = _stakeManager;
    }

    function setExchange(AExchange _exchange) external onlyOwner {
        require(_exchange != address(0), "Exchange cannot be 0");

        emit ExchangeSet(exchange, _exchange);
        exchange = _exchange;
    }

    function transfer(address _to, uint256 _amount) external onlyStakeManager {
        _to.transfer(_amount);
        emit Transfer(_to, _amount);
    }

    function transferToExchange(uint256 _amount) external onlyStakeManager {
        exchange.receiveEtherDeposit.value(_amount)();
        emit Transfer(address(exchange), _amount);
    }

    function deposit() external payable {
        handleDeposit(msg.sender, msg.value);
    }

    function stake(uint256 _amount, address _validatorAddress, AWithdrawalBox _withdrawalBox) external onlyStakeManager {
        casper.deposit.value(_amount)(_validatorAddress, _withdrawalBox);
        
        emit Stake(_validatorAddress, _withdrawalBox, _amount);
    }

    function sweep(AWithdrawalBox _withdrawalBox) external {
        _withdrawalBox.sweep();
        emit Sweep(_withdrawalBox);
    }

    function getTotalPoolSize() external view returns(uint256 size) {
        return size = address(this).balance + totalCasperDeposit();
    }

    function handleDeposit(address sender, uint256 value) internal {
        emit Deposit(sender, value);
    }

    function getEndEpoch(int128 endDynasty) internal view returns (int128 endEpoch) {
        return casper.dynasty_start_epoch(endDynasty + 1);
    }

    function totalCasperDeposit() internal view returns (uint256 totalDeposit) {
        uint256 currentDepositScaleFactor = uint256(casper.deposit_scale_factor(casper.current_epoch()));
        uint256 totalScaledActiveDeposit = 0; //The scaled total amount of ether that is currently used to stake in the casper contract
        uint256 totalLoggedOutDeposit = 0; //The total amount of ether in the 
        uint256 totalWithdrawalBoxBalance = 0; //The total balance of the withdrawalboxes

        int128 currentDynasty = casper.dynasty();

        for(uint256 i = 0; i < stakeManager.withdrawalBoxesLength(); i ++) {
            AWithdrawalBox withdrawalBox = stakeManager.withdrawalBoxes(i);
        
            int128 validatorIndex = casper.validator_indexes(address(withdrawalBox));
            
            if(validatorIndex != 0) { // If the validator is currently active
                int128 scaledDeposit;
                int128 endDynasty;
                (scaledDeposit, , endDynasty, ,) = casper.validators(validatorIndex);
                if(endDynasty >= currentDynasty) // If the validator is not logged out
                    totalScaledActiveDeposit += uint256(scaledDeposit);
                else {
                    int128 endEpoch = getEndEpoch(endDynasty);
                    totalLoggedOutDeposit += uint256(scaledDeposit * casper.deposit_scale_factor(endEpoch));
                 }
            }

            totalWithdrawalBoxBalance += address(withdrawalBox).balance;          
        }

        return totalDeposit = totalLoggedOutDeposit +
            totalWithdrawalBoxBalance +
            totalScaledActiveDeposit * currentDepositScaleFactor;

    }


    modifier onlyStakeManager() {
        require(msg.sender == address(stakeManager), "Can only be called by stakeMAnager");
        _;
    }
}
