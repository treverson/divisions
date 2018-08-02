pragma solidity 0.4.24;

import "../gov/SenateOwnable.sol"; 
import "../token/CallingToken.sol";
import "../token/ITokenRecipient.sol";

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/math/Math.sol";


interface ITokenVault {

    function token() external view returns (CallingToken);

    function lockers(address _addr)
        external
        view
        returns(uint256, uint256);

    function lockTokens(
        address _addr,
        uint256 _amount,
        uint256 _unlockAtBlock
    )
        external;

    function unlockTokens() external;

    event Lock(address indexed addr, uint256 amount, uint256 unlockAtBlock);
    event Unlock(address indexed addr, uint256 amount);
}


contract TokenVault is SenateOwnable, ITokenVault, ITokenRecipient {
    using SafeMath for uint256;

    CallingToken internal token_;

    struct Locker{
        uint256 amount;
        uint256 unlockAtBlock;
    }

    mapping(address => Locker) internal lockers_;

    constructor(IDelegatingSenate _owner, CallingToken _token) 
    SenateOwnable(_owner)
    public {
        token_ = _token;
    }

    function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) external payable {
        require(_token == address(token_), "Invalid token");
        Locker locker = lockers_[_from];
        
        uint256 unlockAtBlock = Math.max256(locker.unlockAtBlock, block.number);
        doLockTokens(_from, _value, unlockAtBlock);
    }

    function token() external view returns (CallingToken){
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

    // Locks the amount of tokens and updates the moment the locker can be unlocked
    function lockTokens(address _addr, uint256 _amount, uint256 _unlockAtBlock) external {
        doLockTokens(_addr, _amount, _unlockAtBlock);
    }

    function doLockTokens(address _addr, uint256 _amount, uint256 _unlockAtBlock) internal {
        Locker storage locker = lockers_[_addr];
        
        require(
            _unlockAtBlock >= locker.unlockAtBlock,
            "Cannot decrease the withdrawal delay"
        );

        if(_amount > 0) {
            token_.transferFrom(_addr, address(this), _amount);
            locker.amount = locker.amount.add(_amount);
        }
        locker.unlockAtBlock = _unlockAtBlock;
        
        emit Lock(_addr, _amount, _unlockAtBlock);
    }

    // Unlocks tokens, transfering them back to the owner
    function unlockTokens() external {
        Locker storage locker = lockers_[msg.sender];

        require(locker.amount > 0, "Cannot withdraw from an empty locker");
        require(locker.unlockAtBlock < block.number, "Cannot unlock this locker yet");

        uint256 amountLocked = locker.amount;
        locker.amount = 0;

        emit Unlock(msg.sender, amountLocked);

        token_.transfer(msg.sender, amountLocked);        
    }
}