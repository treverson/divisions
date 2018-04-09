pragma solidity ^0.4.21;

contract ACasper {
    event Deposit(address indexed _from, int128 indexed _validator_index, address _validation_address, int128 _start_dyn, int128 _amount);
    event Vote(address indexed _from,  int128 indexed _validator_index, bytes32 indexed _target_hash, int128 _target_epoch, int128 _source_epoch);
    event Logout(address indexed _from, int128 indexed _validator_index, int128 _end_dyn);
    event Withdraw(address indexed _to, int128 indexed _validator_index, int128 _amount);
    event Slash(address indexed _from, address indexed _offender, int128 indexed _offender_index, int128 _bounty, int128 _destroyed);
    event Epoch(int128 indexed _number, bytes32 indexed _checkpoint_hash, bool _is_justified, bool _is_finalized);

    struct Validator {
        int128 deposit;
        int128 start_dynasty;
        int128 end_dynasty;
        address addr;
        address withdrawal_addr;
    }
    int128 public current_epoch = 0;
    
    int128 public epoch_length;
    int128 public min_deposit_size;

    int128 public dynasty = 0;

    mapping(int128 => Validator) public validators;

    int128 public next_validator_index = 1;
    mapping(address => int128) public validator_indexes;

    int128 internal default_end_dynasty = 1000000000000000000000000000000;

    function deposit(address validation_addr, address withdrawal_addr) public payable;

    function vote(bytes vote_msg) public;

}