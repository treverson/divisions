pragma solidity 0.4.21;

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

    function WithdrawalBox(ATreasury _treasury) public {
        require(_treasury != msg.sender);

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
        require(msg.sender == address(stakeManager));
        _;
    }

    modifier onlyTreasury() {
        require(msg.sender == address(treasury));
        _;
    }
}