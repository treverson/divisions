pragma solidity ^0.4.19;

contract BaseWithdrawalBox {
   
    uint256 public deployedAt;
    address public stakeManager;
    address public recipient;
    uint256 public logoutEpoch;
    bytes public logoutMessage;

    function sweep() external;
    function setLogoutMessage(bytes _logoutMessage) external;

    event EtherReceived(uint256 amount);
}

contract WithdrawalBox is BaseWithdrawalBox {

    function WithdrawalBox(uint256 _logoutEpoch, address _recipient) public {
        require(_recipient != msg.sender);

        logoutEpoch = _logoutEpoch;
        deployedAt = block.number;
        recipient = _recipient;
        stakeManager = msg.sender;
    }

    function() public payable {
        EtherReceived(msg.value);
    }

    function sweep() external {
        recipient.transfer(address(this).balance);
    }
    
    function setLogoutMessage(bytes _logoutMessage) external onlyStakeManager {
        logoutMessage = _logoutMessage;
    }

    modifier onlyStakeManager {
        require(msg.sender == stakeManager);
        _;
    }
}