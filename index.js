const AWS = require('aws-sdk');
    
const rds = new AWS.RDS({apiVersion: '2014-10-31'});
const ddb = new AWS.DynamoDB({apiVersion: '2012-10-08'});

const moment = require('moment');

var isActiveDay = function(activeDays) {
    var weekdays = ['mon', 'tue', 'wed', 'thu', 'fri'];
    
    var executingDay = moment().format('ddd').toLowerCase();

    var isActiveDay = false;
            
    if (activeDays === "all") {
        
        isActiveDay = true;
    } else if (activeDays === "weekdays" 
        && weekdays.includes(executingDay)) {
        
        isActiveDay = true;
    } else {
        var activeDaysArray = activeDays.split(",");

        for (var i = 0; i < activeDaysArray.length; i++) {
            var dayActive = activeDaysArray[i];
                    
            if (dayActive === executingDay) {
                isActiveDay = true;
                break;
            }
        }
    }
            
    console.log('Is active day?', isActiveDay);
    return isActiveDay;
};

exports.handler = async function(event, context) {
    try {

        var params = {
            TableName: 'RDS-Scheduler',
            Key: {
                'SolutionName' : {S: 'RDSScheduler'},
            }
        };
        
        var dynamoData = await ddb.getItem(params).promise();
        
        console.log("Found default parameters:", dynamoData.Item);
                
        var customTagName = dynamoData.Item['CustomTagName'].S;
        var startTime = dynamoData.Item['DefaultStartTime'].S;
        var stopTime = dynamoData.Item['DefaultStopTime'].S;
        var timeZone = 'utc';
        var daysActive = dynamoData.Item['DefaultDaysActive'].S.toLowerCase();
        
        var dbInstancesData = await rds.describeDBInstances().promise();
        
        for (var dbInstance of dbInstancesData.DBInstances) {
            console.log("Listing tags for DBInstance:", dbInstance.DBInstanceArn);
            
            var tagsData = await rds.listTagsForResource({ ResourceName: dbInstance.DBInstanceArn }).promise();
            
            var tag = tagsData.TagList.find( function( tag, i, tags ) {
                return tag.Key === customTagName && tag.Value.toLowerCase() != 'false';
            });
            
            if (!tag) console.log("No tag %s found for DBInstance:", customTagName, dbInstance.DBInstanceArn);
            else {
                console.log("Tag found for DBInstance %s:", dbInstance.DBInstanceArn, tag);
                
                var scheduleTags = tag.Value.toLowerCase().split(':');
                
                if (tag.Value.toLowerCase() != 'true'
                    && tag.Value.toLowerCase() != 'default') {
                                                
                    if (scheduleTags.length >= 1 && scheduleTags[0].length > 0) startTime = scheduleTags[0];
                                        
                    if (scheduleTags.length >= 2 && scheduleTags[1].length > 0) stopTime = scheduleTags[1];
                                        
                    if (scheduleTags.length >= 3 && scheduleTags[2].length > 0) timeZone = scheduleTags[2];
                                        
                    if (scheduleTags.length >= 4 && scheduleTags[3].length > 0) daysActive = scheduleTags[3];
                }
                
                var lastHourTime = moment().subtract(59, 'minutes').format('HHmm');
                var nowTime = moment().format('HHmm');
                var canExecuteToday = isActiveDay(daysActive)

                console.log('start-time %s, stop-time %s, time-zone %s, days-active %s, last-hour %s, now %s, DBInstanceStatus %s', 
                                startTime, stopTime, timeZone, daysActive, lastHourTime, nowTime, dbInstance.DBInstanceStatus);
                
                if (canExecuteToday
                    && lastHourTime <= startTime 
                    && startTime <= nowTime
                    && dbInstance.DBInstanceStatus === 'stopped') {

                    console.log('Starting DBInstance:', dbInstance.DBInstanceArn);

                    var params = {
                        DBInstanceIdentifier: dbInstance.DBInstanceIdentifier
                    };
                    
                    await rds.startDBInstance(params).promise();
                }

                if (canExecuteToday
                    && lastHourTime <= stopTime 
                    && stopTime <= nowTime
                    && dbInstance.DBInstanceStatus === 'available') {
                    
                    var snapshotIdentifier = `${dbInstance.DBInstanceIdentifier}-${moment().format('YYYY-MM-DD-HH-mm')}`;
                    
                    console.log("Creating DBSnapshot:", snapshotIdentifier);
                    console.log("Stopping DBInstance:", dbInstance.DBInstanceArn);
                    
                    var params = {
                        DBInstanceIdentifier: dbInstance.DBInstanceIdentifier, 
                        DBSnapshotIdentifier: snapshotIdentifier
                    };
                    
                    await rds.stopDBInstance(params).promise();
                }
            }
        }
    
        context.done(null, 'Success');
    } catch (e) {
        console.log(e.message);
        throw e;
    }
};

