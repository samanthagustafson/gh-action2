const { Octokit } = require('@octokit/rest');
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  baseUrl: process.env.GITHUB_API_URL,
  userAgent: APPSCAN_CODESWEEP
})
const ownerRepo = process.env.GITHUB_REPOSITORY.split('/');
const url =  '/repos/'+owner+'/'+repo+'/{path}'; // leave this as is
const ref =  'heads/master';
const owner = ownerRepo[0];
const repo = ownerRepo[1];

/*
const pushContents = async () => {
  const commits = await octokit.repos.listCommits({
      owner,
      repo,
  });

  const latestCommitSHA = commits.data[0].sha;
}
//pretend user has already opened initial PR against default branch, which triggered codesweep to run
//pretend suggested fixes were selected and copied

//next step: create new branch to hold code fixes
//to get current branch name need to parse the PR JSON for head.ref 
// https://stackoverflow.com/questions/15096331/github-api-how-to-find-the-branches-of-a-pull-request

octokit.rest.git.createRef({
  owner: ownerRepo[0],
  repo: ownerRepo[1],
  ref, //refs/<>/<>-withCodeFix
  sha,
});
*/
 
//then: create PR to merge new branch into original
//https://octokit.github.io/rest.js/v18#pulls-create

octokit.rest.pulls.create({
  owner: ownerRepo[0],
  repo: ownerRepo[1],
  head: 'test01', //new with fixes branch
  base: 'main', //original user branch
  title: 'This is a PR',
  body: 'This is the body',
}).then(data => console.log("The pullrequest was successfuly created!"));
