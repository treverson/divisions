pragma solidity 0.4.24;

import "../../../divisions/gov/TokenVault.sol";
import "../token/MockTokenRecipient.sol";

contract MockTokenVault is ITokenVault, MockTokenRecipient {
   
    struct Locker{
        uint256 amount;
        uint256 unlockAtBlock;
    }

    mapping(address => Locker) internal lockers_;
    CallingToken internal token_;

    constructor(CallingToken _token) public {
        token_ = _token;
    }

    function token() external view returns (CallingToken) {
        return token_;
    }

    function lockers(address _addr)
        external
        view
        returns(uint256, uint256) 
    {
        Locker storage locker = lockers_[_addr];
        return (locker.amount, locker.unlockAtBlock);
    }

    function lockTokens(address _addr, uint256 _amount, uint256 _unlockAtBlock) external {
        emit LockTokensCalled(_addr, _amount, _unlockAtBlock);
    }

    function unlockTokens() external {
        emit UnlockTokensCalled();
    }

    function setLockerParams(address _addr, uint256 _amount, uint256 _unlockAtBlock) external {
        Locker storage locker = lockers_[_addr];
        locker.amount = _amount;
        locker.unlockAtBlock = _unlockAtBlock;
    }

    event LockTokensCalled(address addr, uint256 amount, uint256 unlockAtBlock);
    event UnlockTokensCalled();

}