pragma solidity 0.4.24;

import "../../../divisions/gov/TokenVault.sol";
import "../token/MockTokenRecipient.sol";

contract MockTokenVault is ATokenVault, MockTokenRecipient {
    uint256 totalLockedLastUpdatedAt;

    function lockTokens(uint256 _amount) external {
        if(totalLockedLastUpdatedAt < block.number){
            totalLockedLastBlock = totalLocked;
            totalLockedLastUpdatedAt = block.number;
        }
        Locker storage locker = lockers[msg.sender];

        locker.amount += _amount;
        locker.lastIncreasedAt = block.number;
        totalLocked += _amount;
        emit TokensLocked(msg.sender, _amount);
    }

    function unlockTokens(uint256 _amount) external {
        if(totalLockedLastUpdatedAt < block.number){
            totalLockedLastBlock = totalLocked;
            totalLockedLastUpdatedAt = block.number;
        }
        require(lockers[msg.sender].amount >= _amount);

        lockers[msg.sender].amount -= _amount;
        totalLocked -= _amount;
        emit TokensUnlocked(msg.sender, _amount);
    }

}