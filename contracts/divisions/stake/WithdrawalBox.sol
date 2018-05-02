pragma solidity 0.4.23;

import "./StakeManager.sol";
import "./Treasury.sol";

contract AWithdrawalBox {
   
    uint256 public deployedAt;
    ATreasury public treasury;

    AStakeManager public stakeManager;

    function sweep() external;

    event EtherReceived(uint256 amount);
    event Sweep(uint256 amount);
}

contract WithdrawalBox is AWithdrawalBox {

    constructor(ATreasury _treasury) public {
        deployedAt = block.number;
        treasury = _treasury;

        stakeManager = StakeManager(msg.sender);
    }

    function() public payable {
        emit EtherReceived(msg.value);
    }

    function sweep() external onlyTreasury {
        uint256 balance = address(this).balance;
        address(treasury).transfer(balance);
        emit Sweep(balance);
    }

    modifier onlyStakeManager() {
        require(msg.sender == address(stakeManager), "Can only be called by stakeManager");
        _;
    }

    modifier onlyTreasury() {
        require(msg.sender == address(treasury), "Can only be called by treasury");
        _;
    }
}