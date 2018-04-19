pragma solidity 0.4.21;

import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";

import "./Treasury.sol";
import "./WithdrawalBox.sol";
import "./ACasper.sol";

contract AStakeManager is Ownable {
    
    struct VoteMessage {
        bytes messageRLP;
        bytes32 targetHash;
        uint256 targetEpoch;
        uint256 sourceEpoch;
        uint256 castAt;
        bool accepted;
    }

    struct LogoutMessage {
        bytes messageRLP;
        uint256 validatorIndex;
        uint256 epoch;
        uint256 setAt;
    }

    uint8 public epochsBeforeLogout;

    address public validator;
    ACasper public casper;
    ATreasury public treasury;

    mapping(uint256 => mapping(uint256 => VoteMessage)) votes;
    mapping(address => LogoutMessage) public logoutMessages;
    AWithdrawalBox[] public withdrawalBoxes;

    function withdrawalBoxesLength() external view returns (uint256 length);

    function transferValidatorship(address _validator) external onlyOwner();
    function setTreasury(ATreasury _treasury) external onlyOwner();

    function getStakeAmount() public view returns (uint256 amount);
    function makeStakeDeposit() external;
    
    function vote(
        bytes _voteMessage,
        uint256 _validatorIndex,
        bytes32 _targetHash,
        uint256 _targetEpoch,
        uint256 _sourceEpoch
    )
        external;

    function getVoteMessage(uint256 _validatorIndex, uint256 _targetEpoch)
        public
        view
        returns (
            bytes messageRLP,
            bytes32 targetHash,
            uint256 targetEpoch,
            uint256 sourceEpoch,
            uint256 castAt,
            bool accepted
        );

    function logout(
        AWithdrawalBox _withdrawalBox,
        bytes _messageRLP,
        uint256 _validatorIndex,
        uint256 _epoch
    )
        external;


    event ValidatorshipTransferred(address indexed oldValidator, address indexed newValidator);
    event TreasurySet(address indexed oldTreasury, address indexed newTreasury);
    event WithdrawalBoxDeployed(AWithdrawalBox indexed withdrawalBox);
    event VoteCast(bytes messageRLP, uint256 validatorIndex, bytes32 targetHash, uint256 targetEpoch, uint256 sourceEpoch);
    event Logout(AWithdrawalBox indexed withdrawalBox, bytes messageRLP, uint256 validatorIndex, uint256 epoch);
}

contract StakeManager is AStakeManager {
    using SafeMath for uint256;

    function StakeManager(
        ACasper _casper,
        address _validator,
        ATreasury _treasury,
        uint8 _epochsBeforeLogout
    ) 
        public 
    {
        
        casper = _casper;
        validator = _validator;
        treasury = _treasury;
        epochsBeforeLogout = _epochsBeforeLogout;
    }    
    
    function withdrawalBoxesLength() external view returns (uint256 length) {
        return length = withdrawalBoxes.length;
    }

    function transferValidatorship(address _validator) external onlyOwner() {
        require(_validator != address(0));
        emit ValidatorshipTransferred(validator, _validator);
        validator = _validator;
    }

    function setTreasury(ATreasury _treasury) external onlyOwner() {
        require(_treasury != address(0));
        emit TreasurySet(treasury, _treasury);
        treasury = _treasury;
    }

    function getStakeAmount() public view returns (uint256 amount) {
        // TODO implement actual calculation
        return amount = address(treasury).balance;
    }

    function makeStakeDeposit() external {
        // TODO have the exchange deposit ether in the treasury
        AWithdrawalBox withdrawalBox = new WithdrawalBox(treasury);
        
        uint256 depositSize = getStakeAmount();

        treasury.stake(depositSize, validator, withdrawalBox);

        withdrawalBoxes.push(withdrawalBox);

        emit WithdrawalBoxDeployed(withdrawalBox);
    }
    
    function vote(
        bytes _messageRLP,
        uint256 _validatorIndex,
        bytes32 _targetHash,
        uint256 _targetEpoch,
        uint256 _sourceEpoch
        )
        external
        onlyValidator
    {
        bool accepted = address(casper).call(bytes4(keccak256("vote(bytes)")), _messageRLP);
    
        votes[_validatorIndex][_targetEpoch] = VoteMessage({
            messageRLP: _messageRLP,
            targetHash: _targetHash,
            targetEpoch: _targetEpoch,
            sourceEpoch: _sourceEpoch,
            castAt: block.number,
            accepted: accepted
        });
        emit VoteCast(_messageRLP, _validatorIndex, _targetHash, _targetEpoch, _sourceEpoch);
    }

    function getVoteMessage(uint256 _validatorIndex, uint256 _targetEpoch)
        public
        view
        returns (
            bytes messageRLP,
            bytes32 targetHash,
            uint256 targetEpoch,
            uint256 sourceEpoch,
            uint256 castAt,
            bool accepted
        ) 
    {
        VoteMessage storage voteMsg = votes[_validatorIndex][_targetEpoch];

        return (
            voteMsg.messageRLP, 
            voteMsg.targetHash, 
            voteMsg.targetEpoch,
            voteMsg.sourceEpoch, 
            voteMsg.castAt,
            voteMsg.accepted
        );
    }

    function logout(
        AWithdrawalBox _withdrawalBox,
        bytes _messageRLP,
        uint256 _validatorIndex,
        uint256 _epoch
    ) external {
        
        logoutMessages[_withdrawalBox] = LogoutMessage({
            messageRLP: _messageRLP,
            validatorIndex: _validatorIndex,
            epoch: _epoch,
            setAt: block.number
        });

        

        casper.logout(_messageRLP);

        emit Logout(_withdrawalBox, _messageRLP, _validatorIndex, _epoch);
    }

    modifier onlyValidator() {
        require(msg.sender == validator);
        _;
    }

}