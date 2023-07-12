const portinfo = async (req, res) => {

    return res.status(200).json({test:1}); // 200: OK
};
exports.portinfo = portinfo;