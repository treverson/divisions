pragma solidity ^0.4.21;

import "../../lib/DummyCasper.sol";
import "../../lib/RLP.sol";

import "../../divisions/stake/ACasper.sol";

contract MockCasper is ACasper, DummyCasper {
    using RLP for bytes;
    
    /// @dev Cast a vote
    function vote(bytes vote_msg) public {
        
    }
}