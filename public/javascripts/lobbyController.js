BattleShipApp.controller('LobbyController', function($scope) 
{
	var controller = this;
	controller.socket = io();
	controller.userName = '';
	controller.potentialUserName = '';
	controller.loginError = '';
	controller.lobbyList = [];
	controller.challengingPlayer = '';
	controller.gameBoard = [];
	controller.enemyGameBoard = [];
	controller.numShips = 0;
	controller.numRounds = 1;
	controller.shootTargetCellId = '';
	controller.gameMode = 'not started';
	controller.shotFiredThisTurn = true;
	controller.gameStatus = 'Setting up game, please place your ships.';
	controller.hitQueue = -1;
	controller.challengeResponse = '';

	controller.createGameBoard = function()
	{
		var counter = 0;
		for(var i = 0; i<10; i++)
		{
			var row = [];
			for(var k = 0; k<10; k++)
			{
				var cell = 
				{
					index: counter++,
					type: 'watertile'
				}
				row.push(cell);
			}
			controller.gameBoard.push(row);
		}
		
		var counter = 0;
		for(var i = 0; i<10; i++)
		{
			var row = [];
			for(var k = 0; k<10; k++)
			{
				var cell = 
				{
					index: counter++,
					type: 'watertile'
				}
				row.push(cell);
			}
			controller.enemyGameBoard.push(row);
		}
		$scope.$apply();
	}
	
	controller.placeShip = function(cell)
	{
		if(controller.numShips < 5 && controller.gameMode == 'init')
		{
			controller.numShips++;
			cell.type = 'ship';
		}
		if(controller.numShips == 5)
		{
			controller.gameMode = 'play';
			if(controller.shootTargetCellId == '')
			{
				if(controller.shotFiredThisTurn == true)
					controller.gameStatus = "Waiting for opponent...";
				else if(controller.shotFiredThisTurn == false)
					controller.gameStatus = "Choose a target";
			}
			if(controller.hitQueue !== -1)
			{
				controller.checkHit(controller.hitQueue);
				controller.hitQueue = -1;
			}
		}
	}
	controller.sinkShip = function(cell)
	{
		controller.numShips--;
		cell.type = 'shipwreck';
		if(controller.numShips == 0)
		{
			controller.gameMode = 'defeat';
		}
	}
	
	controller.shootCell = function(cell)
	{
		if(controller.shotFiredThisTurn == false && controller.gameMode === 'play')
		{
			controller.removeAnyPreviousTarget();
			if($('#nextRoundButton').hasClass('declineButton') == true)
			{
				$('#nextRoundButton').prop('disabled', false);
				$('#nextRoundButton').toggleClass('acceptButton declineButton');
			}
			cell.type = 'shootTarget';
			controller.shootTargetCellId = cell.index;
			controller.gameStatus = 'Ready to fire';
			return true;
		}
		else return false;
	}
	
	controller.fireButton = function()
	{
		controller.shotFiredThisTurn = true;
		$('#nextRoundButton').prop('disabled', true);
		$('#nextRoundButton').toggleClass('declineButton acceptButton');
		controller.socket.emit('shootCell', controller.shootTargetCellId);
		controller.gameStatus = "Waiting for opponent...";
	}
	
	controller.resetShotTarget = function()
	{
		var resetCell = function(cell){
			if(cell.type == 'shootTarget') cell.type = 'watertile';
		}
		var resetRow = function(row){
			row.map(resetCell);
		}
			
		controller.enemyGameBoard.map(resetRow);
	}
	
	controller.nextRound = function()
	{
		controller.numRounds += 1;
		controller.checkVictoryStatus();
		controller.gameStatus = "Choose a target";
		controller.shotFiredThisTurn = false;
		controller.resetShotTarget();
		$scope.$apply();
	}
	
	controller.firstRound = function()
	{
		controller.shotFiredThisTurn = false;
	}
	
	controller.victory = function()
	{
		if(controller.gameMode == 'defeat') return false;
		controller.gameMode = 'victory';
		$('.gameControls').fadeOut(1000, controller.showVictory);
		$scope.$apply();
	}
	controller.defeat = function()
	{
		controller.gameMode = 'defeat';
		$('.gameControls').fadeOut(1000, controller.showDefeat);
		$scope.$apply();
	}
	
	controller.login = function(message)
	{
		if(message === 'success')
		{
			controller.userName = controller.potentialUserName;
			$('.login').fadeOut(1000, controller.showLobby);
		}
		else
		{
			controller.loginError = 'Username already in use';
			$scope.$apply();
		}
	};
	
	controller.queryLogin = function()
	{
		if(controller.userName === '' && controller.potentialUserName !== '')
			controller.socket.emit('login', controller.potentialUserName);
	};
	
	controller.updateLobby = function(playerList)
	{
		controller.lobbyList = JSON.parse(playerList);
		if(controller.lobbyList.indexOf(controller.userName) >= 0)
			controller.lobbyList.splice(controller.lobbyList.indexOf(controller.userName), 1);
		$scope.$apply();
	}
	
	controller.issueChallenge = function(player)
	{
		controller.challengingPlayer = player;
		controller.challengeResponse = 'Waiting for challenge response...';
		controller.socket.emit('challengeRequest', player);
	}
	
	controller.receiveChallenge = function(player)
	{
		if(controller.challengingPlayer === '')
		{
			controller.challengingPlayer = player;
			$('.lobby').fadeOut(500, controller.showChallenge);
			$scope.$apply();
		}
	}
	
	controller.declineChallenge = function()
	{
		$('.challenge').hide();
		$('.lobby').show()
		controller.challengingPlayer = '';
		controller.socket.emit('declinedChallenge');
	}
	
	controller.acceptChallenge = function()
	{
		var pair = {
			player1 : controller.userName,
			player2 : controller.challengingPlayer
		}
		controller.socket.emit('startMatch', pair);
		$('.challenge').hide();
	}
	
	controller.newGame = function()
	{
		controller.gameMode = 'init';
		controller.createGameBoard();
		$('.lobby').fadeOut(500, controller.showGameBoard);
	}
	
	controller.checkHit = function(index)
	{
		if(controller.gameMode !== 'play')
		{
			controller.hitQueue = index;
			return;
		}
		
		var count = 0;
		for(var row in controller.gameBoard)
			for(var cell in controller.gameBoard[row])
			{
				if (count === index)
				{
					if(controller.gameBoard[row][cell].type == 'ship')
					{
						controller.gameBoard[row][cell].type = 'shipwreck';
						controller.numShips--;
						controller.socket.emit('sankShip', index);
						$scope.$apply();
					}
					else if(controller.gameBoard[row][cell].type == 'watertile')
					{
						controller.gameBoard[row][cell].type = 'missedShot';
						controller.socket.emit('missedShip', index);
						$scope.$apply();
					}
				}
				count += 1;
			}
	}
	
	controller.checkVictoryStatus = function()
	{
		if(controller.numShips == 0)
		{
			controller.socket.emit('defeat');
		}
	}
	
	controller.updateEnemyBoard = function(index, type)
	{
		var count = 0;
		for(var row in controller.enemyGameBoard)
			for(var cell in controller.enemyGameBoard[row])
			{
				if (count === index)
				{
					controller.enemyGameBoard[row][cell].type = type;
					$scope.$apply();
				}
				count += 1;
			}
	}
	
	controller.removeAnyPreviousTarget = function()
	{
		for(var row in controller.enemyGameBoard)
			for(var cell in controller.enemyGameBoard[row])
			{
				if (controller.enemyGameBoard[row][cell].type === 'shootTarget')
				{
					controller.enemyGameBoard[row][cell].type = 'watertile';
				}
			}
		$scope.$apply();
	}
	
	controller.clearChallengeMessage = function()
	{
		controller.challengeResponse = '';
		$scope.$apply();
	}
	
	controller.showGameBoard = function() 
	{
		$('.gameArea').show(); 
		$('.gameArea').prop({'display':'inline'}); 
	};
	controller.showChallenge = function() { $('.challenge').show(); };
	controller.showLobby = function() { $('.lobby').show(); };
	controller.showDefeat = function() { $('.defeat').show();};
	controller.showVictory = function() { $('.victory').show();};
	
	controller.socket.on('declinedChallenge', controller.clearChallengeMessage);
	controller.socket.on('updateEnemyBoard', controller.updateEnemyBoard);
	controller.socket.on('checkHit', controller.checkHit);
	controller.socket.on('firstRound', controller.firstRound);
	controller.socket.on('nextRound', controller.nextRound);
	controller.socket.on('victory', controller.victory);
	controller.socket.on('defeat', controller.defeat);
	controller.socket.on('startMatch', controller.newGame);
	controller.socket.on('challengeRequest', controller.receiveChallenge);
	controller.socket.on('updateLobby', controller.updateLobby);
	controller.socket.on('loginResponse', controller.login);
});