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
var fileName = 'test_file';
var updatedFile = 'This is the new file contents.\n We have replaced the old contents.';
function updateFile(file, newContents) {
    
  fs.writeFile(file, newContents, function (err) {
    if (err) {
      return console.log(err);
    }
  });

  return file;
}

const main = async () => {

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
    tree: [
      { path: fileName, mode: '100644', content: updateFile(fileName, updatedFile) }, //this would be the code fixes
    ]
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
