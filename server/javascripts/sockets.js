var SocketHandler = function(io)
{
	var socketHandler = this;
	socketHandler.clients = {};
	
	socketHandler.updateLobby = function()
	{
		io.emit('updateLobby', lobbyState.getLobby());
	}
		
	
	io.on('connection', function(socket)
	{
		socket.loginResponse = function(state)
		{
			if(state == true)	socket.emit('loginResponse', 'success');
			if(state == false)	socket.emit('loginResponse', 'error');
		}
		
		socket.login = function(userName)
		{
			if(socketHandler.clients.hasOwnProperty(userName) == false)
			{
				socket.userName = userName;
				socketHandler.clients[userName] = socket;
				lobbyState.addUserToLobby(userName);
				socket.loginResponse(true);
				socketHandler.updateLobby();
				return true;
			} 
			else 
			{
				socket.loginResponse(false);
				return false;
			}
		}
		socket.disconnect = function()
		{
			var userName = socket.userName;
			if(socketHandler.clients.hasOwnProperty(userName))
			{
				lobbyState.removeUserFromLobby(userName);
				socketHandler.updateLobby();
				delete socketHandler.clients[userName];
				if (socket.opponent)
				{
					socket.opponent.emit('victory');
				}
			}
			else
				return false;
		}
		
		socket.challengeRequest = function(userName)
		{
			if(socketHandler.clients.hasOwnProperty(userName))
			{
				var challenged = socketHandler.clients[userName];
				socket.opponent = challenged;
				challenged.opponent = socket;
				
				challenged.emit('challengeRequest', socket.userName);
				return true;
			} else return false;
		}
		
		socket.startMatch = function(pair)
		{
			var acceptor = socketHandler.clients[pair.player1];
			var challenger = socketHandler.clients[pair.player2];
			acceptor.opponent = challenger;
			challenger.opponent = acceptor;
			acceptor.emit('startMatch');
			challenger.emit('startMatch');
			lobbyState.removeUserFromLobby(pair.player1);
			lobbyState.removeUserFromLobby(pair.player2);
			socketHandler.updateLobby();
			
			socket.pickRandomPlayerToStart(acceptor, challenger);
		}
		
		socket.pickRandomPlayerToStart = function(player1, player2)
		{
			var rand = Math.random()
			if(rand >= 0.5)	player1.emit('firstRound');
			else player2.emit('firstRound');
		}
		
		socket.shootCell = function(index)
		{
			socket.fired = true;
			socket.opponent.emit('checkHit', index);
		}
		
		socket.sankShip = function(index)
		{
			socket.opponent.emit('updateEnemyBoard', index, 'shipwreck');
			socket.emit('nextRound');
		}
		
		socket.missedShip = function(index)
		{
			socket.opponent.emit('updateEnemyBoard', index, 'missedShot');
			socket.emit('nextRound');
		}
		
		socket.defeat = function()
		{
			socket.emit('defeat');
			socket.opponent.emit('victory');
		}
		
		socket.declineChallenge = function()
		{
			socket.opponent.emit('declinedChallenge');
		}
		
		socket.on('login', socket.login);
		socket.on('disconnect', socket.disconnect);
		socket.on('challengeRequest', socket.challengeRequest);
		socket.on('declinedChallenge', socket.declineChallenge);
		socket.on('startMatch', socket.startMatch);
		socket.on('shootCell', socket.shootCell);
		socket.on('sankShip', socket.sankShip);
		socket.on('missedShip', socket.missedShip);
		socket.on('defeat', socket.defeat);
		
		socketHandler.updateLobby();
	});
	
	
	socketHandler.io = io;
}

exports.SocketHandler = SocketHandler;