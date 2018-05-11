pragma solidity 0.4.23;

import "./AddressBookEntry.sol";

import "../token/CallingToken.sol";
import "../token/ITokenRecipient.sol";

import "../../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";

contract ATokenVault is AddressBookEntry, ITokenRecipient {

    uint256 public totalLocked;

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

    string private tokenName;

    constructor(AAddressBook _addressBook, string _tokenName)
        AddressBookEntry(_addressBook, "TokenVault")
        public
    {
        tokenName = _tokenName;
    }

    function lockTokens(uint256 _amount) external {
        lockTokens(_amount, msg.sender);
    }

    function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) external payable {
        bytes(_extraData); // Suppress warning on unused variable
        require(_token == address(getToken()), "Only accepts approvals from GovernanceToken");
        lockTokens(_value, _from);
    }

    function lockTokens(uint256 _amount, address _owner) internal {
        getToken().transferFrom(_owner, address(this), _amount);
        
        Locker storage locker = lockers[_owner];
        locker.amount = locker.amount.add(_amount);
        locker.lastIncreasedAt = block.timestamp;

        totalLocked = totalLocked.add(_amount);

        emit TokensLocked(_owner, _amount);
    }

    function unlockTokens(uint256 _amount) external {
        Locker storage locker = lockers[msg.sender];

        // SafeMath.sub() checks for underflow and
        // reverts if locker.amount - _amount < 0
        locker.amount = locker.amount.sub(_amount);

        totalLocked = totalLocked.sub(_amount);

        getToken().transfer(msg.sender, _amount);
         
        emit TokensUnlocked(msg.sender, _amount);
    }

    function getToken() internal view returns (ACallingToken token){
        return token = ACallingToken(getEntry(tokenName));
    }
}
