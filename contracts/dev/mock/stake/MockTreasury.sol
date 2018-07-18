pragma solidity 0.4.24;

import "../../../divisions/stake/Treasury.sol";

contract MockTreasury is ATreasury {
    uint256 private totalPoolSize_;

    constructor(ACasper _casper)
    public
    {
        casper = _casper;
    }

    function() external payable {}

    function setStakeManager(AStakeManager _stakeManager) public onlyOwner {
        stakeManager = _stakeManager;
    }

    function setExchange(AExchange _exchange) external onlyOwner {
        exchange = _exchange;
    }

    function transfer(address _to, uint256 _amount) external {
        _to.transfer(_amount);
    }
    function deposit() external payable {
        emit DepositCalled(msg.sender, msg.value);
    }

    function stake(uint256 _amount, address _validatorAddress, AWithdrawalBox _withdrawalBox) external {
        emit StakeCalled(_amount, _validatorAddress, _withdrawalBox);
    }

    function transferToExchange(uint256 _amount) external {
        emit TransferToExchangeCalled(_amount);
    }

    function sweep(AWithdrawalBox _withdrawalBox) external {
        emit SweepCalled(_withdrawalBox);
    }

    function getTotalPoolSize() external view returns(uint256 size) {
        return size = totalPoolSize_;
    }

    function setTotalPoolSize(uint256 _size) external {
        totalPoolSize_ = _size;
    }

    event DepositCalled(address from, uint256 value);
    event TransferToExchangeCalled(uint256 amount);
    event StakeCalled(uint256 amount, address indexed validatorAddress, AWithdrawalBox indexed withdrawalBox);
    event SweepCalled(AWithdrawalBox withdrawalBox);
}