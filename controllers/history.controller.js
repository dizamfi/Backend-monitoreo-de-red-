const historial = async (req, res) => {
    req.body = {port:1};
    return res.status(200).json({test:1}); // 200: OK
};
exports.portinfo = portinfo;