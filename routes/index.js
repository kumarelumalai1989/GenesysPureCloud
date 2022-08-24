'use strict';
var express = require('express');
var request = require("request");
var router = express.Router();

// Set Genesys cloud objects
const platformClient = require('purecloud-platform-client-v2');
const client = platformClient.ApiClient.instance;

// Import library to use for input in NPM
//const prompt = require('prompt');

// Get client credentials from environment variables
const CLIENT_ID = '0392818e-85c6-4f72-98ad-6afb6a5ccad6' //process.env.GENESYS_CLOUD_CLIENT_ID;
const CLIENT_SECRET = 'Mw7iWt_wQRPjzZIO9bK0F1MamwejCSkEBjus_FJu5qs' //process.env.GENESYS_CLOUD_CLIENT_SECRET;
const ORG_REGION = 'us_east_1'//process.env.GENESYS_CLOUD_REGION; // eg. us_east_1


//setInterval(function () {
  

//    GetQueues();
//}, 30000);
//console.log("now");
// Instantiate API
let routingApi = new platformClient.RoutingApi();
let analyticsApi = new platformClient.AnalyticsApi();

// Declare global variables Customer Service Expedite/Order Status, Temperature Technical Support, Data Acquisition Technical Support,
// Flow/Level/Envionmental Technical Support, Operators, U.S. Sales, Pre Sales, Customer Service Returns
let queueId = '';
let jsonOutput = [];
setInterval(GetQueues, 10000);



let options = {
    method: 'POST',
    uri: 'https://omegaengineering--preprod.my.salesforce.com/services/oauth2/token?username=dmuhammad@omega.com.preprod&password=996633225588Dani!@%23&grant_type=password&client_id=3MVG9vDPWAliPr7pJdGEChcK0rqhwVJpxbSEvhH_7T8mRIfq6Gq5IsQpNKo2ZHd8DXq0_4H6zyFvJQCz30774&client_secret=FB0DBC7DF740EFB8A5731F8F302CA79D1FAF564D8BA44DE190DD8D6540467536&',
    auth: {
        user: '3MVG9vDPWAliPr7pJdGEChcK0rqhwVJpxbSEvhH_7T8mRIfq6Gq5IsQpNKo2ZHd8DXq0_4H6zyFvJQCz30774',
        pass: 'FB0DBC7DF740EFB8A5731F8F302CA79D1FAF564D8BA44DE190DD8D6540467536'
    },
    json: {
        grant_type: 'password'
    }
}
request(options, function (error, response, body) {
    let accessToken = body.access_token
})

request(options, function (error, response, body) {
    let accessToken = body.access_token
})

function GetQueues() {
    //console.log("Every 5 secondes");
    jsonOutput = [];
    //let queueName;//'U.S. Sales'; //'UK Sales French';
    const array = ['Customer Service Expedite/Order Status', 'Data Acquisition Technical Support', 'Customer Service Returns', 'Flow/Level/Envionmental Technical Support', 'Operators', 'Pre Sales', 'Temperature Technical Support', 'U.S. Sales']
    
    let i = 0
    while (i < array.length) {
        //console.log(array[i])
        let queueName = array[i];

        GetQueueCount(queueName);

        i++;
    }//While loop ending
}

function GetQueueCount(queueName) {
    // Get Queue ID from name
    function getQueueId(queueName) {
        return routingApi.getRoutingQueues({
            pageSize: 100, pageNumber: 1, sortBy: 'name', name: queueName
        })
            .then((data) => {
                let queues = data.entities;

                if (queues.length < 1) {
                    throw new Error('Queue not found.');
                } else if (queues.length > 1) {
                    console.log('Found more than one queue with the name. Getting the first one.')
                }

                queueId = queues[0].id;
                //console.log('queueId: ' + queueId);
            })
            .catch((err) => console.error(err));
    }

    // Get the number of on-queue agents
    function getOnQueueAgentsCount() {
        let body = {
            filter: {
                type: 'or',
                clauses: [{
                    type: 'or',
                    predicates: [{
                        type: 'dimension',
                        dimension: 'queueId',
                        operator: 'matches',
                        value: queueId
                    }]
                }]
            },
            metrics: [
                'oOnQueueUsers'
            ]
        };

        // Execute the analytics query. Count the 'on-queue' agents on the queue.
        return analyticsApi.postAnalyticsQueuesObservationsQuery(body)
            .then((data) => {
                let count = data.results[0].data?.[0].stats.count;
                if (!count) count = 0;

                return count;
            })
            .catch((err) => console.error(err));
    }

    // Set environment
    const item = {};
    const environment = platformClient.PureCloudRegionHosts[ORG_REGION];
    if (environment) client.setEnvironment(environment);

    client.loginClientCredentialsGrant(CLIENT_ID, CLIENT_SECRET)
        .then(() => {
            //console.log('Authentication successful!');
            return queueName; //inputQueueName();
        })
        .then((_queueName) => {
            queueName = _queueName;

            return getQueueId(queueName);
        })
        .then(() => {
            return getOnQueueAgentsCount();
            //return getOffQueueAgentsCount();
        })
        .then((count) => {
            //console.log(`Number of On-Queue Agents (${queueName}): ${count}`);

            item["queue_name"] = queueName;
            item["countnumber"] = count;
            jsonOutput.push(item);
        })
        .catch((err) => console.log(err));
    return jsonOutput;
}

/* GET home page. */
router.get('/', function (req, res) {
    res.status(200).send();
});

var product = [
    {
        "id": 1,
        "productName": "Pen",
        "productPrice": "200",
        'productStock': "false"
    },
    {
        "id": 2,
        "productName": "Pencil",
        "productPrice": "200",
        "productStock": "false"
    },
];

router.get('/products', function (req, res) {
    res.json({ products: product });
    //res.status(400).send();
});

router.get('/queueDetails', function (req, res) {
    //setTimeout(GetQueues, 10000);
    res.json({ requestData: jsonOutput });
    //res.status(400).send();
});

module.exports = router;
