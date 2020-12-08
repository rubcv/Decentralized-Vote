/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../test-application/javascript/CAUtil.js');
const { buildCCPOrg1, buildWallet } = require('../../test-application/javascript/AppUtil.js');

const channelName = 'mychannel';
const chaincodeName = 'basic';
const mspOrg1 = 'Org1MSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'appUser';
const crypto = require('crypto');




function prettyJSONString(inputString) {
	return JSON.stringify(JSON.parse(inputString), null, 2);
}
function sleep(ms) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

// pre-requisites:
// - fabric-sample two organization test-network setup with two peers, ordering service,
//   and 2 certificate authorities
//         ===> from directory /fabric-samples/test-network
//         ./network.sh up createChannel -ca
// - Use any of the asset-transfer-basic chaincodes deployed on the channel "mychannel"
//   with the chaincode name of "basic". The following deploy command will package,
//   install, approve, and commit the javascript chaincode, all the actions it takes
//   to deploy a chaincode to a channel.
//         ===> from directory /fabric-samples/test-network
//         ./network.sh deployCC -ccn basic -ccl javascript
// - Be sure that node.js is installed
//         ===> from directory /fabric-samples/asset-transfer-basic/application-javascript
//         node -v
// - npm installed code dependencies
//         ===> from directory /fabric-samples/asset-transfer-basic/application-javascript
//         npm install
// - to run this test application
//         ===> from directory /fabric-samples/asset-transfer-basic/application-javascript
//         node app.js

// NOTE: If you see  kind an error like these:
/*
	2020-08-07T20:23:17.590Z - error: [DiscoveryService]: send[mychannel] - Channel:mychannel received discovery error:access denied
	******** FAILED to run the application: Error: DiscoveryService: mychannel error: access denied

   OR

   Failed to register user : Error: fabric-ca request register failed with errors [[ { code: 20, message: 'Authentication failure' } ]]
   ******** FAILED to run the application: Error: Identity not found in wallet: appUser
*/
// Delete the /fabric-samples/asset-transfer-basic/application-javascript/wallet directory
// and retry this application.
//
// The certificate authority must have been restarted and the saved certificates for the
// admin and application user are not valid. Deleting the wallet store will force these to be reset
// with the new certificate authority.
//

/**
 *  A test application to show basic queries operations with any of the asset-transfer-basic chaincodes
 *   -- How to submit a transaction
 *   -- How to query and check the results
 *
 * To see the SDK workings, try setting the logging to show on the console before running
 *        export HFC_LOGGING='{"debug":"console"}'
 */



class Fabric {

	constructor() {
		this.contract;
		this.ccp;
		this.caClient;
		this.wallet;
		this.network;
		this.gateway;

		this.registerAPI();
	}

	async registerAPI() {

		try {
			// build an in memory object with the network configuration (also known as a connection profile)
			this.ccp = buildCCPOrg1();

			// build an instance of the fabric ca services client based on
			// the information in the network configuration
			this.caClient = buildCAClient(FabricCAServices, this.ccp, 'ca.org1.example.com');

			// setup the wallet to hold the credentials of the application user
			this.wallet = await buildWallet(Wallets, walletPath);

			// in a real application this would be done on an administrative flow, and only once
			await enrollAdmin(this.caClient, this.wallet, mspOrg1);

			// in a real application this would be done only when a new user was required to be added
			// and would be part of an administrative flow
			await registerAndEnrollUser(this.caClient, this.wallet, mspOrg1, org1UserId, 'org1.department1');

			// Create a new gateway instance for interacting with the fabric network.
			// In a real application this would be done as the backend server session is setup for
			// a user that has been verified.
			this.gateway = new Gateway();

			try {
				// setup the gateway instance
				// The user will now be able to create connections to the fabric network and be able to
				// submit transactions and query. All transactions submitted by this gateway will be
				// signed by this user using the credentials stored in the wallet.
				let wallet = this.wallet;
				await this.gateway.connect(this.ccp, {
					wallet,
					identity: org1UserId,
					discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
				});

				// Build a network instance based on the channel where the smart contract is deployed
				this.network = await this.gateway.getNetwork(channelName);

				// Get the contract from the network.
				this.contract = this.network.getContract(chaincodeName);

				// Initialize a set of asset data on the channel using the chaincode 'InitLedger' function.
				// This type of transaction would only be run once by an application the first time it was started after it
				// deployed the first time. Any updates to the chaincode deployed later would likely not need to run
				// an "init" type function.
				console.log('\n--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');
				await this.contract.submitTransaction('InitLedger');
				console.log('*** Result: committed');
				console.log('=> Blockchain desplegada y API activa');

				return this.contract;
			} catch (err) {
				console.log(err);
			}
		} catch (err) {
			console.log(err);
		}

	}



	//###########################################

	// 				VOTES 

	//###########################################


	async GetAllVotes() {

		try {

			let result = await this.contract.evaluateTransaction("GetAllVotes");
			return prettyJSONString(result.toString());

		} catch (err) {
			console.error(err);
		}

		return false;
	}

	async CreateVote(vote) {
		try {

			const unixTime = Math.floor(Date.now() / 1000).toString();

			const tx_id = crypto.createHmac('sha256', unixTime)
				.update('Transaction ID')
				.digest('hex');

			vote.vote_id = tx_id;
			vote.vote_timestamp = unixTime;

			await this.contract.submitTransaction('CreateVote', tx_id, vote.vote_sender, vote.vote_receiver, vote.vote_timestamp);

			return tx_id;

		} catch (err) {
			console.log(err);
		}

		return false;
	}

	async ReadVote(id) {

		try {

			let result = await this.contract.evaluateTransaction('ReadVote', id);
			return prettyJSONString(result.toString());

		} catch (err) {
			console.log(err);
		}

		return false;
	}


}


module.exports = Fabric;
