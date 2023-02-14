
const fs = require('fs');
const got = require('got');
const FormData = require('form-data');
const core = require('@actions/core');

const URL = 'http://localhost:';
const PORT = process.env.SERVER_PORT ? process.env.SERVER_PORT : '9221';
const API_SCAN_FILE = '/v1/scanFile';
const API_LOGIN = '/v1/asoc/login';
const API_HEALTH = '/actuator/health';
const API_ARTICLE = '/web/article_basic';
const API_FIXCODE = '/v1/fixCode';
const FILE_PATH_PARAM = '?filePath=';
const API_PARAM = 'api=';
const ISSUE_TYPE_PARAM = 'issuetype=';
const FIX_NAME_PARAM = 'fixName=';
const CODE_PARAM = 'code=';

var file = "CookieHttpOnlyAPIJava.java";
var files = ['CookieHttpOnlyAPIJava.java'];
var fileContents = ['//This is a line before.\nHttpCookie var;\nvar.setSecure(true);\n\nsession.getCookie().setSecure(true);\n\nmyCookie.setSecure(true);\n\ngetCookie("sessionID", config)\n. setSecure (  true  );\n\n//GOOD CODE\nvar1.setSecure(false);\n\nsession.getCookie().setSecure(true);\n\n//This is the final text.', '', ''];
var updatedFile = 'Cookie var;\nvar.setHttpOnly(true);\n\nsession.getCookie().setHttpOnly(true);\n\nmyCookie.setHttpOnly(true);\n\ngetCookie("sessionID", config)\n. setHttpOnly (  true  );\n\n//GOOD CODE\nvar1.setHttpOnly(false);\n\nsession.getCookie().setHttpOnly(true);';

scanFile(file)
.then((response) => {
    return scanFiles(file);
    //return service.loopOverFindingsMap(response.body, file); old
})
.then((findingsMap) => {
	return applyfixes.reviewFindingsMap(findingsMap);
})
.then((rep) => {
    //console.log(rep);
})

var fileMap = new Map();
var fileSet = new Set();
fileSet.add(parseInt("2", 10));
fileSet.add(parseInt("4", 10));
fileSet.add(parseInt("6", 10));
fileSet.add(parseInt("8", 10));

function scanFiles(file) {
    fileMap.set(file, fileSet);
    return new Promise((resolve, reject) => {
        let count = 0;
        let issues = new Map();
        for (const [file, lines] of fileMap.entries()) {
            scanningFile(file, lines)
            .then((findings) => { //RESPONSE JSON DATA
                if(findings)
                    issues.set(file, findings);
                if(++count === fileMap.size){
                    resolve(issues);
                }
            })
            .catch((error) => {
                reject(error);
            })
        }
    });
}
function scanningFile(file, lines) {
    return new Promise((resolve) => {
        scanFile(file)
        .then((response) => {
            let responseJson = JSON.parse(response.body);
            if(responseJson.length === 0 || responseJson.findings.length === 0) {
                resolve();
                return;
            }
            else if(!lines || lines.size === 0) {
                resolve(responseJson.findings);
                return;
            }
            else {
                removeExtraFindings(responseJson.findings, lines)
                .then((filteredFindings) => {
                    resolve(filteredFindings);
                    return;
                })
            }
        })
        .catch((error) => {
            if(error.response) {
                if(error.response.statusCode === 422) {
                    resolve();
                    return;
                }
                else {
                    core.error(`An error occurred scanning ${file}: ${error.response}`);
                }
            }
            else {
                core.error(`An error occurred scanning ${file}: ${error}`);
            }
            resolve();
        });
    });
}

function scanFile(file) {
    return new Promise((resolve, reject) => {
        const form = new FormData();
        form.append('scanFile', fs.createReadStream(file))
        let url = URL + PORT + API_SCAN_FILE + FILE_PATH_PARAM + encodeURIComponent(file);

        got.post(url, { body: form, retry: { limit: 3, methods: ["GET", "POST"] } })
        .then((response) => {
            resolve(response);
        })
        .catch((error) => {
            reject(error);
        })
    })
}

function removeExtraFindings(findings, lines) {
    return new Promise(resolve => {
        let ret = [];
        let count = 0;

        findings.forEach(finding => {
            if(lines.has(finding.lineNumber))
                ret.push(finding);
            if(++count === findings.length)
                resolve(ret);
        });
    });
}
async function loopOverFindingsMap(findingsMap, file){
    var data = JSON.parse(findingsMap);
    var fixedCode;
    var fileContents = 0;
    
    for(let i = 0; i<data.findings.length; i++) {
        if(data.findings[i].codeFixes.length!=0){
        await getCodeFix(data.findings[i].codeFixes[0].name, data.findings[i].context)
        .then((response) => {
            fixedCode = response.body;
        })
        
        fileContents = performCodeFix(file, data.findings[i].context, fixedCode);
        }
    }
    return fileContents; //if no fix, returns null but if fix happened, return new contents
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

    fs.readFile(file, function (err, content) { 
        if (err) {
            return console.log(err);
        }

        replaced = content.toString().replace(oldCode, newCode); 
        console.log(newCode);
        fs.writeFile(file, replaced, function (err) {
            if (err) {
                return console.log(err);
            }
        });
    });
    
    return replaced; //return new file contents
}

module.exports = { checkServerStatus, scanFile, asocLogin, getArticle, loopOverFindingsMap, getCodeFix, performCodeFix, scanFiles }
