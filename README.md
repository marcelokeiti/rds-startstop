# rds-startstop
Lambda function aimed to start/stop RDS instances on schedule base

## Getting Started

These instructions will guide you to deploy the solution on Amazon Web Services

### Prerequisites

* AWS Account: This guide will assume that you have an AWS account configured on your local machine. For more information [see](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-getting-started.html)
* [git](https://git-scm.com/)
* [npm](https://www.npmjs.com/)
* [claudia.js](https://claudiajs.com)

### Installing

1. Create DynamoDB Table to parametrize the default values:

Table Name: RDS-Scheduler

| SolutionName  | CustomTagName           | DefaultDaysActive  | DefaultStartTime | DefaultStopTime |
| ------------- | ----------------------- | ------------------ | ---------------- | --------------- |
| RDSScheduler  | scheduler:rds-startstop | all                | 0800             | 1900            |

DefaultDaysActive: 'all', 'weekdays', or any combination of comma separated days ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')

DefaultStartTime: Default Start Time (UTC, 24-hour format)

DefaultStopTime: Default Stop Time (UTC, 24-hour format)

2. Create IAM Role: AWSStartStopRDSForLambda

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:log-group:/aws/lambda/*",
            "Effect": "Allow"
        },
        {
            "Action": [
                "dynamodb:GetItem"
            ],
            "Resource": [
                "arn:aws:dynamodb:*:*:table/*"
            ],
            "Effect": "Allow"
        },
        {
            "Action": [
                "rds:*"
            ],
            "Resource": "*",
            "Effect": "Allow"
        }
    ]
}
```


3. Create Lambda Function

As the time this tutorial was implemented, claudia.js didn't support NodeJs 8.10. Then, we first create the lambda function through AWS Console.

Version: NodeJs 8.10
Role: AWSStartStopRDSForLambda

4. Deploying Lambda function to AWS using claudia.js

```
git clone https://github.com/marcelokeiti/rds-startstop.git
```
```
cd rds-startstop
```
Create claudia.js file:

```
{
  "lambda": {
    "role": "<Replace ARN for Role AWSStartStopRDSForLambdaRole>
    "name": "rds-startstop",
    "region": "<Replace AWS Region>"
  }
}
```

```
claudia update
```
