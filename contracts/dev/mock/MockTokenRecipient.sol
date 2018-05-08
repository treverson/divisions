pragma solidity 0.4.23;

import "../../divisions/token/ITokenRecipient.sol";

contract MockTokenRecipient is ITokenRecipient {

    function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) external payable {
        emit ReceiveApprovalCalled(_from, _value, msg.value, _token, _extraData);
    }

    event ReceiveApprovalCalled(address from, uint256 value, uint256 msgValue, address token, bytes extraData);
}