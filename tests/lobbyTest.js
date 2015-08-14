describe('lobby tests', function()
{
	var lobby;
	beforeEach(function() {lobby = new Lobby();});
	
	it('canary should pass', function()
	{
		expect(true).equals(true);
	});

	it('add user to lobby should add the user', function()
	{
		lobby.addUserToLobby('Joe');
		expect(lobby.lobbyNames['Joe']).equals(true);
	});
	
	it('remove user from lobby should remove the user', function()
	{
		lobby.addUserToLobby('Joe');
		expect(lobby.lobbyNames['Joe']).equals(true);
		lobby.removeUserFromLobby('Joe');
		expect(typeof lobby.lobbyNames['Joe']).equals('undefined');
	});
	
	it('get lobby should fetch a copy of usernames, in array form', function()
	{
		var user1 = 'joe1';
		var socket1 = { test : '123' };
		var user2 = 'joe2';
		var socket2 = { test : '123' };
		var user3 = 'joe3';
		var socket3 = { test : '123' };
		
		lobby.addUserToLobby(user1, socket1);
		lobby.addUserToLobby(user2, socket2);
		lobby.addUserToLobby(user3, socket3);
		
		var expectedNames = JSON.stringify(['joe1', 'joe2', 'joe3']);
		expect(lobby.getLobby()).equals(expectedNames);
	});
	
	it('checkIfUserIsInLobby should return true if user is in lobby', function()
	{
		var user1 = 'joe1';
		var socket1 = { test : '123' };
		
		lobby.addUserToLobby(user1, socket1);
		
		expect(lobby.checkIfUserIsInLobby(user1)).equals(true);
	});
	
	it('checkIfUserIsInLobby should return false if user is not in lobby', function()
	{
		var user1 = 'joe1';
		var socket1 = { test : '123' };
		
		lobby.addUserToLobby(user1, socket1);
		
		expect(lobby.checkIfUserIsInLobby('user2')).equals(false);
	});
	
});