pragma solidity ^0.5.0;


contract MainWorld {
    /* look up the world created by user */
    mapping (address => string) public worldAddressToWorldName;
    mapping (string => address) worldNameToWorldAddress;
    
    uint numberOfWorld;
    address payable mainWorldOwner;
    address public contractAddress = address(this);
    address[] allOwner;
    uint baseCooldownTime = 1 minutes;
    
    mapping (address => address) public userToWorldAddress;
    mapping (address => uint) addressToHouseCount;
    mapping (uint =>address) houseIdToAddress;
    
    modifier onlyMainWorldOwner {
        require(msg.sender == mainWorldOwner);
        _;
    }
    
    // house attribute
    struct House {
        string name;
        uint level;
        uint readyTime;
    }
    
    House[] houses;
    
    constructor() public{
        mainWorldOwner = msg.sender;
        numberOfWorld = 0;
    }
    
    // the enquiry funciton is as follow 
    // ###################################################################################################//
    function getMainWorldOwner() public view returns (address) {
        return mainWorldOwner;
    }
    function getHouseInformation(uint houseId) public view returns (string memory name, uint level, uint readyTime) {
        name = houses[houseId].name;
        level = houses[houseId].level;
        readyTime = houses[houseId].readyTime;
    }
    function getWorldNumber() public view returns (uint) {
        return numberOfWorld;
    }
    function getHouseNumber() public view returns (uint) {
        return houses.length;
    }
    function getAllOwner() public view returns (address[] memory) {
        return allOwner;
    }
    function getUserToWorldAddress(address userAddress) public view returns (address) {
        return userToWorldAddress[userAddress];
    }
    function getWorldAddressToWorldName(address worldAddress) public view returns (string memory) {
        return worldAddressToWorldName[worldAddress];
    }
    function getAddressToHouseCount(address addr) public view returns (uint) {
        return addressToHouseCount[addr];
    }
    // look up the house level according to house id
    function houseLevel(uint id) external view returns (uint) {
        return houses[id].level;
    }
    // ##################################################################################################//
    
    // register a new world (and automatically buy a new house) to the new user
    function createHouseAndWorld(string memory worldName, string memory houseName, address worldAddress) public payable {
        require(userToWorldAddress[msg.sender] == address(0));
        require(worldNameToWorldAddress[worldName] == address(0));
        require(msg.value == 0.1 ether);
        
        //create a new house for user
        uint id = houses.push(House(houseName, 1, uint32(now + baseCooldownTime))) - 1;
        houseIdToAddress[id] = msg.sender;
        addressToHouseCount[msg.sender] = addressToHouseCount[msg.sender] + 1;
        allOwner.push(msg.sender);
        
        //create a new world for user
        worldAddressToWorldName[worldAddress] = worldName;
        worldNameToWorldAddress[worldName] = worldAddress;
        userToWorldAddress[msg.sender] = worldAddress;
        numberOfWorld++;
    }
    
    // let user purchase a new house 
    function purchaseHouse(string memory houseName) public payable {
        require(msg.value == 0.1 ether);
        
        //create a house for user
        uint id = houses.push(House(houseName, 1, uint(now + baseCooldownTime))) - 1;
        houseIdToAddress[id] = msg.sender;
        addressToHouseCount[msg.sender] = addressToHouseCount[msg.sender] + 1;
    }
    
    // level up a house for user
    function levelUpHouse(uint houseId) public payable {
        require(houseIdToAddress[houseId] == msg.sender);
        require(houses[houseId].readyTime <= now);
        
        // calculate fee for level-up
        uint curHouseLevel = houses[houseId].level;
        uint levelUpFee = curHouseLevel * 0.1 ether;
        uint cooldownTime = curHouseLevel * baseCooldownTime;
        require(msg.value == levelUpFee);
        
        
        houses[houseId].level = houses[houseId].level + 1;
        houses[houseId].readyTime = uint(now + cooldownTime);
    }
    
    // when house level is up to 2, user can change name
    function changeHouseName(uint houseId, string memory newHouseName) public {
        require(houseIdToAddress[houseId] == msg.sender);
        require(houses[houseId].level >= 2);
        
        houses[houseId].name = newHouseName;
    }
    
    //look up the user's house ownership
    function userHouseOwnership(address owner) external view returns(uint[] memory) {
        uint[] memory result = new uint[](addressToHouseCount[owner]);
        uint counter = 0;
        for (uint i = 0; i < houses.length; i++) {
            if (houseIdToAddress[i] == owner) {
            result[counter] = i;
            counter++;
            }
        }
        return result;
    }
    
    // contract creater can withdraw money paid from users from contract 
    function withdraw() external onlyMainWorldOwner{
        mainWorldOwner.transfer(address(this).balance);
    }
    
    // exchange ERC721(houses) from one to another (ownership change)
    // CLAIMMING: the exchange following will obey the ERC721 protocal standard,
    // which have 4 functions of : (balanceOf, ownerOf, transferFrom, approve) 
    mapping (uint => address) houseApprovals;

    function balanceOf(address _owner) external view returns (uint256) {
        return addressToHouseCount[_owner];
    }
    
    function ownerOf(uint _tokenId) external view returns (address) {
        return houseIdToAddress[_tokenId];
    }
    
    function _transfer(address _to, uint _tokenId) private {
        addressToHouseCount[_to] = addressToHouseCount[_to] + 1;
        addressToHouseCount[msg.sender] = addressToHouseCount[msg.sender] - 1;
        houseIdToAddress[_tokenId] = _to;
    }
    
    function transferTo(address _to, uint _tokenId) external payable {
        require (houseIdToAddress[_tokenId] == msg.sender || houseApprovals[_tokenId] == msg.sender);
        _transfer(_to, _tokenId);
    }
    
    function approve(address _approved, uint _tokenId) external payable  {
        require(msg.sender == houseIdToAddress[_tokenId]);
        houseApprovals[_tokenId] = _approved;
    }
    
    //fallback function
    function() external payable {} 
}
