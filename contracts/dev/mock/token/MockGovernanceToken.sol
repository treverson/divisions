pragma solidity 0.4.24;

import "../../../divisions/token/GovernanceToken.sol";

contract MockGovernanceToken is AGovernanceToken {
    
    constructor(uint256 _initialSupply) public {
        symbol = "MOCK";
        name = "MockDivisions";
        decimals = 18;
        totalSupply_ = _initialSupply;
        balances[msg.sender] = _initialSupply;
    }
}