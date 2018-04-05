pragma solidity ^0.4.21;

contract ACasper {

    event Vote(address indexed _from)
    event Deposit(address indexed _from, int128 indexed validator_index, address validation_address, int128 _start_dyn, int128 _amount);
}