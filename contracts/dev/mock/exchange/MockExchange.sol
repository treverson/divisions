pragma solidity 0.4.24;

import "../../../divisions/exchange/Exchange.sol";

contract MockExchange is AExchange {
    uint256 weiReserve_ = 0;
    uint256 divReserve_ = 0;

    constructor(ATreasury _treasury)
    public {
        treasury = _treasury;
    }

    function setMinBuyOrderAmount(uint256 _min) external onlyOwner(){

    }

    function setMinSellOrderAmount(uint256 _max) external onlyOwner(){

    }

    function receiveApproval(address _from, uint256 _value, address _token, bytes _extraData) external payable {
    }

    
    function buyOrdersLength() public view returns (uint256 length) {
        return length =  buyOrders.length;
    }

    
    function sellOrdersLength() public view returns (uint256 length) {
        return length = sellOrders.length;
    }

    
    function weiReserve() public view returns (uint256 reserve) {
        return reserve = weiReserve_;
    }

    
    function divReserve() public view returns (uint256 reserve) {
        return reserve = divReserve_;
    }

    
    function placeBuyOrder() payable external {

    }
    
    function placeSellOrder(uint256 _amount) external {

    }

    
    function placeAndFillBuyOrder() payable external {

    }
    
    function placeAndFillSellOrder(uint256 _amount) external {

    }

    
    function buyOrderFillableAmount(uint256 _index) external view returns (uint256 amount) {

    }
    
    function sellOrderFillableAmount(uint256 _index) external view returns (uint256 amount) {

    }

    
    function getBuyOrderIndexes(address _buyer) public view returns (uint256[] indexes) {

    }
    
    function getSellOrderIndexes(address _seller) public view returns (uint256[] indexes) {

    }

    
    function fillBuyOrder(uint256 _index) external {

    }
    
    function fillSellOrder(uint256 _index) external {

    }

    
    function cancelBuyOrder(uint256 _index) external {

    }
    
    function cancelSellOrder(uint256 _index) external {

    }

    function divPrice() public view returns (uint256 price) {
        return 1e18;
    }
    
    function toDiv(uint256 _weiAmount) external view returns (uint256 divAmount) {
        return divAmount = _weiAmount;
    }
    
    function toWei(uint256 _divAmount) external view returns (uint256 weiAmount) {
        return weiAmount = _divAmount;
    }  
    
    function transferWeiToTreasury(uint256 _amount) external {
        require(weiReserve() >= _amount);
        treasury.deposit.value(_amount)();
        weiReserve_ -= _amount;
        emit TransferWeiToTreasuryCalled(_amount);
    }
    
    function receiveEtherDeposit() external payable {
        weiReserve_ += msg.value;
        emit ReceiveEtherDepositCalled(msg.value);
    }

    function setDivReserve(uint256 _value) external {
        divReserve_ = _value;
    }

    function setWeiReserve(uint256 _value) external {
        weiReserve_ = _value;
    }

    event TransferWeiToTreasuryCalled(uint256 amount);
    event ReceiveEtherDepositCalled(uint256 value);

}