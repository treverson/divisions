pragma solidity 0.4.24;

import "../../../divisions/stake/ACasper.sol";
/*  Mock Capser contract. Does not do decode RLP, 
    but emits events and sets params so that we
    can check it is interacted with correctly

    Based on simple_casper.v.py: https://github.com/ethereum/casper/blob/master/casper/contracts/simple_casper.v.py    
*/
contract MockCasper is ACasper {
    bool rejectVote = false;
    bool rejectLogout = false;

    constructor(
        int128 _min_deposit_size,
        int128 _epoch_length,
        int128 _dynasty_logout_delay,
        int128 _withdrawal_delay
    ) 
        public
    {
        // current_epoch = int128(block.number) / epoch_length; //Division by 0

        MIN_DEPOSIT_SIZE = _min_deposit_size;
        epoch_length = _epoch_length;
        dynasty_logout_delay = _dynasty_logout_delay;
        withdrawal_delay = _withdrawal_delay;
        
        deposit_scale_factor[current_epoch] = 10000000000;
    }

    function deposit(address validation_addr, address withdrawal_addr) public payable {
        emit DepositCalled(validation_addr, withdrawal_addr, msg.value);

        int128 start_dynasty = dynasty + 2;

        validator_indexes[withdrawal_addr] = next_validator_index;
        validators[next_validator_index] = Validator({
            deposit: int128(msg.value) / deposit_scale_factor[current_epoch],
            start_dynasty: start_dynasty,
            end_dynasty: default_end_dynasty,
            addr: validation_addr,
            withdrawal_addr: withdrawal_addr
        });

        emit Deposit(msg.sender, next_validator_index, validation_addr, start_dynasty, int128(msg.value));

        next_validator_index++;
    }

    function vote(bytes vote_msg) public {
        require(!rejectVote);
        
        emit VoteCalled(vote_msg);
    }

    function logout(bytes logout_msg) public {
        require(!rejectLogout);

        emit LogoutCalled(logout_msg);
    }

    function increment_dynasty() public {
        dynasty++;
        dynasty_in_epoch[current_epoch] = dynasty;
        dynasty_start_epoch[dynasty] = current_epoch;
    }


    function withdraw(int128 validator_index) public {
        Validator storage validator = validators[validator_index];
        require(validator_indexes[validator.withdrawal_addr] != 0);
        validator_indexes[validator.withdrawal_addr] = 0;

        int128 end_epoch = dynasty_start_epoch[validator.end_dynasty + 1];

        int128 amount = validator.deposit * deposit_scale_factor[end_epoch];

        emit WithdrawCalled(validator_index);
        emit Withdraw(validator.withdrawal_addr, validator_index, amount);
        validator.withdrawal_addr.transfer(uint256(amount));

        delete_validator(validator_index);
    }

    function deposit_size(int128 validator_index) public view returns (int128) {
        Validator storage validator = validators[validator_index];
        return int128(validator.deposit * deposit_scale_factor[current_epoch]);
    }


    function delete_validator(int128 validator_index) internal {
        validator_indexes[validators[validator_index].withdrawal_addr] = 0;
        validators[validator_index] = Validator({
            deposit: 0,
            start_dynasty: 0,
            end_dynasty: 0,
            addr: address(0),
            withdrawal_addr: address(0)
        });
    }

    // These functions are not representing actual casper functions,
    // but as we are avoiding RLP decodig, 
    // these are used by unittests
    function doLogout(int128 validator_index, int128 epoch) external {
        require(current_epoch >= epoch);
        int128 end_dynasty = dynasty + dynasty_logout_delay;
        
        Validator storage validator = validators[validator_index];
        require(validator.end_dynasty > end_dynasty);
        validator.end_dynasty = end_dynasty;
        emit Logout(validator.withdrawal_addr, validator_index, end_dynasty);
    }

    function slash(int128 validator_index) external {
        delete_validator(validator_index);
    }

    function increment_epoch() external {
        int128 lastDepositScaleFactor = deposit_scale_factor[current_epoch];

        current_epoch ++;
        dynasty_in_epoch[current_epoch] = dynasty;
        deposit_scale_factor[current_epoch] = (lastDepositScaleFactor * 99) / 100;
    }

    //Some utility functions
    function setRejectVote(bool _reject) external {
        rejectVote = _reject;
    }

    function setRejectLogout(bool _reject) external {
        rejectLogout = _reject;
    }

    function setMinDepositSize(int128 _min) external {
        MIN_DEPOSIT_SIZE = _min;
    }

    event DepositCalled(address validation_addr, address withdrawal_addr, uint256 amount);
    event VoteCalled(bytes vote_msg);

    event LogoutCalled(bytes logout_msg);
    event WithdrawCalled(int128 validator_index);
}