pragma solidity ^0.4.21;

contract AWithdrawalBox {
   
    uint256 public deployedAt;
    address public stakeManager;
    address public recipient;
    uint256 public logoutEpoch;
    LogoutMessage public logoutMessage;

    struct LogoutMessage {
        bytes messageRLP;
        uint256 validatorIndex;
        uint256 epoch;
    }

    function sweep() external;
    function setLogoutMessage(bytes _messageRLP, uint256 _validatorIndex, uint256 _epoch) external;

    function validatorIndex() external view returns(uint256) {
        return logoutMessage.validatorIndex;
    }

    event EtherReceived(uint256 amount);
    event Sweep(uint256 amount);
    event LogoutMessageSet(bytes messageRLP, uint256 indexed validatorIndex, uint256 epoch);
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
        uint256 balance = address(this).balance;
        recipient.transfer(balance);
        emit Sweep(balance);
    }
    
    function setLogoutMessage(bytes _messageRLP, uint256 _validatorIndex, uint256 _epoch) external onlyStakeManager {
        logoutMessage = LogoutMessage({
            messageRLP: _messageRLP,
            validatorIndex: _validatorIndex,
            epoch: _epoch
        });

        emit LogoutMessageSet(_messageRLP, _validatorIndex, _epoch);
    }

    modifier onlyStakeManager {
        require(msg.sender == stakeManager);
        _;
    }

    
}