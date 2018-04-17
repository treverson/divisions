pragma solidity 0.4.21;

import "../../divisions/stake/ACasper.sol";
/*  Mock Capser contract. Does not do any checks, 
    but emits events and sets params so that we
    can check it is interacted with correctly

    Based on simple_casper.v.py: https://github.com/ethereum/casper/blob/master/casper/contracts/simple_casper.v.py    
*/
contract MockCasper is ACasper {
    bytes constant public invalid_vote_message = "thisvoteisinvalid";
    bytes constant public invalid_logout_message = "thislogoutisinvalid";

    bytes32 public invalid_vote_message_hash = keccak256(invalid_vote_message_hash);
    bytes32 public invalid_logout_message_hash = keccak256(invalid_logout_message);

    bool rejectNextVote = false;
    bool rejectNextLogout = false;

    function MockCasper(int128 _min_deposit_size, int128 _epoch_length) public {
        // current_epoch = int128(block.number) / epoch_length;

        min_deposit_size = _min_deposit_size;
        epoch_length = _epoch_length;
        
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
        require(!rejectNextVote);
        
        emit VoteCalled(vote_msg);
    }

    function logout(bytes logout_msg) public {
        require(!rejectNextLogout);

        emit LogoutCalled(logout_msg);
    }

    function withdraw(int128 validator_index) public {
        Validator storage validator = validators[validator_index];
        require(validator_indexes[validator.withdrawal_addr] != 0);
        validator_indexes[validator.withdrawal_addr] = 0;

        emit WithdrawCalled(validator_index);
        
        validator.addr.transfer(uint256(validator.deposit));

        delete_validator(validator_index);
    }

    function deposit_size(int128 validator_index) public view returns (int128) {
        Validator storage validator = validators[validator_index];
        return int128(validator.deposit * deposit_scale_factor[current_epoch]);
    }

    function setRejectNextVote(bool _reject) external {
        rejectNextVote = _reject;
    }

    function setRejectNextLogout(bool _reject) external {
        rejectNextLogout = _reject;
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

    event DepositCalled(address validation_addr, address withdrawal_addr, uint256 amount);
    event VoteCalled(bytes vote_msg);

    event LogoutCalled(bytes logout_msg);
    event WithdrawCalled(int128 validator_index);
}