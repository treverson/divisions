pragma solidity 0.4.24;

import "./DelegatingSenate.sol";

interface ISenateOwnable {
    function owner() external view returns (IDelegatingSenate);
    function transferOwnership(IDelegatingSenate _newOwner) external;
}

// Contract that is owner by a Delegating senate
// Defines modifiers that allow for execution
// that is restricted to the owner, the delegate or both
contract SenateOwnable {
    IDelegatingSenate internal owner_;
    
    constructor(IDelegatingSenate _owner) internal {
        owner_ = _owner;
    }

    function transferOwnership(IDelegatingSenate _newOwner) external eitherOwnerOrDelegate() {
        emit OwnershipTransferred(owner_, _newOwner);
        owner_ = _newOwner;
    }

    function owner() external view returns (IDelegatingSenate) {
        return owner_;
    }
    
    modifier onlyOwner() {
        require(
            msg.sender == address(owner_),
            "This method can only be called by the owner"
        );
        _;
    }
    
    modifier onlyDelegate() {
        require(
            msg.sender == owner_.delegate(), 
            "This method can only be called by the executor"
        );
        _;
    }

    modifier eitherOwnerOrDelegate() {
        require(
            msg.sender == address(owner_) || msg.sender == owner_.delegate(),
            "This method can either be called by the executor or the owner"
        );
        _;
    }
    
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
}