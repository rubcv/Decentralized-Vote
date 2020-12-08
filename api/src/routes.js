
var Fabric = require("../../asset-transfer-basic/application-javascript/app");
var fabric = new Fabric();


module.exports = function (app) {



    //###########################################

    // 				VOTES 

    //###########################################


    app.get("/votes", async function (req, res) {

        try {

            // Buscamos todos los votos de la blockchain
            let result = await fabric.GetAllVotes();

            if (result) {
                res.status(200).json(JSON.parse(result));
            } else {
                res.status(204).json(JSON.parse('{}'));
            }


        } catch (err) {
            console.log(err);
            res.status(500).json({ err });
        }

    });


    app.get("/votes/:id", async function (req, res) {

        const id = req.params.id;

        try {

            let result = await fabric.ReadVote(id);
            let resultJSON = JSON.parse(result);
            
            if (result) {
                res.status(200).json(resultJSON);
            } else {
                res.status(404).json(JSON.parse('{"ERROR" : "Asset not found"}'));
            }

        } catch (err) {
            console.log(err);
            res.status(500).json({ err });
        }
    });


    app.post("/votes", async function (req, res) {

        var vote = {
            vote_id         : "",
            vote_sender     : req.body.sender,
            vote_receiver   : req.body.receiver,
            vote_timestamp  : ""
        };

        try {

            // Guardamos en blockchain
            let result = await fabric.CreateVote(vote);
            
            if (result) {
                var vote_id = {
                    "vote_id": result
                }

                res.status(201).json(vote_id);
            } else {
                res.status(500).json(JSON.parse('{ "ERROR" : "Error creating vote" }'));
            }

        } catch (err) {
            console.log(err);
            res.status(500).json({ err });
        }
    });
}