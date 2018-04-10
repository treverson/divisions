pragma solidity ^0.4.21;

import "../../divisions/token/DivisionsToken.sol";

contract MockDivisionsToken is ADivisionsToken {

    function mint(address _to, uint256 _amount) public {
        totalSupply_ = totalSupply_.add(_amount);
        balances[_to] = balances[_to].add(_amount);

        emit Mint(_to, _amount);
    }
    function burn(uint256 _amount) public {
        balances[minter] = balances[minter].sub(_amount);
        totalSupply_ = totalSupply_.sub(_amount);

        emit Burn(_amount);
    }

    function transferMintership(address _minter) onlyOwner public {
        emit MintershipTransferred(_minter, minter);
        
        minter = _minter;
    }
}