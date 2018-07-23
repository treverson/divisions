pragma solidity 0.4.24;

library AddressUtils {
    
    function isContract(address _self) internal view returns (bool) {
        uint256 codeLength;
        
        assembly {
            codeLength := extcodesize(_self)
        }

        return codeLength > 0;
    }
}