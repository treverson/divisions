pragma solidity 0.4.24;

import "./MockDelegatingSenateSubject.sol";

contract MockExecutor {
    function execute(
        MockDelegatingSenateSubject _subject1,
        MockDelegatingSenateSubject _subject2,
        MockDelegatingSenateSubject _subject3,
        string _message) 
    external 
    {
        _subject1.logEvent(_message);
        _subject2.logEvent(_message);
        _subject3.logEvent(_message);
    }
}