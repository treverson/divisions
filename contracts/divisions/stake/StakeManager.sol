pragma solidity ^0.4.21;

import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./WithdrawalBox.sol";

contract AStakeManager is Ownable {
    address public validator;

    mapping(uint256 => mapping(uint256 => Vote)) votes;
    mapping(uint256 => AWithdrawalBox) public withdrawalBoxes;

    struct Vote {
        bytes voteMsg;
        bytes32 targetHash;
        uint256 targetEpoch;
        uint256 sourceEpoch;
        uint256 timestamp;
    }

    function getVoteTuple(uint256 _withdrawalBoxIndex, uint256 _epoch)
        public
        view
        returns (
            bytes,
            bytes32,
            uint256,
            uint256,
            uint256
        );
}

contract StakeManager is AStakeManager {

}