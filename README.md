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

Lambda Cloud Formation template:

```
cf/ec2-scheduler.template
```

Deploying Lambda function to AWS using claudia.js:

```
git clone https://github.com/marcelokeiti/rds-startstop.git
```
```
cd rds-startstop
```
```
claudia create --region us-west-2 --handler lambda.handler
```
