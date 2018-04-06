pragma solidity ^0.4.21;

import "../../divisions/stake/WithdrawalBox.sol";

contract MockWithdrawalBox is AWithdrawalBox {
    
    function MockWithdrawalBox(address _recipient) public {
        setRecipient(_recipient);
    }

    function() public payable {
        emit EtherReceived(msg.value);
    }

    function sweep() external {
        uint256 balance = address(this).balance;
        recipient.transfer(balance);
        emit Sweep(balance);
    }
    
    function setLogoutMessage(bytes _messageRLP, uint256 _validatorIndex, uint256 _epoch) external {
        logoutMessage = LogoutMessage({
            messageRLP: _messageRLP,
            validatorIndex: _validatorIndex,
            epoch: _epoch
        });

        emit LogoutMessageSet(_messageRLP, _validatorIndex, _epoch);
    }

    function setRecipient(address _recipient) public {
        recipient = _recipient;
    }
}