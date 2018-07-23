pragma solidity 0.4.24;

contract MockSenateSubject {
    uint256 public value = 0;

    function setValue(uint256 _value) external {
        value = _value;
        emit ValueSet(_value);
    }

    event ValueSet(uint256 value);
}