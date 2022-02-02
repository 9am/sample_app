const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports = async ({ github, context, core }) => {
    const pages = JSON.parse(process.env.DATA);
    core.info(`write start: ${pages.length}`);
    exec('rm ./docs/data/*')
    await Promise.all(pages.map((page, index) => exec(`echo ${JSON.stringify(page, null, 2)} > ./docs/data/${index}.json`)));
    core.info(`write end: ${pages.length}`);
}
