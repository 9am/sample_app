module.exports = async ({ github, context, core }) => {
    const query = `query($owner:String!, $name:String!) {
      repository(owner:$owner, name:$name){
        issues(first:100) {
          nodes {
            id,
            title,
            body,
            publishedAt,
            url,
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
      name: context.repo.repo
    }
    const result = await github.graphql(query, variables)
    const output = JSON.stringify(result.repository.issues, null, 2)
    console.log('output', output);
    return output
}
