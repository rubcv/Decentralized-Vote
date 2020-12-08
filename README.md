# Decentralized Vote using Hyperledger Fabric v2.2


## Instalación y despliegue
### Instalación a partir de los archivos descargados de HF (fabric-samples)



#### Directorios necesarios:
* asset-transfer-basic/application-javascript
* asset-transfer-basic/chaincode-go
* bin **Binarios obtenidos al descargar la versión 2 de HF**
* config
* test-network
* test-application
* api

#### Requisitos:

##### Si se va a hacer un upgrade, eliminar contenedores e imagenes de la versión anterior

       docker stop $(docker ps -a -q) // Para los contenedores
       docker rm $(docker ps -a -q) // Borra los contenedores
       docker volume prune // Borra los volumenes montados
       docker rmi $(docker images -a -q) --force // Borra las imagenes

##### IMPORTANTE: Se borra la blockchain

* Hyperledger Fabric v2.2: 

       curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.2.1 1.4.9
       
Esto descarga tanto las imagenes como los archivos de la v2 (carpeta fabric-samples), copiar la carpeta bin (fabric-samples/bin) en un directorio al mismo nivel que las carpetas descargadas de github (son los binarios necesarios)      
* Docker v19.03
       
       docker version
       
* Docker-compose v1.17
       
       docker-compose version
       
* Curl v7.58

       curl --version

* Node v12.16

       node --version

* Go v1.15

       go version
       export GOPATH=/home/ubuntu/go
       export GOROOT=/usr/local/go

  * Si aparecen problemas en la instalación de go (en home): 
       
        wget https://dl.google.com/go/go1.15.2.linux-amd64.tar.gz 
        sudo tar -xvf go1.15.2.linux-amd64.tar.gz 
        sudo mv go /usr/local

        // Añadir al final de .bashrc
        export GOROOT=/usr/local/go 
        export GOPATH=$HOME/go
        export PATH=$GOPATH/bin:$GOROOT/bin:$PATH 
       



## Pasos:
#### Dentro del directorio /test-network:

**Asegurarse que los scripts tienen permiso de ejecucion**

 Exportar las variables de entorno necesarias:

    export PATH=${PWD}/../bin:$PATH
    export FABRIC_CFG_PATH=$PWD/../config/

1. Limpiar la red para eliminar contenedores de el despliegue anterior:
   
       ./network.sh down

2. Lanzar la red con un canal (mychannel) y una CA
   
       ./network.sh up createChannel -c mychannel -ca

3. Desplegar el chaincode de nombre basic y lenguaje go

       ./network.sh deployCC -ccn basic -ccl go

**Probar la red por terminal (opcional)**

Variables para Org1:

    export CORE_PEER_TLS_ENABLED=true
    export CORE_PEER_LOCALMSPID="Org1MSP"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
    export CORE_PEER_ADDRESS=localhost:7051

Inicializar la blockchain a traves del peer (debe responder status 200):

    peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C mychannel -n basic --peerAddresses localhost:7051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt -c '{"function":"InitLedger","Args":[]}'

* **Nota:**
 Como la política de aprobación requiere la firma tanto de  Org1 como Org2, la invocación de chaincode se debe dirigir tanto a peer0.org1.example.com como a peer0.org2.example.com usando **--peerAddresses**.
 Como TLS está habilitado, se usa **--tlsRootCertFiles**.

Hacer un query de GetAllVotes:
    
    peer chaincode query -C mychannel -n basic -c '{"Args":["GetAllVotes"]}'

Leer un voto:

    peer chaincode query -C mychannel -n basic -c '{"Args":["ReadVote","0"]}'

#### Dentro del directorio /asset-transfer-basic/application-javascript:

1. Instalar dependencias:

       npm install

2. Utilizar versión 12 de node:

       nvm use 12


### Lanzar API Node

#### Dentro del directorio /api

1. Paquetes necesarios en node

       npm i express --save
       npm i request --save
       npm i cors --save
       npm i fabric-network --save
       npm i fabric-ca-client --save

2. Usar Node v12

       nvm use 12

3. Lanzar server

       node server.js
