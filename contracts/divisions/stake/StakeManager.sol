pragma solidity ^0.4.21;

import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";

import "./Treasury.sol";
import "./WithdrawalBox.sol";
import "./ACasper.sol";

contract AStakeManager is Ownable {
    address public validator;
    ACasper public casper;
    ATreasury public treasury;

    mapping(uint256 => mapping(uint256 => Vote)) votes;
    AWithdrawalBox[] public withdrawalBoxes;

    struct Vote {
        bytes messageRLP;
        bytes32 targetHash;
        uint256 targetEpoch;
        uint256 sourceEpoch;
        uint256 timestamp;
    }

    function getVote(uint256 _withdrawalBoxIndex, uint256 _epoch)
        public
        view
        returns (
            bytes,
            bytes32,
            uint256,
            uint256,
            uint256
        );

    function transferValidatorship(address _validator) external onlyOwner();
    function setTreasury(ATreasury _treasury) external onlyOwner();

    function getMaxStakeAmount() public view returns (uint256);
    function makeStakeDeposit() external;
    
    function setLogoutMessage(AWithdrawalBox, bytes _messageRLP, uint256 _validatorIndex, uint256 _epoch) external;
    
    function vote(
        bytes _voteMessage,
        uint256 _validatorIndex,
        bytes32 _targetHash,
        uint256 _targetEpoch,
        uint256 _sourceEpoch
        )
        external;

    event ValidatorshipTransferred(address indexed oldValidator, address indexed newValidator);
    event TreasurySet(address indexed oldTreasury, address indexed newTreasury);
    event WithdrawalBoxDeployed(AWithdrawalBox indexed withdrawalBox, uint256 validatorIndex);
    event VoteCast(bytes voteMessage, uint256 validatorIndex, bytes32 targetHash, uint256 targetEpoch);
}

contract StakeManager is AStakeManager {
    function StakeManager(ACasper _casper, address _validator, ATreasury _treasury) public {
        casper = _casper;
        validator = _validator;
        treasury = _treasury;
    }
    
    function transferValidatorship(address _validator) external onlyOwner() {
        require(_validator != address(0));

    }

    function setTreasury(ATreasury _treasury) external onlyOwner() {

    }

    function getMaxStakeAmount() public view returns (uint256) {
        // TODO implement actual calculation
        return address(treasury).balance;
    }

    function makeStakeDeposit() external {

    }
    
    function setLogoutMessage(AWithdrawalBox, bytes _messageRLP, uint256 _validatorIndex, uint256 _epoch) external {

    }
    
    function vote(
        bytes _voteMessage,
        uint256 _validatorIndex,
        bytes32 _targetHash,
        uint256 _targetEpoch,
        uint256 _sourceEpoch
        )
        external
    {

    }

}