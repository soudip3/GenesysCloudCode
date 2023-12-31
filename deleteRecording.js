const platformClient = require('purecloud-platform-client-v2');
const client = platformClient.ApiClient.instance;

// Globals
let newJob = null;

// Get client credentials from environment variables
const CLIENT_ID = "Client_ID";
const CLIENT_SECRET = "Client_Secret";
const ORG_REGION = "eu_central_1"; // eg. us_east_1

// Set environment
const environment = platformClient.PureCloudRegionHosts[ORG_REGION];
if(environment) client.setEnvironment(environment);

// API Instances
const recordingApi = new platformClient.RecordingApi();

client.loginClientCredentialsGrant(CLIENT_ID, CLIENT_SECRET)

.then(()=> {
    return createRecordingBulkJob();
})
.then((job) => {
    console.log('Succesfully created recording bulk job');

    newJob = job;
    return waitOnJobProcessing(newJob.id);
})
.then(() => {
    console.log('Job is now ready: ' + newJob.id);

    return executeJob(newJob.id);
})
// .then(() => {
//     console.log('Succesfully execute recording bulk job');

//     return recordingApi.deleteRecordingJob(newJob.id);
// })
.then(() => {
    //console.log('Succesfully cancelled recording bulk job');


    return getRecordingJobs();
})
.then((result) => {
    console.log(result);

    console.log('Succesfully get recording bulk jobs')
})
.catch((err) => {
    console.log(err);
});

function createRecordingBulkJob(){
    return recordingApi.postRecordingJobs({
        action: "DELETE",
        actionDate: "2023-08-21T00:00:00.000Z",
        conversationQuery: {
            order: "asc",
            orderBy: "conversationStart",
            interval: "2023-04-18T00:00:00.000Z/2023-05-22T00:00:00.000Z",
            segmentFilters: [
            {
                type: "and",
                predicates: [
                {
                    type: "dimension",
                    dimension: "mediaType",
                    operator: "matches",
                    value: "message"
                }
                ]
            }
            ]
        }
    })
}


function waitOnJobProcessing(id){
    // Initial state of job is PROCESSING
    // Wait every 2sec until job has READY state
    return new Promise((resolve, reject) => {
        let timer = setInterval(() => {
            recordingApi.getRecordingJob(id)
            .then((jobStatus) => {
                console.log(`State is ${jobStatus.state}.`)
                if(jobStatus.state == 'READY') {
                    resolve();
                    clearInterval(timer);
                }
            })
            .catch((e) => reject(e));
        }, 2000);
    });
}


function executeJob(id){
    return recordingApi.putRecordingJob(id, {
        state: 'PROCESSING'
    });
}


function getRecordingJobs(){
    return recordingApi.getRecordingJobs({
        pageSize: 25,
        pageNumber: 1,
        sortBy: 'userId', // or 'dateCreated'
        state: 'PROCESSING', // valid values FULFILLED, PENDING, READY, PROCESSING, CANCELLED, FAILED
        showOnlyMyJobs: true,
        jobType: 'DELETE' // or 'DELETE'
    })
}

