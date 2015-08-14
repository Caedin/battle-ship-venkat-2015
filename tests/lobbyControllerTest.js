describe('lobbyControllerTests', function()
{
	var controller;
	var window;
	var scope;
	
	beforeEach(module('BattleShipApp'));
	beforeEach(inject(function($controller, $rootScope, $window)
	{
		window = $window;
		scope = $rootScope.$new();
		controller = $controller('LobbyController', {
			$scope: scope
		});
	})); 
	
	it('canary should pass', function()
	{
		expect(true).equals(true);
	});
	
	it('login should update userName on success', function()
	{
		controller.potentialUserName = 'tester';
		controller.login('success');
		expect(controller.userName).equals('tester');
	});
	
	it('login should update error on failure', function()
	{
		controller.potentialUserName = 'tester';
		controller.login('error');
		expect(controller.loginError).equals('Username already in use');
	});
	
	it('queryLogin should emit a login event', function()
	{
		var called = false;
		controller.potentialUserName = 'aName';
		controller.socket.emit = function()
		{
			called = true;
		}
		controller.queryLogin();
		expect(called).equals(true);
	});
	
	it('queryLogin should not emit an event if a user is logged in', function()
	{
		var called = false;
		controller.socket.emit = function()
		{
			called = true;
		}
		controller.userName = 'not null';
		controller.queryLogin();
		expect(called).equals(false);
	});
	
	it('updateLobby should update the lobby list', function()
	{
		controller.userName = 'wilma';
		var players = ['joe', 'allen', 'fred'];
		controller.updateLobby(JSON.stringify(players));
		expect(controller.lobbyList).to.deep.eql(players);
	});
	
	it('issueChallenge should emit a challengeRequest with the player name', function()
	{
		var player = 'joe';
		var success = false;
		controller.socket.emit = function(event, message)
		{
			if(event === 'challengeRequest')
				if(message === 'joe')
					success = true;
		}
		controller.issueChallenge(player);
		expect(success).equals(true);
	});
	
	it('receiveChallenge should update challengingPlayer', function()
	{
		controller.challengingPlayer = '';
		controller.receiveChallenge('joe');
		expect(controller.challengingPlayer).equals('joe');
	});
	
	it('declineChallenge should clear challengingPlayer', function()
	{
		controller.challengingPlayer = 'joe';
		controller.declineChallenge();
		expect(controller.challengingPlayer).equals('');
	});
	
	it('acceptChallenge should emit a startMatch with both palyer names', function()
	{
		controller.challengingPlayer = 'joe';
		controller.userName = 'bob';
		
		var success = false;
		controller.socket.emit = function(event, message)
		{
			if(event === 'startMatch')
			{
				if(message.player1 == 'bob' && message.player2 =='joe')
					success = true;
			}
		}
		controller.acceptChallenge();
		expect(success).equals(true);
	});
	
	it('newGame should set game mode to init', function()
	{
		controller.gameMode = 'mock';
		controller.newGame();
		expect(controller.gameMode).equals('init');
	});
	
	it('newGame should call createGameBoard', function()
	{
		var called = false;
		controller.createGameBoard = function()
		{
			called = true;
		}
		controller.newGame();
		expect(called).equals(true);
	});
	
	it('updateLobby should not include current user', function()
	{
		controller.userName = 'wilma';
		var players = ['joe', 'allen', 'fred', 'wilma'];
		var players2 = ['joe', 'allen', 'fred'];
		controller.updateLobby(JSON.stringify(players));
		expect(controller.lobbyList).to.deep.eql(players2);
	});
	
	it('victory should set game mode to victory', function()
	{
		controller.gameMode = 'default';
		controller.victory();
		expect(controller.gameMode).equals('victory');
	});
	
	it('nextRound should set status to "Choose a target"', function()
	{
		controller.gameStatus = 'default';
		controller.nextRound();
		expect(controller.gameStatus).equals('Choose a target');
	});
	
	it('nextRound should set shotFiredThisTurn to false', function()
	{
		controller.shotFiredThisTurn = true;
		controller.nextRound();
		expect(controller.shotFiredThisTurn).equals(false);
	});
	
	it('nextRound should call resetShotTarget', function()
	{
		var called = false;
		controller.resetShotTarget = function()
		{
			called = true;
		}
		
		controller.nextRound();
		expect(called).equals(true);
	});
	
	it('resetShotTarget should clear all cells of type shootTarget', function()
	{
		controller.createGameBoard();
		controller.enemyGameBoard[2][6].type = 'shootTarget';
		controller.resetShotTarget();
		expect(controller.enemyGameBoard[2][6].type).equals('watertile');
	});
	
	it('fireButton should set gameStatus to "Waiting for opponent..."', function()
	{
		controller.gameStatus = '';
		controller.socket.emit = function() { return true; }
		controller.fireButton();
		expect(controller.gameStatus).equals("Waiting for opponent...");
	});
	
	it('fireButton should emit a shootCell event', function()
	{
		controller.shootTargetCellId = 35;
		var called = false;
		controller.socket.emit = function(event, data) 
		{ 
			if(event == 'shootCell')
				if(data == 35)
					called = true;
		}
		controller.fireButton();
		expect(called).equals(true);
	});
	
	
	
	it('shootCell should return false if a shot was already made.', function()
	{
		controller.shotFiredThisTurn = true;
		expect(controller.shootCell()).equals(false);
	});
	
	it('shootCell should return true if a shot was not already made.', function()
	{
		controller.gameMode = 'play';
		controller.shotFiredThisTurn = false;
		var cell = { type: 'a string'};
		expect(controller.shootCell(cell)).equals(true);
	});
	
	it('shootCell should return false if not in gameMode play', function()
	{
		controller.gameMode = 'init';
		controller.shotFiredThisTurn = false;
		var cell = { type: 'a string'};
		expect(controller.shootCell(cell)).equals(false);
	});
	
	it('shootCell should update cell type to shootTarget', function()
	{
		controller.gameMode = 'play';
		controller.shotFiredThisTurn = false;
		var cell = { type: 'a string'};
		controller.shootCell(cell);
		expect(cell.type).equals('shootTarget');
	});
	it('shootCell should update game status to ready to fire', function()
	{
		controller.gameMode = 'play';
		controller.shotFiredThisTurn = false;
		var cell = { type: 'a string'};
		controller.shootCell(cell);
		expect(controller.gameStatus).equals('Ready to fire');
	});
	it('shootCell should update shootTargetCellId to cell.index', function()
	{
		controller.shotFiredThisTurn = false;
		controller.gameMode = 'play';
		var cell = { type: 'a string', index: 1};
		controller.shootCell(cell);
		expect(controller.shootTargetCellId).equals(1);
	});
	
	it('sinkShip should decrease number of ships by 1', function()
	{
		var cell = { type: 'a string', index: 1};
		controller.numShips = 2;
		controller.sinkShip(cell);
		expect(controller.numShips).equals(1);
	});
	it('sinkShip should set cell type to shipwreck', function()
	{
		var cell = { type: 'a string', index: 1};
		controller.numShips = 2;
		controller.sinkShip(cell);
		expect(cell.type).equals('shipwreck');
	});
	it('sinkShip should set game mode to defeat if it is the last ship', function()
	{
		var cell = { type: 'a string', index: 1};
		controller.numShips = 1;
		controller.sinkShip(cell);
		expect(controller.gameMode).equals('defeat');
	});
	
	it('placeShip should increment number of ships', function()
	{
		var cell = { type: 'a string', index: 1};
		controller.gameMode = 'init';
		controller.numShips = 1;
		controller.placeShip(cell);
		expect(controller.numShips).equals(2);
	});
	it('placeShip should not increment number of ships if not in "init" mode', function()
	{
		var cell = { type: 'a string', index: 1};
		controller.gameMode = 'notInit';
		controller.numShips = 1;
		controller.placeShip(cell);
		expect(controller.numShips).equals(1);
	});
	it('placeShip should not increment number of ships over 5', function()
	{
		var cell = { type: 'a string', index: 1};
		controller.gameMode = 'init';
		controller.numShips = 5;
		controller.placeShip(cell);
		expect(controller.numShips).equals(5);
	});
	it('placeShip should set mode to play if this is last ship to be placed', function()
	{
		var cell = { type: 'a string', index: 1};
		controller.gameMode = 'init';
		controller.numShips = 4;
		controller.placeShip(cell);
		expect(controller.gameMode).equals('play');
	});
	it('placeShip should set status if this is last ship to be placed', function()
	{
		var cell = { type: 'a string', index: 1};
		controller.gameMode = 'init';
		controller.numShips = 4;
		controller.placeShip(cell);
		expect(controller.gameStatus).equals('Choose a target square');
	});
	it('placeShip should not set status if target is already picked', function()
	{
		var cell = { type: 'a string', index: 1};
		controller.gameStatus = 'mockStatus';
		controller.shootTargetCellId = 5;
		controller.gameMode = 'init';
		controller.numShips = 4;
		controller.placeShip(cell);
		expect(controller.gameStatus).equals('mockStatus');
	});
	
	it('checkHit should destroy a ship if it is hit', function()
	{
		controller.gameMode = 'play';
		controller.createGameBoard();
		controller.numShips = 2;
		controller.gameBoard[3][5].type = 'ship';
		controller.checkHit(35);
		expect(controller.gameBoard[3][5].type).equals('shipwreck');
		expect(controller.numShips).equals(1);
	});
	
	it('checkHit should emit a sankShip if a hit occurs', function()
	{
		var called = false;
		controller.socket.emit = function(event, message)
		{
			if (event === 'sankShip')	called = true;
		}
		controller.gameMode = 'play';
		controller.createGameBoard();
		controller.numShips = 2;
		controller.gameBoard[3][5].type = 'ship';
		controller.checkHit(35);
		expect(called).equals(true);
	});
	
	it('checkHit should emit a missedShip if it a miss occurs', function()
	{
		var called = false;
		controller.socket.emit = function(event, message)
		{
			if (event === 'missedShip')	called = true;
		}
		controller.gameMode = 'play';
		controller.createGameBoard();
		controller.numShips = 2;
		controller.gameBoard[3][5].type = 'ship';
		controller.checkHit(33);
		expect(called).equals(true);
	});
	
	it('checkHit update hitQueue if game mode is not in play yet', function()
	{
		controller.gameMode = 'test';
		controller.checkHit(5);
		expect(controller.hitQueue).equals(5);
	});
	
	it('place ship should call checkHit if hitQueue is not -1', function()
	{
		var called = false;
		controller.checkHit = function() { called = true; }
		controller.gameMode = 'init';
		controller.hitQueue = 5;
		controller.numShips = 4;
		controller.placeShip(13);
		expect(called).equals(true);
	});
	
	it('nextRound should call checkVictoryStatus', function()
	{
		var called = false;
		controller.checkVictoryStatus = function()
		{
			called = true;
		}
		controller.createGameBoard();
		controller.nextRound();
		expect(called).equals(true);
	});
	
	it('checkVictoryStatus should emit defeat if numShips == 0', function()
	{
		var called = false;
		controller.socket.emit = function(event)
		{
			if (event === 'defeat')	called = true;
		}
		controller.createGameBoard();
		controller.numShips = 0;
		controller.checkVictoryStatus();
		expect(called).equals(true);
	});
	
	it('checkVictoryStatus should do nothing if ships >= 0', function()
	{
		var called = false;
		controller.socket.emit = function(event)
		{
			if (event === 'defeat')	called = true;
		}
		controller.createGameBoard();
		controller.numShips = 1;
		controller.checkVictoryStatus();
		expect(called).equals(false);
	});
	
	it('updateEnemyBoard should set the recieved index to a shipwreck', function()
	{
		controller.createGameBoard();
		controller.updateEnemyBoard(25);
		expect(controller.enemyGameBoard[2][5].type).equals('shipwreck');
	});
	
	it('defeat should change the game mode to defeat', function()
	{
		controller.gameMode = 'test';
		controller.defeat();
		expect(controller.gameMode).equals('defeat');
	});
	
	it('missedShip should set the recieved index to a missedShot', function()
	{
		controller.createGameBoard();
		controller.missedShip(25);
		expect(controller.enemyGameBoard[2][5].type).equals('missedShot');
	});
	
	it('DOM tests', function()
	{
		controller.showGameBoard();
		controller.showChallenge();
		controller.showVictory();
		controller.showLobby();
		controller.showDefeat();
	});
	
	it('clearChallengeMessage should clear the challenge message', function()
	{
		controller.challengeResponse = 'test';
		controller.clearChallengeMessage();
		expect(controller.challengeResponse).equals('');
	});
	
	it('victory should return false if already defeated', function()
	{
		controller.gameMode = 'defeat';
		expect(controller.victory()).equals(false);
	});
});