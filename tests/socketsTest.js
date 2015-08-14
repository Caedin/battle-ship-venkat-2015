describe('sockets tests', function()
{
	var sockets;
	var testSocket;
	var io;
	
	beforeEach(function() 
	{
		require = function() { return true;};
		io = { 
			map: {},
			on: function(key, func) { this.map[key] = func; },
			emit: function() { return true; }
		};
		testSocket = { 
			map: {},
			on: function(key, func) { this.map[key] = func; },
			emit: function() { return true;}
		};
		lobbyState = new Lobby();
		sockets = new SocketHandler(io);
	});
	
	it('canary should pass', function()
	{
		expect(true).equals(true);
	});
	
	it('connection should register socket with a disconnection event', function()
	{
		io.map['connection'](testSocket);
		expect(typeof testSocket.map['disconnect']).equals('function');
	});
	
	it('connection should register socket with a startMatch event', function()
	{
		io.map['connection'](testSocket);
		expect(typeof testSocket.map['startMatch']).equals('function');
	});
	
	it('connection should register socket with a challengeRequest event', function()
	{
		io.map['connection'](testSocket);
		expect(typeof testSocket.map['challengeRequest']).equals('function');
	});
	
	it('connection should call updateLobby', function()
	{
		var called = false;
		sockets.updateLobby = function()
		{
			called = true;
		}
		io.map['connection'](testSocket);
		expect(called).equals(true);
	});
	
	it('connection should register socket with a login event', function()
	{
		io.map['connection'](testSocket);
		expect(typeof testSocket.map['login']).equals('function');
	});
	
	it('login should add userName to clients', function()
	{
		io.map['connection'](testSocket);
		testSocket.map['login']('newUser');
		expect(sockets.clients['newUser']).to.deep.eql(testSocket);
	});
	
	it('login should return false if userName already in clients', function()
	{
		io.map['connection'](testSocket);
		testSocket.map['login']('newUser');
		expect(testSocket.map['login']('newUser')).equals(false);
	});
	
	it('disconnect should remove that socket from clients', function()
	{
		io.map['connection'](testSocket);
		testSocket.login('newUser');
		testSocket.map['disconnect']();
		expect(typeof sockets.clients['newUser']).equals('undefined');
	});
	
	it('disconnect should return false if there is no user', function()
	{
		io.map['connection'](testSocket);
		testSocket.map['disconnect']();
		expect(testSocket.map['disconnect']()).equals(false);
	});
	
	it('disconnect should send a victory to the opponent', function()
	{
		io.map['connection'](testSocket);
		testSocket.userName = 'test';
		testSocket.opponent = {};
		var called = false;
		testSocket.opponent.emit = function(event)
		{
			if(event == 'victory') called = true;
		}
		sockets.clients['test'] = testSocket;
		testSocket.disconnect();
		expect(called).equals(true);
	});

	it('loginResponse should send "success" to the client', function()
	{
		var called = false;
		io.map['connection'](testSocket);
		testSocket.emit = function(event, message)
		{
			if (message === 'success') called = true;
		}
		
		testSocket.loginResponse(true);
		expect(called).equals(true);
	});
	
	it('loginResponse should send "error" to the client', function()
	{
		var called = false;
		io.map['connection'](testSocket);
		testSocket.emit = function(event, message)
		{
			if (message === 'error') called = true;
		}
		
		testSocket.loginResponse(false);
		expect(called).equals(true);
	});
	
	it('loginResponse should be called by socket.login', function()
	{
		var called = false;
		io.map['connection'](testSocket);
		testSocket.loginResponse = function(state)
		{
			called = true;
		}

		testSocket.login('tester');
		expect(called).equals(true);
	});
	
	it('updateLobby should emit the new lobby data', function(done)
	{
		lobbyState.lobbyNames = {joe: '123', hello:'234'};

		io.map['connection'](testSocket);
		
		var passedTest = false;
		io.emit = function(event, data)
		{
			if(event === 'updateLobby')
			{
				expect(data).to.deep.eql(JSON.stringify(['joe', 'hello']));
			}
			done();
		}
		sockets.updateLobby();
	});
	
	it('challengeRequest should emit a challengeRequest to the specified player', function()
	{
		var sent = false;
		sockets.clients['joe'] = {};
		sockets.clients['joe'].emit = function(message, data)
		{
			sent = true;
		}
		
		io.map['connection'](testSocket);
		testSocket.challengeRequest('joe');
		expect(sent).equals(true);
	});
	
	it('challengeRequest should return false if player is not connected', function()
	{
		io.map['connection'](testSocket);
		var response = testSocket.challengeRequest('joe');
		expect(response).equals(false);
	});
	
	it('startMatch should emit a startMatch event to both players', function()
	{
		io.map['connection'](testSocket);
		
		var player1 = {};
		var player2 = {};
		var joeCalled = false;
		var bobCalled = false;
		
		player1.emit = function(event, message)
		{
			if(event === 'startMatch')	joeCalled = true;
		}
		player2.emit = function(event, message)
		{
			if(event === 'startMatch')	bobCalled = true;
		}
		
		sockets.clients['joe'] = player1;
		sockets.clients['bob'] = player2;
		
		var pair = { player1: 'joe', player2: 'bob'};

		testSocket.startMatch(pair);
		
		expect(joeCalled).equals(true);
		expect(bobCalled).equals(true);
	});
	
	it('shootCell should register an event', function()
	{
		io.map['connection'](testSocket);
		expect(typeof testSocket.map['shootCell']).equals('function');
	});
	
	it('shootCell set fired to true', function()
	{
		io.map['connection'](testSocket);
		testSocket.opponent = {};
		testSocket.opponent.emit = function(event, message)
		{
			return true;
		}
		
		testSocket.shootCell();
		expect(testSocket.fired).equals(true);
	});
	
	it('shootCell should emit checkHit for opponent', function()
	{
		var called = false;
		io.map['connection'](testSocket);
		testSocket.opponent = {};
		testSocket.opponent.fired = true;
		testSocket.opponent.emit = function(event, message)
		{
			if(event === 'checkHit')
				if(message === 35)
					called = true;
		}
		testSocket.shootCell(35);
		expect(called).equals(true);
	});
	
	it('sankShip should register an event', function()
	{
		io.map['connection'](testSocket);
		expect(typeof testSocket.map['sankShip']).equals('function');
	});
	
	it('sankShip should send next round and update enemy boad', function()
	{
		io.map['connection'](testSocket);
		
		testSocket.opponent = {};
		var updateEnemyBoardCalled = false;
		var newRoundP2 = false;
		
		testSocket.opponent.emit = function(event, index, type)
		{
			if(event == 'updateEnemyBoard' && index == 2 && type == 'shipwreck')
				updateEnemyBoardCalled = true;
		}
		testSocket.emit = function(event)
		{
			if(event === 'nextRound')
				newRoundP2 = true;
		}
		
		testSocket.sankShip(2);
		
		expect(newRoundP2).equals(true);
		expect(updateEnemyBoardCalled).equals(true);
	});
	
	it('missedShip should register an event', function()
	{
		io.map['connection'](testSocket);
		expect(typeof testSocket.map['missedShip']).equals('function');
	});
	
	it('missedShip should send next round and update enemy boad', function()
	{
		io.map['connection'](testSocket);
		
		testSocket.opponent = {};
		var updateEnemyBoardCalled = false;
		var newRoundP2 = false;
		
		testSocket.opponent.emit = function(event, index, type)
		{
			if(event == 'updateEnemyBoard' && index == 2 && type == 'missedShot')
				updateEnemyBoardCalled = true;
		}
		testSocket.emit = function(event)
		{
			if(event === 'nextRound')
				newRoundP2 = true;
		}
		
		testSocket.missedShip(2);
		
		expect(newRoundP2).equals(true);
		expect(updateEnemyBoardCalled).equals(true);
	});
	
	it('defeat should send a defeat and victory emit to players', function()
	{
		io.map['connection'](testSocket);
		
		testSocket.opponent = {};
		
		var victorySent = false;
		var defeatSent = false;
		
		testSocket.opponent.emit = function(event)
		{
			if(event === 'victory')
				victorySent = true;
		}
		testSocket.emit = function(event)
		{
			if(event === 'defeat')
				defeatSent = true;
		}
		
		testSocket.defeat();
		
		expect(victorySent).equals(true);
		expect(defeatSent).equals(true);
	});
	
	it('declineChallenge should emit declinedChallenge for opponent', function()
	{
		var called = false;
		io.map['connection'](testSocket);
		testSocket.opponent = {};
		testSocket.opponent.fired = true;
		testSocket.opponent.emit = function(event, message)
		{
			if(event === 'declinedChallenge')
				called = true;
		}
		testSocket.declineChallenge();
		expect(called).equals(true);
	});
	
	
	it('pickRandomPlayerToStart should call emit first round for one of the players', function()
	{
		var called = false;
		io.map['connection'](testSocket);
		testSocket.opponent = {};
		testSocket.opponent.emit = function(event, message)
		{
			if(event === 'firstRound')
				called = true;
		}
		testSocket.emit = function(event, message)
		{
			if(event === 'firstRound')
				called = true;
		}
		testSocket.pickRandomPlayerToStart(testSocket, testSocket.opponent);
		expect(called).equals(true);
	});
});