var mainWorldContract;
var myWorldContract;
var accounts;
var mainWorldOwner;
var mainWorldBalance;
var owners;

async function updateMainWorldMoney(){
    mainWorldBalance = await web3.eth.getBalance(mainWorldAddress);
    $("#mainWorldMoney").html((mainWorldBalance * 10**(-18)).toFixed(4) + "ETH")
}

async function initialMainWorld(){
    mainWorldContract = new web3.eth.Contract(mainWorldABI, mainWorldAddress);
    mainWorldOwner = await mainWorldContract.methods.getMainWorldOwner().call();
    accounts = await web3.eth.getAccounts();

    // enquire main world information
    await updateMainWorldMoney();
    $("#mainWorldAddress").html(mainWorldContract.options.address);
    var result = await mainWorldContract.methods.getWorldNumber().call();
    $("#totalViceWorldCount").html(result);
    result = await mainWorldContract.methods.getHouseNumber().call();
    $("#totalHouseCount").html(result);
    
    //enquire vice world information
    owners = await mainWorldContract.methods.getAllOwner().call();
    $("#viceWorldInformation").html("");
    for (var i=0; i<owners.length; i++) {
        var userAddress = owners[i]
        var worldAddress = await mainWorldContract.methods.getUserToWorldAddress(userAddress).call();
        var worldName = await mainWorldContract.methods.getWorldAddressToWorldName(worldAddress).call();
        var houseCount = await mainWorldContract.methods.getAddressToHouseCount(worldAddress).call();
        $("#viceWorldInformation").append("<tr><td>" + userAddress + "</td><td>" + worldAddress + "</td><td onclick='openViceWorld(" + i + ")'>" + worldName + "</td><td>" + houseCount + "</td></tr>");
    }
}

async function initialViceWorld() {
    var myWorldAddress = await mainWorldContract.methods.getUserToWorldAddress(accounts[0]).call();
    $("#myWorldAddress").html(myWorldAddress);
    $("#myOwnerAddress").html(accounts[0]);
    var myWorldName = await mainWorldContract.methods.getWorldAddressToWorldName(myWorldAddress).call();
    $("#myWorldName").html(myWorldName + "的世界");

    myWorldContract = new web3.eth.Contract(viceWorldABI, myWorldAddress);

    var haveReleaseCount = await myWorldContract.methods.getNumberOfJournals().call();
    $("#haveReleaseCount").html(haveReleaseCount);

    // calculate can release count
    var houseList = await mainWorldContract.methods.userHouseOwnership(myWorldAddress).call();
    var releaseCount = 0;

    // enquire the vice world's house ownership
    $("#houseInformation_flip").html("");
    for (var i=0; i<houseList.length; i++) {
        var temp = await mainWorldContract.methods.getHouseInformation(houseList[i]).call();
        releaseCount = releaseCount + 2 ** temp[1];
        $("#houseInformation_flip").append("<tr><td>" + houseList[i] + "</td><td>" + temp[0] + "</td><td>" + temp[1] + "</td><td>" + new Date(Number(temp[2]*1000)) + "</td></tr>");
    }
    $("#canReleaseCount").html(releaseCount);

    // enquire the released article
    $("#myReleaseList").html("");
    for (var i=0; i<haveReleaseCount; i++) {
        var j = haveReleaseCount-i-1;
        var journal = await myWorldContract.methods.getJournal(j).call();
        $("#myReleaseList").append("<tr><td onclick='releasedContentBtn(" + j + ")'>" + j + "</td><td onclick='releasedContentBtn(" + j + ")'>" + journal[1] + "</td><td onclick='releasedContentBtn(" + j + ")'>" + new Date(Number(journal[0]*1000)) + "</td></tr>");
    }
}

async function getWeb3(){
    if (typeof web3 !== 'undefined') {
        web3 = new Web3(web3.currentProvider);
        await ethereum.enable();
        console.log("successful connection in web3!");
        
    } else {
        console.log("failed in connecting web3!");
    }
}

async function deployViceWorld() {
    viceWorldName = $("#inputViceWorldName").val();
    houseName = $("#inputFirstHouseName").val();

    var createdAddress;
    var contract_abi = viceWorldABI;
    var contract = new web3.eth.Contract(contract_abi);
    var contract_bytecode = viceWorldByteCode.object;
    var contract = contract.deploy({
        data: contract_bytecode,
        arguments: []
    })
    const createdContract = await contract.send({
        from: accounts[0],gas: 4700000,gasPrice: '1000000000'
    })

    var temp = await mainWorldContract.methods.createHouseAndWorld(viceWorldName, houseName, createdContract.options.address)
        .send({from: accounts[0], value: '100000000000000000', gas: 4700000})

    $("#userAddress").html(accounts[0]);
    $("#worldName").html(viceWorldName);
    $("#worldAddress").html(createdContract.options.address);
}

async function getHousesInformation() {
    var houseId = $("#inputHouseId_lookUpHouseInformation").val();
    var result = await mainWorldContract.methods.getHouseInformation(houseId).call();
    var ownerOf = await mainWorldContract.methods.ownerOf(houseId).call();

    $("#houseName_lookUpHouseInformation").html(result.name);
    $("#houseLevel_lookUpHouseInformation").html(result.level);
    $("#houseOwnerAddress_lookUpHouseInformation").html(ownerOf);
}

async function getHousesOwnership() {
    var inputAddress = $("#inputOwnerAddress_lookUpHouseOwnership").val();
    var result = await mainWorldContract.methods.userHouseOwnership(inputAddress).call();
    $("#houseOwnershipId_lookUpHouseOwnership").text(result);
}

async function purchaseNewHouse() {
    var houseName = $("#inputNewHouseName").val();
    var result = await mainWorldContract.methods.purchaseHouse(houseName)
        .send({from:accounts[0], value: '100000000000000000'});
    var result2 = await mainWorldContract.methods.getHouseNumber().call();
    $("#totalHouseCount").html(result2);
}

async function levelUpHouse() {
    var houseId = $("#inputHouseId_levelUp").val();
    var houseLevel = await mainWorldContract.methods.houseLevel(houseId).call();
    var price = 100000000000000000 * houseLevel;
    await mainWorldContract.methods.levelUpHouse(houseId)
        .send({from:accounts[0], value: String(price)});
}

async function transferHouse() {
    var toAddress = $("#inputToHouseAddress").val();
    var houseId = $("#inputHouseId_transferHouse").val();
    await mainWorldContract.methods.transferTo(toAddress, houseId).send({from: accounts[0]});
}

async function withdrawHouse() {
    var houseId = $("#inputHouseId_withdrawHouse").val();
    await myWorldContract.methods.withdrawHouse(houseId).send({from: accounts[0]});
}

async function releaseInformation() {
    var releaseTitle = $("#releaseTitle").val();
    var releaseContent = $("#releaseContent").val();
    await myWorldContract.methods.releaseJournal(releaseTitle, releaseContent).send({from: accounts[0]});
}

async function retrieveMoney() {
    await mainWorldContract.methods.withdraw().send({from: accounts[0]});
    mainWorldBalance = await web3.eth.getBalance(mainWorldAddress);
    $("#mainWorldMoney").html((mainWorldBalance * 10**(-18)).toFixed(4) + "ETH");
}


async function openViceWorld(j) {
    var userAddress = owners[j];
    var viceWorldAddress = await mainWorldContract.methods.getUserToWorldAddress(userAddress).call();
    var viceWorldName = await mainWorldContract.methods.getWorldAddressToWorldName(viceWorldAddress).call();
    $("#getViceWorldName").html(viceWorldName+"的空间");

    var viceWorldContract = new web3.eth.Contract(viceWorldABI, viceWorldAddress);
    var haveReleaseCount = await viceWorldContract.methods.getNumberOfJournals().call();
    // enquire the vice world's released article
    $("#viceWorldReleaseList").html('');
    for (var i=0; i<haveReleaseCount; i++) {
        var k = haveReleaseCount-i-1;
        var journal = await viceWorldContract.methods.getJournal(k).call();
        $("#viceWorldReleaseList").append("<tr><td onclick='enquireViceWorldContentBtn(" + j + "," + k + ")'>" + k + "</td><td onclick='enquireViceWorldContentBtn(" + j + "," + k + ")'>" + journal[1] + "</td><td onclick='enquireViceWorldContentBtn(" + j + "," + k + ")'>" + new Date(Number(journal[0]*1000)) + "</td></tr>");
    }
    $('#openViceWorldLink').tab('show');
}

async function enquireViceWorldContentBtn(j, k){
    var userAddress = owners[j]
    var viceWorldAddress = await mainWorldContract.methods.getUserToWorldAddress(userAddress).call();
    var viceWorldContract = new web3.eth.Contract(viceWorldABI, viceWorldAddress);
    
    var journal = await viceWorldContract.methods.getJournal(k).call();
    $("#enquireReleaseTitle_viceWorld").html(journal[1]);
    $("#enquireReleaseContent_viceWorld").html(journal[2]);
    $('#viceWorldArticleContentLink').tab('show');
}

async function releasedContentBtn(j) {
    var journal = await myWorldContract.methods.getJournal(j).call();
    $("#enquireReleaseContent").html(journal[2]);
    $("#enquireReleaseTitle").html(journal[1]);
    $('#articleContentLink').tab('show');
}

window.onload = async() => {
    await getWeb3();
    await initialMainWorld();
    initialViceWorld();

    $("#lookUpHouseInformationBtn").click(function() {
        getHousesInformation();
    })

    $("#lookUpHouseOwnershipBtn").click(function() {
        getHousesOwnership();
    })

    $("#createViceWorldBtn").click(async() => {
        await deployViceWorld();
        await initialMainWorld();
        initialViceWorld();
    });

    $("#purchaseHouseBtn").click(async() =>{
        await purchaseNewHouse();
        updateMainWorldMoney();
    })

    $("#levelUpBtn").click(async() =>{
        await levelUpHouse();
        updateMainWorldMoney();
    })

    $("#transferHouseBtn").click(async() => {
        await transferHouse();
        await initialMainWorld();
        initialViceWorld();
    })

    $("#withdrawHouseBtn").click(async() =>{
        await withdrawHouse();
        await initialMainWorld();
        initialViceWorld();
    })


    $("#flip").click(function(){
        $("#panel").slideToggle("fast");
    });

    $("#releaseBtn").click(async() => {
        await releaseInformation();
        initialViceWorld();
    });

    $("#mainWorldManagerBtn").click(function(){
        if (mainWorldOwner==accounts[0]){
            $('#mainWorldManagerLink').tab('show');
        }else {
            alert("对不起，你不是管理员");
        }
    });

    $("#retrieveMoneyBtn").click(function(){
        retrieveMoney();
    });
}
