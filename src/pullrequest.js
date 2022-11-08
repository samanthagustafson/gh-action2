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

const base = 'test03';                //name of branch of PR
const head = base+'-withCodeFix';   //name of new branch we create

const main = async () => {
  console.log('getting latest commit sha')
  const commits = await octokit.repos.listCommits({
      owner,
      repo,
  });
  const latestCommitSHA = commits.data[0].sha;
  const treeSha = response.data[0].commit.tree.sha
  console.log(`latest commit sha: ${latestCommitSha}`);

  console.log('creating tree');
  response = await octokit.git.createTree({
    owner,
    repo,
    base_tree: treeSha,
    tree: [
      { path: 'test_file', mode: '100644', content: '' },
    ]
  });
  const newTreeSha = response.data.sha;

//pretend user has already opened initial PR against default branch, which triggered codesweep to run
//pretend suggested fixes were selected and copied

//next step: create new branch to hold code fixes
//to get current branch name need to parse the PR JSON for head.ref 
// https://stackoverflow.com/questions/15096331/github-api-how-to-find-the-branches-of-a-pull-request
  console.log('creating commit')
  response = await octokit.git.createCommit({
    owner,
    repo,
    message: 'Commit message',
    tree: newTreeSha,
    parents: [latestCommitSha],
    author: {
      name: 'First Last',
      email: 'name@email.com'
    }
  });
  const newCommitSha = response.data.sha;
  console.log(`new commit sha: ${newCommitSha}`);

  /*const baseBranchRef = await octokit.git.getRef({
    owner,
    repo,
    ref: `refs/heads/${base}`,
  });*/
  console.log(`creating branch ${head}`)
  const newBranchRef = await octokit.git.createRef({
    owner: owner,
    repo: repo,
    ref: `refs/heads/${head}`, //refs/heads/${baseBranch}-withCodeFix
    sha: newCommitSha,
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

};
main();
