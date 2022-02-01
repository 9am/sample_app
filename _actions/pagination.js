module.exports = ({ github, context, core, pageSize }) => {
    const paginate = (input = [], size = 10) => {
        const list = [...input];
        const totalCount = list.length;
        return Array
            .from({ length: Math.ceil(list.length / size) })
            .map((_, i) => i)
            .reduce(
                (memo, pageNum) => {
                    const nodes = list.splice(0, size);
                    const [next = {}] = list;
                    return [
                        ...memo,
                        {
                            nodes,
                            totalCount,
                            pageInfo: {
                                hasNextPage: !!next.id,
                                endCursor: next.id,
                            },
                        }
                    ];
                },
                [],
            );
    };
    core.info(`pagination start: ${process.env.DATA.length}, ${pageSize}`);
    const pages = paginate(process.env.DATA, pageSize);
    core.info(`pagination end: ${pages.length}`);
    return pages;
}
