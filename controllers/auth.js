const { response } = require('express');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { generarJWT } = require('../helpers/generarToken');

const createUser = async ( req, res = response ) => {

  const { email, password } = req.body;

  try {
    
    let user = await User.findOne({email: email});

    if(user){
      return res.status(400).json({
        ok: false,
        message: 'Ya existe un usuario con ese correo'
      });
    }

    user = new User(req.body);

    // Cifrar contraseña
    const cadenaAleatoria = bcrypt.genSaltSync();
    user.password = bcrypt.hashSync( password, cadenaAleatoria );

    await user.save();

    const token = await generarJWT(user.name, user.id);

    res.status(201).json({
      ok: true,
      name: user.name,
      lastName: user.lastName,
      uid: user.id,
      token
    });
    
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Ha ocurrido un error en el servidor'
    });
    
  }

}

const loginUser = async(req, res = response) => {

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email: email });

    if(!user) {
      return res.status(400).json({
        ok: false,
        message: 'No existe un usuario con ese email'
      });
    }

    const validPassword = bcrypt.compareSync(password, user.password);

    if(!validPassword){
      return res.status(400).json({
        ok: false,
        message: 'Contraseña incorrecta'
      });
    }

    const token = await generarJWT(user.name, user.id)

    res.json({
      ok: true,
      uid: user.id,
      name: user.name,
      lastName: user.lastName,
      token
    });

  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Ha ocurrido un error en el servidor'
    });    
  }
};

const revalidateToken = async(req, res = response) => {
  const name = req.name;
  const uid = req.uid;

  const token = await generarJWT(name, uid);

  res.json({
      ok: true,
      name,
      uid,
      token 
  });
}

module.exports = {
  loginUser,
  createUser,
  revalidateToken
}