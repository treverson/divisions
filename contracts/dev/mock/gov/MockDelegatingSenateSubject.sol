pragma solidity 0.4.24;

import "../../../divisions/gov/SenateOwnable.sol";

contract MockDelegatingSenateSubject is SenateOwnable {

    constructor(IDelegatingSenate _owner)
    SenateOwnable(_owner)
    public
    {
    }

    function logEvent(string _message) external onlyDelegate {
        emit Message(_message);
    }

    event Message(string message);
}