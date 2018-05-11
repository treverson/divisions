pragma solidity 0.4.23;

import "../../divisions/gov/TokenVault.sol";
import "./MockTokenRecipient.sol";

contract MockTokenVault is ATokenVault, MockTokenRecipient {
    
    constructor(AAddressBook _addressBook)
        AddressBookEntry(_addressBook, "TokenVault")
        public
    {}

    function lockTokens(uint256 _amount) external {
        Locker storage locker = lockers[msg.sender];

        locker.amount += _amount;
        locker.lastIncreasedAt = block.timestamp;
        totalLocked += _amount;
        emit TokensLocked(msg.sender, _amount);
    }

    function unlockTokens(uint256 _amount) external {
        require(lockers[msg.sender].amount >= _amount);

        lockers[msg.sender].amount -= _amount;
        totalLocked -= _amount;
        emit TokensUnlocked(msg.sender, _amount);
    }

}