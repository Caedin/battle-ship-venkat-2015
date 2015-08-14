if (typeof exports === 'undefined')
	exports = {};

var Lobby = function()
{
	this.lobbyNames = {};
	
	this.addUserToLobby = function(userName)
	{
		this.lobbyNames[userName] = true;
	}
	this.removeUserFromLobby = function(userName)
	{
		delete this.lobbyNames[userName];
	}
	this.getLobby = function()
	{
		var playerList = [];
		for(var user in this.lobbyNames)
		{
			if(this.lobbyNames.hasOwnProperty(user)) playerList.push(user);
		}
		return JSON.stringify(playerList);
	}
	this.checkIfUserIsInLobby = function(userName)
	{
		if(this.lobbyNames.hasOwnProperty(userName)) return true;
		else return false;
	}
}

exports.Lobby = Lobby;