pragma solidity ^0.4.21;

contract AWithdrawalBox {
   
    uint256 public deployedAt;
    address public stakeManager;
    address public recipient;
    uint256 public logoutEpoch;
    bytes public logoutMessage;

    function sweep() external;
    function setLogoutMessage(bytes _logoutMessage) external;

    event EtherReceived(uint256 amount);
    event Sweep();
    event LogoutMessageSet(bytes logoutMessage);
}

contract WithdrawalBox is AWithdrawalBox {

    function WithdrawalBox(uint256 _logoutEpoch, address _recipient) public {
        require(_recipient != msg.sender);

        logoutEpoch = _logoutEpoch;
        deployedAt = block.number;
        recipient = _recipient;
        stakeManager = msg.sender;
    }

    function() public payable {
        emit EtherReceived(msg.value);
    }

    function sweep() external {
        recipient.transfer(address(this).balance);
        emit Sweep();
    }
    
    function setLogoutMessage(bytes _logoutMessage) external onlyStakeManager {
        logoutMessage = _logoutMessage;
        emit LogoutMessageSet(_logoutMessage);
    }

    modifier onlyStakeManager {
        require(msg.sender == stakeManager);
        _;
    }

    
}