const Admin = require("../models/adminModel");
const jwt = require("../utils/jwt");
const fs = require('fs-extra');
const Video = require("../models/videoModel");
const jsonwebtoken = require("jsonwebtoken");
const { JWT_SECRET_KEY } = require('../constants');
const ffprobe = require('ffprobe');
const ffprobeStatic = require('ffprobe-static');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const { model } = require("mongoose");
ffmpeg.setFfmpegPath(ffmpegPath);
const path = require('path');
const { promisify } = require('util');

async function createAdmin(request, response) {
  const { user, password } = request.body

  if (!user) response.status(400).send({ msg: "user is required" });
  if (!password) response.status(400).send({ msg: "password is required" });

  const admin = new Admin({
    user: user,
    password: password
  });

  await admin.save().then((value) => {
    response.status(200).send(value);
  }).catch((error) => {
    response.status(400).send({ msg: error });
  });
}

async function login(req, res) {
  const { user, password } = req.body;

  if (!user) {
    return res.status(400).send({ msg: "User required" });
  }
  if (!password) {
    return res.status(400).send({ msg: "Password required" });
  }

  try {
    const admin = await Admin.findOne({ user });

    if (!admin) {
      return res.status(400).send({ msg: "Wrong user" });
    }

    if (password !== admin.password) {
      return res.status(400).send({ msg: "Incorrect password" });
    }

    res.status(200).send({
      access: jwt.createAccessToken(admin),
      refresh: jwt.createRefreshToken(admin),
    });
  } catch (error) {
    res.status(500).send({ msg: "Internal server error" });
  }
}

function compress(inputPath, outputPath, size) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        `-vf scale=${size}:-2`, // Escala el video a la resolución deseada manteniendo el aspecto original
        '-c:v libx264', // Utiliza el códec de video H.264
        '-crf 23', // Controla la calidad de compresión (menor valor = mejor calidad, mayor tamaño de archivo)
        '-preset medium', // Ajusta el nivel de velocidad de compresión (medium es un equilibrio entre velocidad y tamaño de archivo)
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

async function uploadNewVideo(req, res) {
  const {
    title,
    description,
    categories,
    models,
    website,
    status,
    launchDate
  } = req.body;

  if (!title) {
    return res.status(400).send({ msg: "title not found" });
  }

  if (!description) {
    return res.status(400).send({ msg: "description not found" });
  }

  if (!req.files) {
    return res.status(400).send({ msg: "No files found" });
  }

  const {
    miniature,
    linkPreview,
    linkShort,
    linkFull
  } = req.files;

  if (!miniature) {
    return res.status(400).send({ msg: "miniature not found" });
  }

  if (!linkPreview) {
    return res.status(400).send({ msg: "linkPreview not found" });
  }

  if (!linkShort) {
    return res.status(400).send({ msg: "linkShort not found" });
  }

  if (!linkFull) {
    return res.status(400).send({ msg: "linkFull not found" });
  }

  const directoryPath = website == "RGG" ? './assets/videos/' : './assets/LBT/';

  // Lee el contenido del directorio
  fs.readdir(directoryPath, async (err, files) => {
    if (err) {
      console.error('Error al leer el directorio: ', err);
      return;
    }

    // Filtra solo las carpetas que comienzan con "video"
    const videoFolders = files.filter((file) => file.startsWith('video'));

    // Ordena las carpetas alfabéticamente considerando el valor numérico
    videoFolders.sort((a, b) => {
      const numA = parseInt(a.slice(5));
      const numB = parseInt(b.slice(5));
      return numA - numB;
    });

    const lastFolder = videoFolders.pop();

    // Genera el nombre de la siguiente carpeta
    const nextFolderNumber = parseInt(lastFolder.slice(5)) + 1; // Obtiene el número de la última carpeta y le suma 1
    const nextFolderName = `video${nextFolderNumber.toString().padStart(2, '0')}`; // Crea el nombre de la siguiente carpeta
    console.log(nextFolderName);

    // Crea el directorio de la siguiente carpeta
    fs.mkdir(`${directoryPath}/${nextFolderName}`, async (err) => {
      if (err) {
        console.error('Error al crear el directorio: ', err);
        return;
      }

      // Mueve los archivos a la nueva carpeta
      const filesToMove = [miniature, linkPreview, linkShort, linkFull];
      const promises = filesToMove.map(file => {
        const oldPath = file.path;
        // console.log(oldPath);
        const newPath = `${directoryPath}/${nextFolderName}/${file.name}`;
        return fs.move(oldPath, newPath);
      });

      try {
        await Promise.all(promises);

        const videoPath = website == "RGG" ? `assets/videos/${nextFolderName}/${linkFull.originalFilename}` : `assets/LBT/${nextFolderName}/${linkFull.originalFilename}`;
        const videoPathPreview = website == "RGG" ? `assets/videos/${nextFolderName}/${linkPreview.originalFilename}` : `assets/LBT/${nextFolderName}/${linkPreview.originalFilename}`;

        const compressed480Path = `${directoryPath}/${nextFolderName}/${linkFull.originalFilename}_480p.mp4`;
        await compress(videoPath, compressed480Path, 480);

        const compressed720Path = `${directoryPath}/${nextFolderName}/${linkFull.originalFilename}_720p.mp4`;
        await compress(videoPath, compressed720Path, 720);

        const compressed1080Path = `${directoryPath}/${nextFolderName}/${linkFull.originalFilename}_1080p.mp4`;
        await compress(videoPath, compressed1080Path, 1080);

        const compressedPreviewPath = `${directoryPath}/${nextFolderName}/${linkPreview.originalFilename}_480p.mp4`;
        await compress(videoPathPreview, compressedPreviewPath, 480);

        // Obtiene la duración del video
        const videoDuration = await getVideoDuration(website == "RGG" ? `assets/videos/${nextFolderName}/${linkFull.originalFilename}` : `assets/LBT/${nextFolderName}/${linkFull.originalFilename}`);
        const videoResolution = await getVideoResolution(website == "RGG" ? `assets/videos/${nextFolderName}/${linkFull.originalFilename}` : `assets/LBT/${nextFolderName}/${linkFull.originalFilename}`);

        // Crea y guarda el objeto 'video'
        const video = new Video({
          title: title,
          description: description,
          serverLinkMiniature: website == "RGG" ? `videos/${nextFolderName}/${miniature.originalFilename}` : `LBT/${nextFolderName}/${miniature.originalFilename}`, //path 
          linkPreview: website == "RGG" ? `videos/${nextFolderName}/${linkPreview.originalFilename}_480p.mp4` : `LBT/${nextFolderName}/${linkPreview.originalFilename}_480p.mp4`, //path
          linkShort: website == "RGG" ? `videos/${nextFolderName}/${linkShort.originalFilename}` : `LBT/${nextFolderName}/${linkShort.originalFilename}`, //path
          linkFull: website == "RGG" ? `videos/${nextFolderName}/${linkFull.originalFilename}_1080p.mp4` : `LBT/${nextFolderName}/${linkFull.originalFilename}_1080p.mp4`, //path
          compressed480: website == "RGG" ? `videos/${nextFolderName}/${linkFull.originalFilename}_480p.mp4` : `LBT/${nextFolderName}/${linkFull.originalFilename}_480p.mp4`,
          compressed720: website == "RGG" ? `videos/${nextFolderName}/${linkFull.originalFilename}_720p.mp4` : `LBT/${nextFolderName}/${linkFull.originalFilename}_720p.mp4`,
          publishingDate: new Date(),
          categories: categories ? categories.map(category => ({ category: category })) : [],
          models: models ? models.map(model => ({ model: model })) : [],
          quality: videoResolution,
          duration: videoDuration, // Asigna la duración obtenida
          views: 0,
          likes: 0,
          price: Math.ceil((videoDuration / 60) / 10),
          website: website,
          status: status,
          dislikes: 0,
          // launchDate: launchDate
        });

        if (launchDate !== "null") {
          console.log("true");
          video.launchDate = launchDate;
        }

        await video.save().then((value) => {
          console.log("done");
          fs.unlink(`${directoryPath}/${nextFolderName}/${linkFull.originalFilename}`);
          fs.unlink(`${directoryPath}/${nextFolderName}/${linkPreview.originalFilename}`);
          res.status(200).send(value);
        }).catch((error) => {
          res.status(400).send({ msg: error });
        });

      } catch (error) {
        console.error('Error al mover los archivos a la nueva carpeta: ', error);
        res.status(500).send({ msg: "Error al subir el video" });
      }
    });
  });
}

async function getVideoDuration(videoPath) {
  return new Promise((resolve, reject) => {
    ffprobe(videoPath, { path: ffprobeStatic.path })
      .then((info) => {
        // console.log(info);
        const duration = info.streams[0].duration;
        resolve(duration);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

async function getVideoResolution(videoPath) {
  return new Promise((resolve, reject) => {
    ffprobe(videoPath, { path: ffprobeStatic.path })
      .then((info) => {
        // console.log(info);
        const resolution = info.streams[0].height;
        resolve(resolution);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

async function editVideo(req, res) { //=======================================================================
  const {
    videoId,
    title,
    description,
    categories,
    models,
    website,
    status,
    launchDate,
  } = req.body;

  console.log(req.body);

  // console.log(JSON.parse(categories));

  // console.log(JSON.parse(models));

  const modelsJson = JSON.parse(models);
  const categoriesJson = JSON.parse(categories);

  // console.log(modelsJson.models.length);

  const newModels = modelsJson.models;
  const newCategories = categoriesJson.categories;

  const {
    serverLinkMiniature,
    linkPreview,
    linkShort,
    linkFull
  } = req.files;

  const video = await Video.findById(videoId); // video json info from mongo
  // console.log(video);

  const videoFolder = getFilePath(`assets/${video.linkFull}`); // number of video folder: video##

  const directoryPath = website == "RGG" ? './assets/videos/' : './assets/LBT/';

  const filesToMove = [serverLinkMiniature, linkPreview, linkShort, linkFull];
  // console.log(filesToMove);

  const promises = filesToMove.map(async file => {
    if (file) {

      if (file.fieldName == 'serverLinkMiniature') {
        const previousFilePath = `assets/${video.serverLinkMiniature}`;
        console.log(fs.existsSync(previousFilePath));
        if (fs.existsSync(previousFilePath)) {
          await fs.unlink(previousFilePath);
          const oldPath = file.path;
          const newPath = video.website == "RGG" ? `assets/videos/${videoFolder}/${file.originalFilename}` : `assets/LBT/${videoFolder}/${file.originalFilename}`
          await fs.move(oldPath, newPath);
        } else {
          const oldPath = file.path;
          const newPath = video.website == "RGG" ? `assets/videos/${videoFolder}/${file.originalFilename}` : `assets/LBT/${videoFolder}/${file.originalFilename}`;
          await fs.move(oldPath, newPath);
        }

      } if (file.fieldName == 'linkPreview') {
        const previousFilePath = `assets/${video.linkPreview}`; //ruta del archivo anterior
        const videoPath = website == "RGG" ? `assets/videos/${videoFolder}/${file.originalFilename}` : `assets/LBT/${videoFolder}/${file.originalFilename}`;

        if (fs.existsSync(previousFilePath)) {
          await fs.unlink(previousFilePath);
          const oldPath = file.path;
          const newPath = video.website == "RGG" ? `assets/videos/${videoFolder}/${file.originalFilename}` : `assets/LBT/${videoFolder}/${file.originalFilename}`
          await fs.move(oldPath, newPath);

          const compressed480Path = `${directoryPath}/${videoFolder}/${file.originalFilename}_480p.mp4`;
          await compress(videoPath, compressed480Path, 480);

        } else {
          const oldPath = file.path;
          const newPath = video.website == "RGG" ? `assets/videos/${videoFolder}/${file.originalFilename}` : `assets/LBT/${videoFolder}/${file.originalFilename}`;
          await fs.move(oldPath, newPath);
        }

      } if (file.fieldName == 'linkShort') {
        const previousFilePath = `assets/${video.linkShort}`;
        if (fs.existsSync(previousFilePath)) {
          await fs.unlink(previousFilePath);
          const oldPath = file.path;
          const newPath = video.website == "RGG" ? `assets/videos/${videoFolder}/${file.originalFilename}` : `assets/LBT/${videoFolder}/${file.originalFilename}`;
          await fs.move(oldPath, newPath);
        } else {
          const oldPath = file.path;
          const newPath = video.website == "RGG" ? `assets/videos/${videoFolder}/${file.originalFilename}` : `assets/LBT/${videoFolder}/${file.originalFilename}`;
          await fs.move(oldPath, newPath);
        }

      } if (file.fieldName == 'linkFull') {

        const previousFilePath = `assets/${video.linkFull}`; // ruta del archivo anterior
        const previous720FilePath = `assets/${video.compressed720}`; // ruta del archivo anterior
        const previous480FilePath = `assets/${video.compressed480}`; // ruta del archivo anterior
        const videoPath = website == "RGG" ? `assets/videos/${videoFolder}/${file.originalFilename}` : `assets/LBT/${videoFolder}/${file.originalFilename}`;

        if (fs.existsSync(previousFilePath)) { // existe? si
          // console.log("existe link full");

          await fs.unlink(previousFilePath); //borra el archivo anterior
          const oldPath = file.path; // ruta del nuevo archivo
          const newPath = video.website == "RGG" ? `assets/videos/${videoFolder}/${file.originalFilename}` : `assets/LBT/${videoFolder}/${file.originalFilename}` // ruta para el nuevo archivo
          await fs.move(oldPath, newPath); // se mueve el archico nuevo

          const compressed1080Path = `${directoryPath}/${videoFolder}/${file.originalFilename}_1080p.mp4`;
          await compress(videoPath, compressed1080Path, 1080);

          if (fs.existsSync(previous720FilePath)) {
            console.log("previous720FilePath exist");
            await fs.unlink(previous720FilePath); //borra el archivo comprimido

            const compressed720Path = `${directoryPath}/${videoFolder}/${file.originalFilename}_720p.mp4`;
            await compress(videoPath, compressed720Path, 720);
          }

          if (fs.existsSync(previous480FilePath)) {
            console.log("previous480FilePath exist");
            await fs.unlink(previous480FilePath); //borra el archivo comprimido

            const compressed480Path = `${directoryPath}/${videoFolder}/${file.originalFilename}_480p.mp4`;
            await compress(videoPath, compressed480Path, 480);
          }

        } else {
          // console.log("no existe link full");
          const oldPath = file.path;
          const newPath = video.website == "RGG" ? `assets/videos/${videoFolder}/${file.originalFilename}` : `assets/LBT/${videoFolder}/${file.originalFilename}`;
          await fs.move(oldPath, newPath);

          const compressed1080Path = `${directoryPath}/${videoFolder}/${file.originalFilename}_1080p.mp4`;
          await compress(videoPath, compressed1080Path, 1080);

          const compressed720Path = `${directoryPath}/${videoFolder}/${file.originalFilename}_720p.mp4`;
          await compress(videoPath, compressed720Path, 720);

          const compressed480Path = `${directoryPath}/${videoFolder}/${file.originalFilename}_480p.mp4`;
          await compress(videoPath, compressed480Path, 480);
        }
      }
    }
  });

  await Promise.all(promises);

  const videoDuration = linkFull ? await getVideoDuration(video.website == "RGG" ? `assets/videos/${videoFolder}/${linkFull.originalFilename}` : `assets/LBT/${videoFolder}/${linkFull.originalFilename}`) : null;
  const videoResolution = linkFull ? await getVideoResolution(video.website == "RGG" ? `assets/videos/${videoFolder}/${linkFull.originalFilename}` : `assets/LBT/${videoFolder}/${linkFull.originalFilename}`) : null;

  Video.findByIdAndUpdate(videoId, {
    title: title ? title : video.title,
    description: description ? description : video.description,
    serverLinkMiniature: serverLinkMiniature ? `videos/${videoFolder}/${serverLinkMiniature.originalFilename}` : video.serverLinkMiniature,
    linkPreview: linkPreview ? (website == "RGG" ? `videos/${videoFolder}/${linkPreview.originalFilename}_480p.mp4` : `LBT/${videoFolder}/${linkPreview.originalFilename}_480p.mp4`) : video.linkPreview,
    linkShort: linkShort ? (website == "RGG" ? `videos/${videoFolder}/${linkShort.originalFilename}` : `LBT/${videoFolder}/${linkShort.originalFilename}`) : video.linkShort,
    linkFull: linkFull ? (website == "RGG" ? `videos/${videoFolder}/${linkFull.originalFilename}_1080p.mp4` : `LBT/${videoFolder}/${linkFull.originalFilename}_1080p.mp4`) : video.linkFull,
    publishingDate: new Date(),
    categories: newCategories ? newCategories.map(category => ({ category: category })) : [],
    models: newModels ? newModels.map(model => ({ model: model })) : video.models,
    quality: linkFull ? videoResolution : video.quality,
    duration: linkFull ? videoDuration : video.duration,
    price: linkFull ? Math.ceil(videoDuration / 10) : video.price,
    website: website ? website : video.website,
    status: status ? status : video.status,
    compressed720: linkFull ? (website == "RGG" ? `videos/${videoFolder}/${linkFull.originalFilename}_720p.mp4` : `LBT/${videoFolder}/${linkFull.originalFilename}_720p.mp4`) : video.compressed720,
    compressed480: linkFull ? (website == "RGG" ? `videos/${videoFolder}/${linkFull.originalFilename}_480p.mp4` : `LBT/${videoFolder}/${linkFull.originalFilename}_480p.mp4`) : video.compressed480
  }).then((updatedVideo) => {
    if (launchDate !== "null") {
      // console.log("true");
      updatedVideo.launchDate = launchDate;
    }
    // if (models != video.models) {
    //   updatedVideo.models = models.map(model => ({ model: model }))
    // }
    console.log("comprimision terminada");
    linkFull ? fs.unlink(`${directoryPath}/${videoFolder}/${linkFull.originalFilename}`) : null;
    linkPreview ? fs.unlink(`${directoryPath}/${videoFolder}/${linkPreview.originalFilename}`) : null;
    return res.status(200).send(updatedVideo);
  }).catch((error) => {
    return res.status(400).send(error);
  });
}

function getFilePath(file) {
  const filePath = file;
  const fileSplit = filePath.split("/");
  return `${fileSplit[2]}`;
}

async function logedUser(req, res) {
  const token = req.body.token;
  jsonwebtoken.verify(token, JWT_SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).send('Invalid token');
    // El token es válido, hacer lo que se necesite con la información decodificada (por ejemplo, obtener el ID del usuario)
    const userId = decoded.user_id;
    Admin.findById(userId)
      .then((user) => {
        if (user) {
          return res.status(200).send(user);
        } else {
          return res.status(400).send({ msg: error });
        }
      })
      .catch((error) => {
        console.error(error);
      });
  });
}

function getArray(text, i) {
  const string = text;
  const fileSplit = string.split(",");
  return `${fileSplit[i]}`;
}

async function uploadTest(req, res) {
  const {
    launchDate
  } = req.body;

  console.log(launchDate);

  return res.status(200).send(req.files);
}

async function deleteVideo(req, res) {
  const { id } = req.body;
  console.log(id);

  //ubicar files
  const video = await Video.findById(id);
  console.log(video);

  const filesToDelete = [video.serverLinkMiniature, video.linkPreview, video.linkShort, video.linkFull];
  console.log(filesToDelete);

  //eliminar files
  const promises = filesToDelete.map(async file => {
    if (file) {
      if (fs.existsSync(file)) {
        await fs.unlink(file);
      }
    }
  });

  await Promise.all(promises);
  
  // Eliminar la carpeta
  const folderPath = path.dirname(video.linkFull);
  console.log(folderPath);
  await fs.remove(`assets/${folderPath}`);

  Video.findByIdAndDelete(id)
    .exec()
    .then((deletedVideo) => {
      if (!deletedVideo) {
        console.log('No se encontró ningún video con el ID proporcionado.');
      } else {
        console.log('Video eliminado exitosamente:', deletedVideo);
      }
    })
    .catch((error) => {
      console.log('Error al eliminar el video:', error);
    });
}

module.exports = {
  createAdmin,
  login,
  uploadNewVideo,
  logedUser,
  editVideo,
  uploadTest,
  deleteVideo
}