pragma solidity ^0.4.21;

import "../../lib/RLP.sol";

import "../../divisions/stake/ACasper.sol";
/*  Mock Capser contract. Does not do any checks, 
    but emits events and sets params so that we
    can check it is interacted with correctly

    Based on simple_casper.v.py: https://github.com/ethereum/casper/blob/master/casper/contracts/simple_casper.v.py    
*/
contract MockCasper is ACasper {
    using RLP for bytes;
    
    function deposit(address validation_addr, address withdrawal_addr) public payable {
        int128 start_dynasty = dynasty + 2;

        validator_indexes[withdrawal_addr] = nextValidatorIndex;
        validators[nextValidatorIndex] = Validator({
            deposit: int128(msg.value),
            start_dynasty: start_dynasty,
            end_dynasty: default_end_dynasty,
            addr: validation_addr,
            withdrawal_addr: withdrawal_addr
        });

        emit Deposit(msg.sender, nextValidatorIndex, validation_addr, start_dynasty, int128(msg.value));

        nextValidatorIndex++;
    }
}