module.exports = ({ github, context, core }) => {
    core.info('pagination start', process.env.DATA);
    return process.env.DATA;
}
