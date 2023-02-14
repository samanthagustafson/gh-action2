const APPSCAN_CODESWEEP = 'AppScan CodeSweep';

const fs = require('fs');
const { Octokit } = require('@octokit/rest');
const core = require('@actions/core');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  baseUrl: process.env.GITHUB_API_URL,
  userAgent: APPSCAN_CODESWEEP
})

const ownerRepo = process.env.GITHUB_REPOSITORY.split('/');
const owner = ownerRepo[0];
const repo = ownerRepo[1];

const baseBranch = process.env.GITHUB_HEAD_REF;
const headBranch = baseBranch+'-withCodeFix';

const headNumber = process.env.GITHUB_REF_NAME.split('/')[0];
var newTree = [];
var treeIndex = 0;

function fillOutCommitTree(file, fileContents) { //new fileContents OR null if none

  if(fileContents != null){ 
    newTree[treeIndex] = { path: file, mode: '100644', content: fileContents };
    treeIndex++;
  }
}

async function performFixAndCreatePR() {
  var latestCommitSha;
  var treeSha;
  var newTreeSha;
  var newCommitSha;
  var headTitle;
  var baseNumber;

  return new Promise((resolve, reject) => {
    octokit.repos.listCommits({
      owner: owner,
      repo: repo,
    })
    .then((response) => {
      latestCommitSha = response.data[0].sha;
      treeSha = response.data[0].commit.tree.sha;
      return octokit.git.createTree({
        owner: owner,
        repo: repo,
        base_tree: treeSha,
        tree: newTree
      });
    })
    .then((response) => {
      newTreeSha = response.data.sha;
      core.info('[CodeSweep] Creating commit with code fixes...');
      return octokit.git.createCommit({
        owner: owner,
        repo: repo,
        message: `Applied code fixes`,
        tree: newTreeSha,
        parents: [latestCommitSha]
      });
    })
    .then((response) => {
      newCommitSha = response.data.sha;
      core.info(`[CodeSweep] Creating new branch: ${headBranch}...`);
      return octokit.git.createRef({
        owner: owner,
        repo: repo,
        ref: `refs/heads/${headBranch}`, 
        sha: newCommitSha,
      });
    })
    .then((response) => {
      return octokit.pulls.get({
        owner: owner,
        repo: repo,
        pull_number: headNumber,
      });
    })
    .then((response) => {
      headTitle = response.data.title;
      core.info('[CodeSweep] Creating pull request...');
      return octokit.pulls.create({
        owner: owner,
        repo: repo,
        head: headBranch, //code fix branch
        base: baseBranch, //user branch
        title: `${headTitle}-withCodeFixes`,
        body: `This PR was automatically created by AppScan CodeSweep. CodeSweep has applied the suggested code fixes to PR ${headNumber}.`,
      });
    })
    .then((response) => {
      core.info('[CodeSweep] Pull request created.');
      baseNumber = response.data.html_url;

      //comment with link to original PR
      return octokit.issues.createComment({
        owner,
        repo,
        issue_number: headNumber,
        body: `AppScan CodeSweep has created a copy of this branch and automatically applied the suggested code fixes. Approve and merge PR ${baseNumber} first.`
      });
    })
    .catch((error) => {
      core.info("Caught error: " + error);
      reject(error);
    })
    resolve();
  })
};

module.exports = { fillOutCommitTree, performFixAndCreatePR }
