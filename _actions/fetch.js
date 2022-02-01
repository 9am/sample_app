module.exports = async ({ github, context, core }) => {
    const query = `query lastIssues($owner: String!, $repo: String!, $num: Int = 100, $after: String) {
      repository(owner:$owner, name:$repo){
        issues(first:$num, after:$after, orderBy:{field:CREATED_AT, direction:DESC}, filterBy:{createdBy:$owner}) {
          pageInfo {
            hasNextPage,
            endCursor
          }
          nodes {
            id,
            title,
            body,
            publishedAt,
            number,
            labels(first:10) {
              nodes {
                name
              }
            }
          }
        }
      }
    }`;
    const variables = {
        owner: context.repo.owner,
        repo: context.repo.repo,
        num: 100,
    }
    const fetchAll = async () => {
        let output = [];
        let hasNextPage = true;
        let after = null;
        while (hasNextPage) {
            const test = github.graphql(
            // const { repository: { issues } } = github.graphql(
                query,
                {...variables, after},
            );
                console.log(test);
hasNextPage = false;
            const issues = test.repository.issues;
            hasNextPage = issues.pageInfo.hasNextPage;
            after = issues.pageInfo.endCursor;
            output = [...output, ...issues.nodes];
        }
        return output;
    };

    core.info('fetching start');
    const list = await fetchAll();
    core.info('fetching end: ${list.length}');
    return list;
}
