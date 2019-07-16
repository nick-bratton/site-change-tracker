# Sensory Minds Code Challenge 2

## Table of Contents

  - [Overview](#overview)
  - [Install](#install)
    - [MongoDB](#mongodb)
    - [Node Modules](#node-modules)
  - [Configure](#configure)
    - [Connect a Google Sheet](#connect-a-google-sheet)
    - [Get Credentials for the Google Sheets API](#get-credentials-for-the-google-sheets-api)
    - [Set Credentials for SendGrid](#set-credentials-for-send-grid)
    - [Get Emails at your Email Address](#get-emails-at-your-email-address)
    - [Set the Check Interval](#set-the-check-interval)
  - [Run](#run)
  - [Misc.](#misc)
  - [Troubleshooting](#troubleshooting)

## Overview

This repository contains a node script to watch and report changes in an html file. There is an html file and server in the *html* folder that you can use for testing. Alternatively, you could of course [configure](#configure) the script how you like.

My solution utilizes SendGrid, MongoDB and Google Sheets. To run on your machine, you should first follow the short installation process below.

## Install

### MongoDB

Note, if you don't already have Mongo installed, follow the instructions [here](). Once installed, to start the daemon:

```javascript
$ mongod --config /usr/local/etc/mongod.conf
```

You may need to set the config path to elsewhere if you didn't install to the default location. 

Now, you'll need to create a database called **sensory-minds-coding-challenge**. Open up a new shell and run:

```javascript
$ mongo
$ use sensory-minds-coding-challenge
```

### Node Modules

You should not need to install Node modules since I've included them in this zip. If you do,

```javascript
$ cd html && npm install
$ cd ../sensory-minds && npm install

```

from this directory.

## Configure

### Connect a Google Sheet

- Sign into [Google Sheets](https://docs.google.com/spreadsheets/u/0/) and create a new Google Sheet. 
- Copy the Sheet ID from the URL. If the url is `docs.google.com/spreadsheets/d/12345/edit#gid=0` then your spreadsheet's ID is *12345*.
- In *sensory-minds/.env*, set `SPREADSHEETID` to this ID.

### Get Credentials for the Google Sheets API

- Visit [this page](https://developers.google.com/sheets/api/quickstart/nodejs) and select **ENABLE THE GOOGLE SHEETS API**
- In the popup that opens, select **DOWNLOAD CLIENT CONFIGURATION**.
- Once you've downloaded a file called `credentials.json`, paste it into *sensory-minds/private/*.

### Set Credentials for SendGrid

In *private/sg.json*, paste in your SendGrid API key. It should be a string that begins with `sg.` Feel free to change the sender address to yours as well.

### Get Emails at your Email Address

You can configure the email client to send emails to yourself in *private/addresses.json*.

### Set the Check Interval

By default the CronJob executes every 5 seconds. This was to make development / testing easier. To change that, set `XSECONDS` in *sensory-minds/.env*. Values below 5 are rejected.

## Run

Ensure you've followed the [Install](#install) and [Configure](#configure) steps above. Then, once you are sure your Mongo daemon is running, and that you've supplied your Google credentials, run:

```javascript
$ cd html && npm run start
$ cd ../sensory-minds && npm run start
```

You should get an email notification, an updated Google Spreadsheet and a new Mongo document when either:

- You've just initialized a new collection. 

- The etag just received in the HTTP response from your local Express server is different than the last documented etag in your Mongo collection.

## Misc.

Reading through the challenge, there were optional tasks which I have not implemented, but would like to consider and discuss.

### What Changed Exactly?

This script simply checks the returned etag in the response header after requesting a resource at a given URL. The etag should be unique per resource content, but there are cases when servers may be configured to generate new etags after an expiration date, so this test may actually not be conclusive. It seems we can still be sure of true resource change even by [comparing stale etags](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag#Caching_of_unchanged_resources).

To dive into what exactly changed, to the best of my knowledge, we would have to parse and explore the DOM tree. The quickest way to get going may be to use an npm package like [html-differ](https://www.npmjs.com/package/html-differ). Otherwise, we would have to build a similar tool, perhaps scripting DOM node comparison on the HTML body with [.isEqualNode()](https://developer.mozilla.org/en-US/docs/Web/API/Node/isEqualNode) This is not something I've done before so I'm not sure how long it would take me to develop such a script. There are also database concerns here: if the target site is huge, how many instances of past delivered resources should we store in our database? I think however that we would just need to ever store one at any given time. 

Some other considerations: 
 1. How much computation time is needed for such a check? 
 2. In cases where the DOM tree itself was restructured but the rendered HTML didn't change, how can we check that and communicate it to the client? 
 3. If desired, can we avoid notifying the client when things like script versions in the HTML body change? Or things that change trivially like number of page views (if they were included in the HTML)? 

### CI and Cloud Deployment

The text of the challenge indicated that the best case for this implementation would be that it runs as a cloud function. Deployment and CI are weak areas for me and are two skills I want to develop in my next position. I would like to chat about this, but first, speaking from not much experience, I would say that:

1. The source code should be run inside a container to avoid environmental dependencies such as the ones on my local development machine. Tools like Docker or Kontena can be used for this.

2. Care should be taken to avoid failing CORS requests.

3. OAuth procedures should be secure and sensitive information should be kept safely and only ever sent encrypted over HTTPS. 

### Error Handling

There is room for improvement in error-handling in the delivered JavaScript. In the interest of time, I haven't done QA but uncaught promise rejections should be properly handled in production-level code.

## Troubleshooting

The development environment was:

- MacBook Pro
- Mojave OS (10.14 )
- Node v11.13.0
- npm 6.7.0
- MongoDB 4.0
