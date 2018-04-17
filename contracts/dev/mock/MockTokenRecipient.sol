pragma solidity 0.4.21;

import "../../divisions/token/ITokenRecipient.sol";

contract MockTokenRecipient is ITokenRecipient {

    function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) external {
        emit ReceiveApprovalCalled(_from, _value, _token, _extraData);
    }

    event ReceiveApprovalCalled(address from, uint256 value, address token, bytes extraData);
}