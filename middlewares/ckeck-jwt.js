const { response } = require('express');
const jwt = require('jsonwebtoken');

const checkJWT = (req, res = response, next) => {

    const token = req.header('token');

    if(!token) {
      return res.status(401).json({
        ok: false,
        message: 'No existe token dentro de la petición'
      });
    }

    try {
      const payload = jwt.verify(
        token,
        process.env.SECRET_KEY_JWT  
      );

      req.name = payload.name;
      req.uid = payload.uid;

    } catch (error) {
      return res.status(401).json({
        ok: false,
        token: 'El token no es válido'
      });
      
    }

    next();
}

module.exports = {
  checkJWT
}