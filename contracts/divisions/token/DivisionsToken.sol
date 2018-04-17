pragma solidity 0.4.21;

import "../../../node_modules/zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "../../../node_modules/zeppelin-solidity/contracts/math/SafeMath.sol";
import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";

import "./ITokenRecipient.sol";

contract ADivisionsToken is StandardToken, Ownable {
    address public minter;

    string public symbol;
    string public name;
    uint8 public decimals;

    function mint(address _to, uint256 _amount) public;
    function burn(uint256 _amount) public;
    function transferMintership(address _minter) onlyOwner public;

    function approveAndCall(ITokenRecipient _spender, uint256 _value, bytes _extraData) external payable returns(bool success);
    
    event Burn(uint256 amount);
    event Mint(address recipient, uint256 amount);
    event MintershipTransferred(address indexed oldMinter, address indexed newMinter);
    event ClaimMinterRole(address minter);
}

contract DivisionsToken is ADivisionsToken {
    using SafeMath for uint256;

    function DivisionsToken() public {
        symbol = "DIV";
        name = "Divisions";
        decimals = 18;
    }

    // Accept no ether payments
    function() public {
    }

    function mint(address _to, uint256 _amount) onlyMinter public {
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

    function approveAndCall(ITokenRecipient _spender, uint256 _value, bytes _extraData) external payable returns(bool success) {
        approve(_spender, _value);
        _spender.receiveApproval(msg.sender, _value, address(this), _extraData);
        return success = true;
    }

    modifier onlyMinter() {
        require(msg.sender == minter);
        _;
    }
}