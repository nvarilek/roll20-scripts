//Testing API stuff

const FearDeckTracker = (() => {

    /*
        TODO:
        v0.1
        commands to gain/use more fear? - message or not to message
        update and get on GitHub

        v0.x...
        Deal with multiple GMs? command to find and set gmId? just loop thru mult gms?
        Limit Fear to 12 by default
        command to change Fear Limit
        command to set exact Fear amount
        command to change artwork?

    */

    const scriptName = "FearDeckTracker";
    const commandScriptName = "fdt";
    const version = "0.1";

    const commands = [
        {command: "allObj", info: "!fdt --allObj - logs all objects"},
        {command: "help", info: "!fdt --help - sends all commands to chat and shows additional info"},,
        {command: "gain", info: "!fdt --gain - gain 1 fear"},
        {command: "use", info: "!fdt --use - use 1 fear"},
        {command: "setup", info: "!fdt --setup - Rerun setup (use if issue with tracker)"},
    ];
    const gmLockedCommands = true;

    var gmId = ''; //dynamically set during setupFearDeckTracker
    var cardId = ''; //dynamically set during setupFearDeckTracker

    const checkInstall = function() {
        log("**NVScripts: " + scriptName + " v" + version + " initialized**");
    }

    const setupFearDeckTracker = function() {

        //check for Fear Deck and create if not exists, including 1 infinite card.
        var deck = findObjs({type: "deck",name: "Fear"});
        log(deck);
        if(deck === undefined || deck.length === 0) {
            log("No Fear Deck Found, Creating Fear Deck.");
            deck = createObj('deck', {
                name: 'Fear',
                showplayers: true,
                playerscandraw: false,
                avatar: 'https://files.d20.io/images/452520225/hZOf6LZ3a7vwIVkHFKJ48Q/med.jpg?1755120110',
                shown: false,
                players_seenumcards: true,
                players_seefrontofcards: true,
                gm_seenumcards: true,
                gm_seefrontofcards: true,
                infinitecards: true,
                cardsplayed: "faceup",
                defaultheight: "100",
                defaultwidth: "100",
                showhands: true,
                infinitecardstype: "random",
                show_tooltips: false,
            });
            log(deck);
        }

        //create FearToken Card and put in fear deck based on new id
        var card = findObjs({type: "card", name: 'FearToken'});
        log(card);
        if(card === undefined || card.length === 0) {
            card = createObj('card', {
                name: 'FearToken',
                avatar: "https://files.d20.io/images/452520207/qAadA2X_ppGIWSGgSJDXbg/med.jpg?1755120101",
                _deckid: deck.id
            });
            log(card);
            cardId = card.id;
        } else if (card.length !== undefined && card.length > 0) {
            cardId = card[0].id;
            log(cardId);
        }

        //Get GM ID - this will be made better later
        let  players=findObjs({_type:'player'});
        log(players);
        if(players !== undefined && players.length > 0){
            // players.forEach(function(value,key,map){
            //     if(playerIsGM(value.id)){
            //         gmId = value.id;
                    // log("found gmId: " + value.id);
            //     }
            // });
            players.some(player => {
                if(playerIsGM(player.id)) {
                    gmId = player.id;
                    log("Found gmId: " + player.id);
                    return;
                }
            });
        }


        //check for and create macros
        /*
            Need to get gmPlayerId -Might need to just get all players and check isPlayerGM... but what if multiple gms? do it for each gm?
            check for macros
            if no macros, create the macros
        */
        var macroGain = findObjs({type: "macro", name: 'Gain-Fear'});
        log(macroGain);
        if(macroGain === undefined || macroGain.length === 0) {
            macroGain = createObj('macro', {
                name: "Gain-Fear",
                action:"!fdt --gain",
                istokenaction: false,
                visibleto: "",
                _playerid: gmId
            });
            log(macroGain);
        }

        var macroUse = findObjs({type: "macro", name: 'Use-Fear'});
        log(macroUse);
        if(macroUse === undefined || macroUse.length === 0) {
            macroUse = createObj('macro', {
                name: "Use-Fear",
                action:"!fdt --use",
                istokenaction: false,
                visibleto: "",
                _playerid: gmId
            });
            log(macroUse);
        }

    }

    // whoDat = getObj('player',msg.playerid).get('_displayname'); //Who sent message // playerIsGM(msg.playerid)
    const handleInput = function(msg) {
        if (msg.type !== 'api') return;
        //TODO parameterize/split msg, maybe locks per command
        if(gmLockedCommands && !playerIsGM(msg.playerid)) {
            sendChat(scriptName, "Permission not granted"); 
            return;
        }
        try {
            if(msg.content.indexOf("!"+commandScriptName) === 0 ) {
                //Parameterize Time?

                if(msg.content.includes("--gain")) {
                    //draw 1 cards to gm
                    gainFear();
                }
                else if(msg.content.includes("--use")) {
                    //take 1 cards from gm
                    useFear();
                } 
                else if(msg.content.includes("--setup")) {
                    //force run fear deck tracker setup
                    setupFearDeckTracker();
                    //success metric and sendChat?
                } 
                else if(msg.content.includes("--allObj")) {
                    let allObj = getAllObjs();
                    allObj.forEach(function(value,key,map) {
                        log(value);
                    });
                    sendChat(scriptName, "Objs logged");
                } else {
                    //Didnt hit a Test1 command - display possible commands
                    commandsString = "";
                    commands.forEach(function(value,key,map){
                        commandsString += "\n--" + value.command + ": " + value.info;
                    })
                    // sendChat(scriptName,`This is ${scriptName}. Available Commands:` + commandsString);
                    sendChat(scriptName,`Available Commands:` + commandsString);

                    if(msg.content.includes("--help")){
                        sendChat(scriptName,"Additional Help Here");
                    }
                }

            } 
        }
        catch(err) {
          log(err.message);
        }
    };

    //add check for gmId valid?
    const gainFear = function(x = 1) {
        if(playerIsGM(gmId)) {
            for(let i = 0; i < x; i++) {
                giveCardToPlayer(cardId, gmId);
            }
            sendGainFearMessage(x);
        } else {
            sendChat(scriptName, "unable to perform command, gmId not set");
        }
    }

    const useFear = function(x = 1) {
        if(playerIsGM(gmId)) {
            for(let i = 0; i < x; i++) {
                takeCardFromPlayer(gmId);
            }
            sendUseFearMessage(x);
        } else {
            sendChat(scriptName, "unable to perform command, gmId not set");
        }
    }

    const sendGainFearMessage = function(x = 1) {
        sendChat("GM - ", `/em ${x} Fear was gained`);
    }

    const sendUseFearMessage = function(x = 1) {
        sendChat("GM - ", `/em ${x} Fear was used`);
    }

    const registerEventHandlers = function() {
        on('chat:message', handleInput);
    };

    on("ready", () => {
        checkInstall();
        setupFearDeckTracker();
        registerEventHandlers();
    });

})();

