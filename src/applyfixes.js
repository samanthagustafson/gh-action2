const fs = require('fs');
const got = require('got');
const pullrequest = require('./pullrequest');
const core = require('@actions/core');

const URL = 'http://localhost:';
const PORT = process.env.SERVER_PORT ? process.env.SERVER_PORT : '8080';
const API_FIXCODE = '/v1/fixCode';
const FIX_NAME_PARAM = 'fixName=';
const CODE_PARAM = 'code=';

function reviewFindingsMap(findingsMap){ //findingsMap is equivalent to data.findings[i]
  return new Promise((resolve, reject) => {

    let promises = [];
    for (const [file, findings] of findingsMap.entries()) {
      promises.push(fixFindings(file, findings));
    }

    Promise.all(promises)
    .then(() => {
      pullrequest.performFixAndCreatePR();
      resolve(findingsMap);
    })
    .catch((error) => {
      reject(error);
    })

  })
}

function fixFindings(file, findings){
  var fileContents = "";

  return new Promise(async (resolve) => {
    for (var i = 0; i < findings.length; i++) {
      let finding = findings[i];
      if(finding.codeFixes.length != 0){
        await getCodeFix(finding.codeFixes[0].name, finding.context)
        .then((response) => {
          return response.body;
        })
        .then(async (fixedCode) => {
          fileContents = performCodeFix(file, finding.context, fixedCode);
        })
        .catch(() => {
          core.info("Unable to retrieve code fix.");
        })

      } else {
        fileContents = null;
      }
      
      if(i + 1 === findings.length){ //we've gone through all the findings for this file
        pullrequest.fillOutCommitTree(file, fileContents);
        resolve();
      }
    }
  })
}

function getCodeFix(name, code) {
  return new Promise((resolve, reject) => {
    let url = URL + PORT + API_FIXCODE + '?' + FIX_NAME_PARAM + name + '&' + CODE_PARAM + encodeUTF(code);
    got.post(url, { retry: { limit: 3, methods: ["GET", "POST"] } })
    .then((response) => {
      resolve(response);
    })
    .catch((error) => {
      reject(error);
    })
  })
}

//escape function is depreciated, had to create my own
function encodeUTF(input){
  encoded = encodeURIComponent(input)
  .replace(/[_!'()*]/g, function(c) {
    return '%'+c.charCodeAt(0).toString(16).toUpperCase();
  })
  return encoded;
}

function performCodeFix(file, oldCode, newCode){
  var replaced = "";
  return new Promise((resolve, reject) => {
    fs.readFile(file, function (err, content) {
      if(err) {
        reject(err);
      }

      replaced = content.toString().replace(oldCode, newCode); 

      fs.writeFile(file, replaced, function (err){
        if(err) {
          reject(err);
        }
      })
    })

    resolve(replaced); //return new file contents
  });
}

module.exports = { reviewFindingsMap }
