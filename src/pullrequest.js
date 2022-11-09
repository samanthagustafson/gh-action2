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

const baseBranch = process.env.GITHUB_HEAD_REF; //name of base branch of PR
const headBranch = baseBranch+'-withCodeFix';   //name of new branch we create off of the base

const main = async () => {

  const commits = await octokit.repos.listCommits({
      owner,
      repo,
  });

  const latestCommitSha = commits.data[0].sha;
  const treeSha = commits.data[0].commit.tree.sha

  response = await octokit.git.createTree({
    owner,
    repo,
    base_tree: treeSha,
    tree: [
      { path: 'test_file', mode: '100644', content: '' }, //this would be the code fixes
    ]
  });
  const newTreeSha = response.data.sha;

  console.log('[CodeSweep] Creating commit with code fixes...')
  response = await octokit.git.createCommit({
    owner,
    repo,
    message: `[AppScan CodeSweep] Applied code fixes to ${baseBranch} branch`,
    tree: newTreeSha,
    parents: [latestCommitSha]
  });
  const newCommitSha = response.data.sha;

  console.log(`[CodeSweep] Creating branch ${headBranch}...`)
  await octokit.git.createRef({
    owner: owner,
    repo: repo,
    ref: `refs/heads/${headBranch}`, //refs/heads/${baseBranch}-withCodeFix
    sha: newCommitSha,
  });

//then: create PR to merge new branch into original
//https://octokit.github.io/rest.js/v18#pulls-create

  console.log('[CodeSweep] Creating pull request...');
  octokit.rest.pulls.create({
    owner: owner,
    repo: repo,
    head: headBranch, //new with fixes branch
    base: baseBranch, //original user branch
    title: `${baseBranch}-withCodeFixes`,
    body: `${baseBranch} with AppScan CodeSweep code fixes applied.`,
  });
  console.log('[CodeSweep] Pull request created.');

};
main();
