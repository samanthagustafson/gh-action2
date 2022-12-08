const APPSCAN_CODESWEEP = 'AppScan CodeSweep';

const fs = require('fs');
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  baseUrl: process.env.GITHUB_API_URL,
  userAgent: APPSCAN_CODESWEEP
})
const ownerRepo = process.env.GITHUB_REPOSITORY.split('/');
const owner = ownerRepo[0];
const repo = ownerRepo[1];

const baseBranch = process.env.GITHUB_HEAD_REF;
const headBranch = baseBranch+'-withCodeFix';   //name of new branch we create off of the base

const headNumber = process.env.GITHUB_REF_NAME.split('/')[0];
var files = ['test_file1', 'test_file2', 'test_file3'];
var fileContents = ['Contents', null, 'contents2'];
var fileName = 'test_file';
var updatedFile = 'Cookie var;\nvar.setHttpOnly(true);\n\nsession.getCookie().setHttpOnly(true);\n\nmyCookie.setHttpOnly(true);\n\ngetCookie("sessionID", config)\n. setHttpOnly (  true  );\n\n//GOOD CODE\nvar1.setHttpOnly(false);\n\nsession.getCookie().setHttpOnly(true);';
var file2 = '';
var newTree = [];

async function loopOverFindingsMap(file, index) { //stand in loopOverFindingsMap
  if(fileContents[index] == null){
    return null;
  }
  return fileContents[index];
}

async function fillOutTree() {
  for(let i=0; i<files.length; i++){
    var res = null;
    res = await loopOverFindingsMap(files[i], i);
    console.log(res);
    if(res === null){
      console.log("WE ARE NULL");
    } else {
      newTree[i] = JSON.stringify({ file: files[i], mode: '100644', content: res });
      if((i+1) < files.length){
        newTree[i] = newTree[i]+",";
      }
    }
  }
  console.log("newTree=" + newTree[0] +" "+ newTree[1] +" "+ newTree[2]);
}

const main = async () => {
  fillOutTree();

  let response = await octokit.repos.listCommits({
      owner: owner,
      repo: repo,
  });

  const latestCommitSha = response.data[0].sha;
  const treeSha = response.data[0].commit.tree.sha;

  response = await octokit.git.createTree({
    owner: owner,
    repo: repo,
    base_tree: treeSha,
    /*tree: [
      { path: fileName, mode: '100644', content: updateFile(fileName, updatedFile) }, //this would be the code fixes
    ]*/
    newTree
  });
    
  const newTreeSha = response.data.sha;
  console.log('[CodeSweep] Creating commit with code fixes...');
  response = await octokit.git.createCommit({
    owner: owner,
    repo: repo,
    message: `Applied code fixes`,
    tree: newTreeSha,
    parents: [latestCommitSha]
  });
  const newCommitSha = response.data.sha;

  console.log(`[CodeSweep] Creating new branch: ${headBranch}...`);
  await octokit.git.createRef({
    owner: owner,
    repo: repo,
    ref: `refs/heads/${headBranch}`, 
    sha: newCommitSha,
  });

  response = await octokit.pulls.get({
    owner: owner,
    repo: repo,
    pull_number: headNumber,
  });
  const headTitle = response.data.title;

  console.log('[CodeSweep] Creating pull request...');
  response = await octokit.pulls.create({
    owner: owner,
    repo: repo,
    head: headBranch, //code fix branch
    base: baseBranch, //user branch
    title: `${headTitle}-withCodeFixes`,
    body: `This PR was automatically created by AppScan CodeSweep. CodeSweep has applied the suggested code fixes to the PR#${headNumber}.`,
  });
  console.log('[CodeSweep] Pull request created.');

  const baseNumber = response.data.html_url;

  //comment with link to original PR
  octokit.issues.createComment({
    owner,
    repo,
    issue_number: headNumber,
    body: `AppScan CodeSweep has created a copy of this branch and automatically applied the suggested code fixes. Approve and merge ${baseNumber} first.`
  });
};

main();
