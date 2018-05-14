pragma solidity 0.4.23;

import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

import "./ITokenRecipient.sol";

contract ACallingToken is StandardToken {
    
    function approveAndCall(ITokenRecipient _spender, uint256 _value, bytes _extraData) external payable returns(bool success);
}

contract CallingToken is ACallingToken {
    function approveAndCall(ITokenRecipient _spender, uint256 _value, bytes _extraData) external payable returns(bool success) {
        approve(_spender, _value);
        _spender.receiveApproval.value(msg.value)(msg.sender, _value, address(this), _extraData);
        return success = true;
    }
}