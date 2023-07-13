const portinfo = async (req, res) => {
    const filter = req.query;
    const filteredports = await Port.filter(ports => ports.port === filter.port);
    return res.status(200).json({test:1}); // 200: OK
};
exports.portinfo = portinfo;