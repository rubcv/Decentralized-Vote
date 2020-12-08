package chaincode

import (
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing a Vote
type SmartContract struct {
	contractapi.Contract
}



// #####################################

		// ESTRUCTURAS

// #####################################

 type Vote struct {
	Vote_id          	string     `json:"vote_id"`
	Vote_sender 		string     `json:"vote_sender"`
	Vote_receiver       string     `json:"vote_receiver"`
	Vote_timestamp    	string     `json:"vote_timestamp"`
	
}




// InitLedger inicializa la blockchain con los objetos y sus valores por defecto
func (s *SmartContract) InitLedger(ctx contractapi.TransactionContextInterface) error {

	// Vote

	votes := []Vote{
		{Vote_id 		: "0",
		Vote_sender 	: "DEFAULT",
		Vote_receiver 	: "DEFAULT",
		Vote_timestamp	: "DEFAULT"},		
	}

	for _, vote := range votes {
		voteJSON, err := json.Marshal(vote)
		if err != nil {
			return err
		}

		err = ctx.GetStub().PutState(vote.Vote_id, voteJSON)
		if err != nil {
			return fmt.Errorf("[vote] failed to put to world state. %v", err)
		}
	}


	return nil
}

//###########################################

// 				VOTES 

//###########################################

// Funcion para crear un nuevo voto con los parametros recibidos
func (s *SmartContract) CreateVote(ctx contractapi.TransactionContextInterface, id string, sender string, receiver string, timestamp string) error {
	exists, err := s.ElementExists(ctx, id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("the vote %s already exists", id)
	}

	vote := Vote{
		Vote_id 		: id,
		Vote_sender		: sender,
		Vote_receiver	: receiver,
		Vote_timestamp	: timestamp,		
		
	}

	voteJSON, err := json.Marshal(vote)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(id, voteJSON)
}

// Funcion que devuelve el voto almacenado correspondiente al id pasado como parametro
func (s *SmartContract) ReadVote(ctx contractapi.TransactionContextInterface, id string) (*Vote, error) {
	voteJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if voteJSON == nil {
		return nil, fmt.Errorf("the vote %s does not exist", id)
	}

	var vote Vote
	err = json.Unmarshal(voteJSON, &vote)
	if err != nil {
		return nil, err
	}

	return &vote, nil
}

// Funcion que devuelve todos los votos que hay en la blockchain
func (s *SmartContract) GetAllVotes(ctx contractapi.TransactionContextInterface) ([]*Vote, error) {
	// range query with empty string for startKey and endKey does an
	// open-ended query of all votes in the chaincode namespace.
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var votes []*Vote
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var vote Vote
		err = json.Unmarshal(queryResponse.Value, &vote)
		if err != nil {
			return nil, err
		}
		votes = append(votes, &vote)
	}

	return votes, nil
}


//###########################################

// 				AUXILIARES 

//###########################################


// Funcion que comprueba si un elemento existe en la blockchain
func (s *SmartContract) ElementExists(ctx contractapi.TransactionContextInterface, id string) (bool, error) {
	elementJSON, err := ctx.GetStub().GetState(id)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return elementJSON != nil, nil
}
