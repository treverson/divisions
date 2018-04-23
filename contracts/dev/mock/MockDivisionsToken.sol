pragma solidity 0.4.21;

import "../../divisions/token/DivisionsToken.sol";

contract MockDivisionsToken is ADivisionsToken {

    function MockDivisionsToken() public {
        symbol = "MOCK";
        name = "MockDivisions";
        decimals = 18;
    }

    function mint(address _to, uint256 _amount) public {
        totalSupply_ = totalSupply_.add(_amount);
        balances[_to] = balances[_to].add(_amount);

        emit Mint(_to, _amount);
    }
    function burn(uint256 _amount) public {
        burnFrom(minter, _amount);
    }

    function transferMintership(address _minter) onlyOwner public {
        emit MintershipTransferred(_minter, minter);
        
        minter = _minter;
    }

    function burnFrom(address _account, uint256 _amount) public {
        balances[_account] = balances[_account].sub(_amount);
        totalSupply_ = totalSupply_.sub(_amount);

        emit Burn(_amount);
    }

    function approveAndCall(ITokenRecipient _spender, uint256 _value, bytes _extraData) external payable returns(bool success) {
        approve(_spender, _value);
        _spender.receiveApproval(msg.sender, _value, address(this), _extraData);
        return success = true;
    }
}