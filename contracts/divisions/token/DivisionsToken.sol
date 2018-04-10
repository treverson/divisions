pragma solidity ^0.4.21;

import "../../../node_modules/zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "../../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "../../../node_modules/zeppelin-solidity/contracts/ownership/Claimable.sol";

contract ADivisionsToken is StandardToken, Claimable {
    address public minter;

    string public symbol;
    string public name;
    uint8 public decimals;

    function mint(address _to, uint256 _amount) public returns(bool);
    function burn(uint256 _amount) public;
    function transferMintership(address _minter) onlyOwner public;

    event Burn(uint256 amount);
    event Mint(address recipient, uint256 amount);
    event MintershipTransferred(address indexed oldMinter, address indexed newMinter);
    event ClaimMinterRole(address minter);
}

contract DivisionsToken is ADivisionsToken {
    using SafeMath for uint256;

    function DivisionsToken(address _minter) public {
        symbol = "DIV";
        name = "Divisions";
        decimals = 18;
        transferMintership(_minter);
    }

    // Accept no ether payments
    function() public {
    }

    function mint(address _to, uint256 _amount) onlyMinter public returns(bool) {
        require(_amount > 0);
        require(_to != address(0));
        
        totalSupply_ = totalSupply_.add(_amount);
        balances[_to] = balances[_to].add(_amount);

        emit Mint(_to, _amount);
    }

    // Minter can burn tokens which are in their own possesion
    function burn(uint256 _amount) onlyMinter public {
        require(_amount > 0);
        require(balanceOf(minter) >= _amount);

        balances[minter] = balances[minter].sub(_amount);
        totalSupply_ = totalSupply_.sub(_amount);

        emit Burn(_amount);
    }

    function transferMintership(address _minter) onlyOwner public {
        require(_minter != address(0));

        emit MintershipTransferred(minter, _minter);
        
        minter = _minter;
        
    }

    modifier onlyMinter() {
        require(msg.sender == minter);
        _;
    }
}