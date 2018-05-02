pragma solidity 0.4.23;

import "./CallingToken.sol";

contract AGovernanceToken is CallingToken {
    string public symbol;
    string public name;
    uint8 public decimals;
}

contract GovernanceToken is AGovernanceToken {
    
    constructor(uint256 _initialSupply) public {
        totalSupply_ = _initialSupply;
        balances[msg.sender] = _initialSupply;
        symbol = "DIVG";
        name = "Divisions Governance";
        decimals = 18;
    }  
}