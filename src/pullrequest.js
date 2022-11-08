const APPSCAN_CODESWEEP = 'AppScan CodeSweep';

const { Octokit } = require('@octokit/rest');
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  baseUrl: process.env.GITHUB_API_URL,
  userAgent: APPSCAN_CODESWEEP
})
const ownerRepo = process.env.GITHUB_REPOSITORY.split('/');
const owner = ownerRepo[0];
const repo = ownerRepo[1];
const head = 'new-branch'; //name of new branch we create
const base = 'test03'; //name of branch of PR


const main = async () => {
  console.log('getting latest commit sha')
  const commits = await octokit.repos.listCommits({
      owner,
      repo,
  });
  const latestCommitSHA = commits.data[0].sha;
  console.log(`commit sha: ${latestCommitSha}`);
  
//pretend user has already opened initial PR against default branch, which triggered codesweep to run
//pretend suggested fixes were selected and copied

//next step: create new branch to hold code fixes
//to get current branch name need to parse the PR JSON for head.ref 
// https://stackoverflow.com/questions/15096331/github-api-how-to-find-the-branches-of-a-pull-request
  
  /*const baseBranchRef = await octokit.git.getRef({
    owner,
    repo,
    ref: `refs/heads/${baseBranch}`,
  });*/
  console.log(`creating branch ${head}`)
  const newBranchRef = await octokit.git.createRef({
    owner: owner,
    repo: repo,
    ref: `refs/heads/${head}`, //refs/<>/<>-withCodeFix
    sha: baseBranchRef.data.object.sha,
  });

//then: create PR to merge new branch into original
//https://octokit.github.io/rest.js/v18#pulls-create

  console.log('creating pull request');
  octokit.rest.pulls.create({
    owner: owner,
    repo: repo,
    head: head, //new with fixes branch
    base: base, //original user branch
    title: 'PR title',
    body: 'PR body',
  });
  console.log('Pull request created');

}