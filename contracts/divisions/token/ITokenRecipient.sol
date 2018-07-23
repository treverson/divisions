pragma solidity 0.4.24;

contract ITokenRecipient {
    function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) external payable;
}