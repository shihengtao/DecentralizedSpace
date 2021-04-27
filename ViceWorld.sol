pragma solidity ^0.5.0;


contract MainWorldInterface {
  function userHouseOwnership(address owner) external view returns(uint[] memory result);
  function houseLevel(uint id) external view returns (uint);
  function transferTo(address _to, uint256 _tokenId) external payable;
  function ownerOf(uint _tokenId) external view returns (address);
}


contract ViceWorld{
    MainWorldInterface mainContract = MainWorldInterface(address(0xAD154Ee78C571BF6178C3e5d4ca1381ea630848C));
    
    // calculate the release count that the user is allowed
    // if the allowCount < numberOfJournals, the user is not allowed to release journals
    // each time the contract's house ownership change, the allowCount would refresh 
    function _calculateReleaseCountAllow() private view returns (uint) {
        uint allowCount = 0;
        address contractAddress = address(this);
        uint[] memory result = mainContract.userHouseOwnership(contractAddress);
        for (uint i=0; i<result.length; i++) {
            allowCount = allowCount + 2 ** mainContract.houseLevel(result[i]);
        }
        return allowCount;
    }
    
    uint allowReleaseCount;
    
    struct Journal {
        uint timestamp;
        string journalTitle;
        string journalContent;
    }
    
    mapping (uint => Journal) public journals;
    
    uint numberOfJournals;
    
    address payable viceWorldOwner;
    
    modifier onlyViceWorldOwner {
        require(msg.sender == viceWorldOwner);
        _;
    }
    
    constructor() payable public{
        viceWorldOwner = msg.sender;
        numberOfJournals = 0;
        allowReleaseCount = _calculateReleaseCountAllow();
    }
    
    function getNumberOfJournals() public view returns(uint) {
        return numberOfJournals;
    }
    
    // release a new journal
    function releaseJournal(string memory journalTitle, string memory journalContent) public onlyViceWorldOwner {
        allowReleaseCount = _calculateReleaseCountAllow();
        require(numberOfJournals < allowReleaseCount);
        journals[numberOfJournals].timestamp = now;
        journals[numberOfJournals].journalTitle = journalTitle;
        journals[numberOfJournals].journalContent = journalContent;
        numberOfJournals++;
    }
    
    // look up journals according to journal id
    function getJournal(uint journalId) view public returns (uint timestamp, string memory journalTitle, string memory journalContent) {
        timestamp = journals[journalId].timestamp;
        journalTitle = journals[journalId].journalTitle;
        journalContent = journals[journalId].journalContent;
    }
    
    // withdraw thedeposited house from the contract
    function withdrawHouse(uint houseId) public onlyViceWorldOwner {
        require(mainContract.ownerOf(houseId) == address(this));
        mainContract.transferTo(msg.sender, houseId);
        allowReleaseCount = _calculateReleaseCountAllow();
    }
    
    
    //fallback function
    function() external payable {} 
    
}
