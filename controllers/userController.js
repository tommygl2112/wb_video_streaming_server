const User = require("../models/userModel");
const Video = require("../models/videoModel");
const bcrypt = require("bcryptjs");
const jwt = require("../utils/jwt");
const nodemailer = require("nodemailer");
const jsonwebtoken = require("jsonwebtoken");
const { JWT_SECRET_KEY } = require("../constants");
const fs = require("fs");
const path = require("path");

async function test(req, res) {
  return res.status(200).send({ msg: "test" });
}

async function register(req, res) {
  const { email, password, birthday, url } = req.body;

  if (!email) res.status(400).send({ msg: "email required" });
  if (!password) res.status(400).send({ msg: "password required" });
  if (!birthday) res.status(400).send({ msg: "birthday required" });

  // search for existing email
  const userExists = await User.findOne({ email: email });
  if (userExists) {
    return res.status(400).send({ msg: "email already exists" });
  }

  const user = new User({
    email: email,
    password: password,
    birthday: birthday,
    //default no-premium
    premium: {
      isPremium: false,
      expirationDate: null,
    },
    createdDay: Date.now(),
    verified: false,
    credits: 0,
    videos: [],
    adds: [],
    picture: "",
    website: url,
  });

  //encripting password
  const salt = bcrypt.genSaltSync(10);
  const hashPassword = bcrypt.hashSync(password, salt);
  user.password = hashPassword;

  // save user in DB
  await user
    .save()
    .then((value) => {
      // creating verification token
      const token = jwt.createAccessToken(value);

      // email service configuration
      const transporter = nodemailer.createTransport({
        // SMTP server configuration
        host: "smtp.ipower.com",
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
          user: "support@westboundstudios.com",
          pass: "Merida$123",
        },
        tls: { rejectUnauthorized: false },
      });

      // sending email
      transporter.sendMail({
        // configuration
        from: "support@westboundstudios.com",
        to: email,
        subject: "Verify your Account",
        text: "Contenido del correo electrónico en texto sin formato",
        html: `<img src="cid:wb-logo"/>
      <h1>Verify your Email</h1>
      <p>Pleace click the link below to verify your email address.</p>
      <p><a href="${url}/EmailVerification?token=${token}">Verify your account</a></p>
      <p>If you have any question you can reply this email to contact support.</p>
      <p>Thank you,</p>
      <p>Westbound Studios Support.</p>
      `,
        attachments: [
          {
            filename: `wb-logo.jpg`,
            path: `assets/wb-logo.jpg`,
            cid: "wb-logo",
          },
        ],
      });

      res.status(200).send(value);
    })
    .catch((error) => {
      res.status(400).send({ msg: "Error" });
    });
}

async function verifyEmail(req, res) {
  const token = req.params.token;

  jsonwebtoken.verify(token, JWT_SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).send("Invalid token");
    // El token es válido, hacer lo que se necesite con la información decodificada (por ejemplo, obtener el ID del usuario)
    const userId = decoded.user_id;
    User.findByIdAndUpdate(userId, { verified: true }).then((updatedUser) => {
      // Devolver una respuesta exitosa
      res.send(`User verifyed!`);
    });
  });
}

async function resentVerificationEmail(req, res) {
  const { email, url } = req.body;

  User.findOne({ email })
    .then((value) => {
      if (value.verified) {
        return res.status(400).send({ msg: "Email already" });
      }

      // creating verification token
      const token = jwt.createAccessToken(value);

      // email service configuration
      const transporter = nodemailer.createTransport({
        // SMTP server configuration
        host: "smtp.ipower.com",
        port: 465,
        secure: true,
        auth: {
          user: "support@westboundstudios.com",
          pass: "Merida$123",
        },
        tls: { rejectUnauthorized: false },
      });

      // sending email
      transporter.sendMail({
        // configuration
        from: "support@westboundstudios.com",
        to: email,
        subject: "Verify your Account",
        text: "Contenido del correo electrónico en texto sin formato",
        html: `<img src="cid:wb-logo"/>
  <h1>Verify your Email</h1>
  <p>Pleace click the link below to verify your email address.</p>
  <p><a href="${url}/EmailVerification?token=${token}">Verify your account</a></p>
  <p>If you have any question you can reply this email to contact support.</p>
  <p>Thank you,</p>
  <p>Westbound Studios Support.</p>
  `,
        attachments: [
          {
            filename: `wb-logo.jpg`,
            path: `assets/wb-logo.jpg`,
            cid: "wb-logo",
          },
        ],
      });

      return res.status(200).send({ msg: `Message forwarded to ${email}` });
    })
    .catch((error) => {
      return res.status(400).send(error);
    });
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email) res.status(400).send({ msg: "email required" });
  if (!password) res.status(400).send({ msg: "password required" });

  User.findOne({ email })
    .then((value) => {
      if (!value.verified) {
        return res.status(400).send({ msg: "Email not verified" });
      }

      bcrypt.compare(password, value.password, (bcryptError, check) => {
        if (bcryptError) {
          res.status(500).send({ msg: "Server error" });
        } else if (!check) {
          res.status(400).send({ msg: "Wrong password" });
        } else {
          res.status(200).send({
            access: jwt.createAccessToken(value),
            refresh: jwt.createRefreshToken(value),
          });
        }
      });
    })
    .catch((error) => {
      res.status(400).send({ msg: "Wrong Email" });
    });
}

async function refreshAccessToken(req, res) {
  const { token } = req.body;

  if (!token) res.status(400).send({ msg: "token required" });

  const { user_id } = jwt.decoded(token);

  User.findOne({ _id: user_id })
    .then((value) => {
      res.status(200).send({
        accessToken: jwt.createAccessToken(userStorage),
      });
    })
    .catch((error) => {
      res.status(500).send({ msg: "Server error" });
    });
}

async function updateUserCredits(req, res) {
  const id = req.body.id;
  const rewardCredits = parseInt(req.body.credits);
  const user = await User.findById(id);
  const userCredits = parseInt(user.credits);
  const newCredits = userCredits + rewardCredits;

  await User.findByIdAndUpdate(id, { credits: newCredits })
    .then((updatedUser) => {
      // Devolver una respuesta exitosa
      return res.status(200).send(updatedUser);
    })
    .catch((error) => {
      return res.status(400).send({ msg: "error" });
    });
}

async function logedUser(req, res) {
  const token = req.body.token;
  jsonwebtoken.verify(token, JWT_SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).send("Invalid token");
    // El token es válido, hacer lo que se necesite con la información decodificada (por ejemplo, obtener el ID del usuario)
    const userId = decoded.user_id;
    User.findById(userId)
      .then((user) => {
        if (user) {
          return res.status(200).send(user);
        }
      })
      .catch((error) => {
        console.error(error);
      });
  });
}

async function uploadProfilePicture(req, res) {
  if (!req.body.id) {
    return res.status(400).json({ error: "body required" });
  }

  const userId = req.body.id;

  if (!req.files || !req.files.image) {
    return res.status(400).json({ error: "Se debe enviar una imagen" });
  }

  const image = req.files.image;
  const imagePath = image.path;
  const filePath = getFilePath(imagePath);

  User.findByIdAndUpdate(userId, { picture: filePath }).then((updatedUser) => {
    return res.status(200).json(updatedUser);
  });
}

function getFilePath(file) {
  const filePath = file;
  const fileSplit = filePath.split("/");
  return `/${fileSplit[2]}`;
}

async function updatePremium(req, res) {
  const userId = req.body.id;
  User.findByIdAndUpdate(userId, { "premium.isPremium": true }).then(
    (updatedUser) => {
      // Devolver una respuesta exitosa
      return res.status(200).json(updatedUser);
    }
  );
}

async function getTotalUsers(request, response) {
  try {
    const count = await User.countDocuments();
    return response.status(200).json({ total: count });
  } catch (error) {
    return response
      .status(500)
      .json({ error: "Error al obtener el número total de usuarios" });
  }
}

async function getAllUsers(request, response) {
  try {
    const users = await User.find();
    return response.status(200).json({ users });
  } catch (error) {
    return response.status(500).json({ error: "Error al obtener los usuarios" });
  }
}

async function addCheckLaterVideos(req, res) {
  try {
    const { user_id, video_id } = req.body;

    const options = {
      new: true, // Devolver el documento actualizado
      runValidators: true, // Ejecutar las validaciones del esquema
    };
    const user = await User.findById(user_id);

    if (!user_id)
      return res.status(400).json({ error: "User_id field missing" });
    if (!video_id)
      return res.status(400).json({ error: "Video_id field missing" });
    if (!user)
      return res
        .status(404)
        .json({ error: "No User with given user_id was found" });
    if (!user.checkLaterVideos) user.checkLaterVideos = [];
    if (user.checkLaterVideos.some((i) => i === video_id))
      return res
        .status(400)
        .json({ error: "Given video_id is already in the list" });

    let arr = user.checkLaterVideos;
    arr.push(video_id);

    const userUpdated = await User.findByIdAndUpdate(
      user_id,
      { checkLaterVideos: arr },
      options
    );

    return res.status(200).json({ userUpdated });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error when trying to add a video to check later section",
    });
  }
}

async function removeCheckLaterVideos(req, res) {
  try {
    const { user_id, video_id } = req.body;
    const user = await User.findById(user_id);

    const options = {
      new: true, // Devolver el documento actualizado
      runValidators: true, // Ejecutar las validaciones del esquema
    };

    if (!user_id)
      return res.status(400).json({ error: "User_id field missing" });
    if (!video_id)
      return res.status(400).json({ error: "Video_id field missing" });
    if (!user)
      return res
        .status(404)
        .json({ error: "No User with given user_id was found" });
    if (!user.checkLaterVideos || user.checkLaterVideos.length === 0)
      return res.status(404).json({ error: "There is no video to remove" });

    let arr = user.checkLaterVideos;
    console.log(arr);
    const index = arr.indexOf(video_id);
    arr.splice(index, 1);
    console.log(arr);
    const userUpdated = await User.findByIdAndUpdate(
      user_id,
      { checkLaterVideos: arr },
      options
    );

    return res.status(200).json({ userUpdated });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error when trying to remove a video from check later section",
    });
  }
}

async function listCheckLaterVideos(req, res) {
  try {
    const { user_id, website } = req.body;
    const user = await User.findById(user_id);

    if (!user_id)
      return res.status(400).json({ error: "User_id field missing" });
    if (!user)
      return res
        .status(404)
        .json({ error: "No User with given user_id was found" });
    if (!user.checkLaterVideos || user.checkLaterVideos.length === 0)
      return res.status(404).json({ error: "There are no videos to show" });

    const videos = await Video.find({ _id: { $in: user.checkLaterVideos }, website: website,
      status: "public" }).populate("models.model", "name");

    return res.status(200).json({ videos });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: "Error when trying to get videos from check later section",
    });
  }
}

module.exports = {
  test,
  register,
  login,
  refreshAccessToken,
  verifyEmail,
  updateUserCredits,
  logedUser,
  uploadProfilePicture,
  updatePremium,
  resentVerificationEmail,
  getAllUsers,
  getTotalUsers,
  addCheckLaterVideos,
  removeCheckLaterVideos,
  listCheckLaterVideos,
};
