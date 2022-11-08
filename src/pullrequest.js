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

const base = 'test03';              //name of branch of PR
const head = base+'-withCodeFix';   //name of new branch we create

const main = async () => {
  console.log('[CodeSweep] Getting latest commit SHA...')
  const commits = await octokit.repos.listCommits({
      owner,
      repo,
  });
  
  const latestTree = commits.data[0].commit.tree;
  console.log(`tree?: ${latestTree}`);

  const latestCommitSha = commits.data[0].sha;
  const treeSha = commits.data[0].commit.tree.sha
  console.log(`[CodeSweep] Latest commit SHA: ${latestCommitSha}`);
  console.log(`[CodeSweep] Latest tree SHA: ${treeSha}`);

  console.log('[CodeSweep] Creating tree...');
  response = await octokit.git.createTree({
    owner,
    repo,
    base_tree: treeSha,
    tree: [
      { path: 'test_file', mode: '100644', content: '' },
    ]
  });
  const newTreeSha = response.data.sha;
  console.log(`[CodeSweep] Created tree: ${newTreeSha}`);
//pretend user has already opened initial PR against default branch, which triggered codesweep to run
//pretend suggested fixes were selected and copied

//next step: create new branch to hold code fixes
//to get current branch name need to parse the PR JSON for head.ref 
// https://stackoverflow.com/questions/15096331/github-api-how-to-find-the-branches-of-a-pull-request
  console.log('[CodeSweep] Creating commit...')
  response = await octokit.git.createCommit({
    owner,
    repo,
    message: '[AppScan CodeSweep] Applied code fixes',
    tree: newTreeSha,
    parents: [latestCommitSha],
    author: {
      name: 'First Last',
      email: 'name@email.com'
    }
  });
  const newCommitSha = response.data.sha;
  console.log(`[CodeSweep] New commit SHA: ${newCommitSha}`);

  /*const baseBranchRef = await octokit.git.getRef({
    owner,
    repo,
    ref: `refs/heads/${base}`,
  });*/
  console.log(`[CodeSweep] Creating branch ${head}...`)
  const newBranchRef = await octokit.git.createRef({
    owner: owner,
    repo: repo,
    ref: `refs/heads/${head}`, //refs/heads/${baseBranch}-withCodeFix
    sha: newCommitSha,
  });

//then: create PR to merge new branch into original
//https://octokit.github.io/rest.js/v18#pulls-create

  console.log('[CodeSweep] Creating pull request...');
  octokit.rest.pulls.create({
    owner: owner,
    repo: repo,
    head: head, //new with fixes branch
    base: base, //original user branch
    title: `${base}-withCodeFixes`,
    body: `${base} with AppScan CodeSweep Code Fixes applied.`,
  });
  console.log('[CodeSweep] Pull request created.');

};
main();
