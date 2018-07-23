pragma solidity 0.4.24;

import "../token/CallingToken.sol";
import "../token/ITokenRecipient.sol";

contract ATokenVault is ITokenRecipient {

    uint256 public totalLocked;
    uint256 public totalLockedLastBlock;

    struct Locker {
        // The amount of DIVG that is locked
        uint256 amount;
        // The last time the amount locked was increased
        uint256 lastIncreasedAt;
    }

    mapping(address => Locker) public lockers;

    function lockTokens(uint256 _amount) external;
    function unlockTokens(uint256 _amount) external;

    event TokensLocked(address indexed owner, uint256 amount);
    event TokensUnlocked(address indexed owner, uint256 amount);
}

contract TokenVault is ATokenVault {
    using SafeMath for uint256;

    uint256 totalLockedLastUpdatedAt;

    CallingToken public token;

    constructor(CallingToken _token)
        public
    {
        token = _token;
    }

    function lockTokens(uint256 _amount) external {
        lockTokens(_amount, msg.sender);
    }

    function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) external payable {
        bytes(_extraData); // Suppress warning on unused variable
        require(_token == address(token), "Only accepts approvals from associated token");
        lockTokens(_value, _from);
    }

    function lockTokens(uint256 _amount, address _owner) internal {
        if(totalLockedLastUpdatedAt < block.timestamp){
            totalLockedLastBlock = totalLocked;
            totalLockedLastUpdatedAt = block.timestamp;
        }

        token.transferFrom(_owner, address(this), _amount);
        
        Locker storage locker = lockers[_owner];
        locker.amount = locker.amount.add(_amount);
        locker.lastIncreasedAt = block.timestamp;

        totalLocked = totalLocked.add(_amount);

        emit TokensLocked(_owner, _amount);
    }

    function unlockTokens(uint256 _amount) external {
        if(totalLockedLastUpdatedAt < block.timestamp){
            totalLockedLastBlock = totalLocked;
            totalLockedLastUpdatedAt = block.timestamp;
        }

        Locker storage locker = lockers[msg.sender];
        
        // SafeMath.sub() checks for underflow and
        // reverts if locker.amount - _amount < 0
        locker.amount = locker.amount.sub(_amount);

        totalLocked = totalLocked.sub(_amount);

        token.transfer(msg.sender, _amount);
         
        emit TokensUnlocked(msg.sender, _amount);
    }
}
