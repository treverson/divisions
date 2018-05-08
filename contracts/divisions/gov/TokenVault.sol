pragma solidity 0.4.23;

import "./AddressBookEntry.sol";

import "../token/GovernanceToken.sol";
import "../token/ITokenRecipient.sol";

import "../../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";

contract ATokenVault is AddressBookEntry, ITokenRecipient {

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

    constructor(AAddressBook _addressBook)
        AddressBookEntry(_addressBook, "TokenVault")
        public
    {}

    function lockTokens(uint256 _amount) external {
        lockTokens(_amount, msg.sender);
    }

    function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) external payable {
        require(_token == address(getGovernanceToken()), "Only accepts approvals from GovernanceToken");
        lockTokens(_value, _from);
    }

    function lockTokens(uint256 _amount, address _owner) internal {
        getGovernanceToken().transferFrom(_owner, address(this), _amount);
        
        Locker storage locker = lockers[_owner];
        locker.amount = locker.amount.add(_amount);
        locker.lastIncreasedAt = block.timestamp;

        emit TokensLocked(_owner, _amount);
    }

    function unlockTokens(uint256 _amount) external {
        Locker storage locker = lockers[msg.sender];

        // SafeMath.sub() checks for underflow and
        // reverts if locker.amount - _amount < 0
        locker.amount = locker.amount.sub(_amount);

        getGovernanceToken().transfer(msg.sender, _amount);
         
        emit TokensUnlocked(msg.sender, _amount);
    }

    function getGovernanceToken() internal view returns (AGovernanceToken govToken){
        return govToken = AGovernanceToken(getEntry("GovernanceToken"));
    }
}
