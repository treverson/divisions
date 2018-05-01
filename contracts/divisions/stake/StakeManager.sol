pragma solidity 0.4.23;

import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "../../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";

import "./Treasury.sol";
import "./WithdrawalBox.sol";
import "./ACasper.sol";
import "../exchange/Exchange.sol";

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

    address public validator;
    ACasper public casper;
    ATreasury public treasury;
    AExchange public exchange;

    mapping(uint256 => mapping(uint256 => VoteMessage)) public votes;
    mapping(address => LogoutMessage) public logoutMessages;
    AWithdrawalBox[] public withdrawalBoxes;

    function withdrawalBoxesLength() external view returns (uint256 length);

    function transferValidatorship(address _validator) external onlyOwner();
    function setTreasury(ATreasury _treasury) external onlyOwner();
    function setExchange(AExchange _exchange) external onlyOwner();

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

    function logout(
        AWithdrawalBox _withdrawalBox,
        bytes _messageRLP,
        uint256 _validatorIndex,
        uint256 _epoch
    )
        external;


    event ValidatorshipTransferred(address indexed oldValidator, address indexed newValidator);
    event TreasurySet(ATreasury indexed oldTreasury, ATreasury indexed newTreasury);
    event ExchangeSet(AExchange indexed oldExchange, AExchange indexed newExchange);
    event WithdrawalBoxDeployed(AWithdrawalBox indexed withdrawalBox);
    event VoteCast(bytes messageRLP, uint256 validatorIndex, bytes32 targetHash, uint256 targetEpoch, uint256 sourceEpoch);
    event Logout(AWithdrawalBox indexed withdrawalBox, bytes messageRLP, uint256 validatorIndex, uint256 epoch);
}

contract StakeManager is AStakeManager {
    using SafeMath for uint256;

    constructor(
        ACasper _casper,
        address _validator,
        ATreasury _treasury
    ) 
        public 
    {
        casper = _casper;
        validator = _validator;
        treasury = _treasury;
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

    function setExchange(AExchange _exchange) external onlyOwner() {
        require(_exchange != address(0));
        emit ExchangeSet(exchange, _exchange);
        exchange = _exchange;
    }

    function getStakeAmount() public view returns (uint256 amount) {
        uint256 availableAmount = address(treasury).balance + exchange.weiReserve();

        return amount = availableAmount >= uint256(casper.MIN_DEPOSIT_SIZE()) ? availableAmount : 0;
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
        // To store the vote even when it's rejected, use low-level call
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