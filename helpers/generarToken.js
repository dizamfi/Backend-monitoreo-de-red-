const jwt = require("jsonwebtoken");

const generarJWT = (name, uid) => {
  return new Promise((resolve, reject) => {
    jwt.sign(
      { uid, name },
      process.env.SECRET_KEY_JWT,
      { expiresIn: "1h" },
      (error, token) => {
        if (error) {
          reject("Hubo un error al generar el token");
        }

        resolve(token);
      }
    );
  });
};

module.exports = {
  generarJWT
}