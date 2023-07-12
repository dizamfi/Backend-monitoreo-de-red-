const { Router } = require("express");
const router = Router();
const { check } = require("express-validator");
const { checkFields } = require("../middlewares/check-fields");
const { loginUser, createUser, revalidateToken } = require("../controllers/auth");
const { checkJWT } = require("../middlewares/ckeck-jwt");

router.post(
  '/login',
  [
    //middlewares
    check("email", "El correo es obligatorio").isEmail(),
    check(
      "password",
      "La contraseña debe tener al menos 8 caracteres"
    ).isLength({ min: 8 }),
    checkFields,
  ],
  loginUser
);

router.post(
  '/create',
  [
    //middlewares
    check("name", "El nombre es obligatorio").not().isEmpty(),
    check("lastName", "El apellido es obigatorio").not().isEmpty(),
    check("email", "El correo es obligatorio").isEmail(),
    check(
      "password",
      "La contraseña debe tener al menos 8 caracteres"
    ).isLength({ min: 8 }),
    checkFields,
  ],
  createUser
);

router.get('/validarUser', checkJWT, revalidateToken);
module.exports = router;
