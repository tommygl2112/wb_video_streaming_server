const MongoClient = require("mongodb").MongoClient;
const Model = require("../models/modelModel");
const Storage = require("megajs").Storage;
const { Readable } = require("stream");
const fs = require("fs-extra");
const path = require("path");
const sharp = require('sharp');


function getFilePath(file) {
  const filePath = file;
  const fileSplit = filePath.split("/");
  return `${fileSplit[1]}`;
}

async function upluadModel(request, response) {
  const { name, description, website } = request.body;
  console.log(request.body);

  const { miniature, background } = request.files;
  console.log(request.files);

  const directoryPath = "assets/actors";
  const nextFolderName = name;

  fs.mkdir(`${directoryPath}/${nextFolderName}`, async (err) => {
    if (err) {
      console.error("Error al crear el directorio: ", err);
      return;
    } // Mueve los archivos a la nueva carpeta
    const filesToMove = [miniature, background];
    const promises = filesToMove.map((file) => {
      const oldPath = file.path;
      const newPath = `${directoryPath}/${nextFolderName}/${file.name}`;
      return fs.move(oldPath, newPath);
    });

    try {
      await Promise.all(promises);

      try {
        const mod = new Model({
          name: name,
          miniature: `actors/${nextFolderName}/${miniature.originalFilename}`,
          description: description,
          background: `actors/${nextFolderName}/${background.originalFilename}`,
          website: website,
        });
        mod
          .save()
          .then((object) => {
            response.status(200).send(object);
          })
          .catch((error) => {
            response.status(400).send({ msg: error });
          });
      } catch {
        return response.status(400).send({ msg: "Error" });
      }
    } catch (error) {
      console.log(error);
    }
  });
}

async function modelCollection(request, response) {
  const { page, models, website } = request.body;
  const skip = (page - 1) * models;
  const limit = models;

  if (!website) {
    Model.find()
      .skip(skip)
      .limit(limit)
      .then((value) => {
        return response.status(200).send(value);
      })
      .catch((error) => {
        return response.status(400).send({ msg: error });
      });
  } else {
    Model.find({ website: website })
      .skip(skip)
      .limit(limit)
      .then((value) => {
        return response.status(200).send(value);
      })
      .catch((error) => {
        return response.status(400).send({ msg: error });
      });
  }
}

async function getTotalModels(request, response) {
  try {
    const count = await Model.countDocuments();
    return response.status(200).json({ total: count });
  } catch (error) {
    return response
      .status(500)
      .json({ error: "Error al obtener el número total de modelos" });
  }
}

async function getAllModels(request, response) {
  try {
    const models = await Model.find();
    return response.status(200).json({ models });
  } catch (error) {
    return response.status(500).json({ error: "Error al obtener los modelos" });
  }
}

async function findModel(request, response) {
  const { id } = request.body;
  Model.findById(id)
    .then((value) => {
      return response.status(200).send(value);
    })
    .catch((error) => {
      return response.status(400).send(error);
    });
}

async function editModel(request, response) {
  const { id, name, description, website } = request.body;
  const files = request.files || {}; // handle the case where no files were uploaded
  const { miniature, background } = files;

  const model = await Model.findById(id);
  const modelFolder = getFilePath(model.miniature);
  console.log("model", modelFolder);
  const filesToMove = [miniature, background];

  const promises = filesToMove.map(async (file) => {
    if (file && file.originalFilename) { // check if file and originalname are defined
      console.log("file nombre",file.originalFilename);
      const oldPath = file.path;
      const newPath = `actors/${modelFolder}/${file.originalFilename}.webp`;

      console.log("nuevaruta",newPath);
      console.log("oldrute",oldPath);

      // convert the file to webp with compression
      await sharp(file.path)
        .webp({ quality: 10 }) // you can adjust the quality parameter to balance between size and quality
        .toFile(`assets/${newPath}`);

      // delete the old file
      await fs.unlink(oldPath);

      return newPath;
    }
  });

  const updatedPaths = await Promise.all(promises);

  // Construct updated field values
  const updateFields = {
    name: name ? name : model.name,
    description: description ? description : model.description,
    website: website ? website : model.website,
  };

  if (miniature) updateFields.miniature = updatedPaths[0];
  if (background) updateFields.background = updatedPaths[1];

  // Update model
  Model.findByIdAndUpdate(id, updateFields, { new: true })
    .then((updatedModel) => {
      response.status(200).send(updatedModel);
    })
    .catch((error) => {
      console.log(error);
      response.status(500).send({ error: "Failed to update model" });
    });
}

async function deleteModel(request, response) {
  const { id } = request.body;

  const model = await Model.findById(id);

  if (!model) {
    // Manejar el caso cuando no se encuentra ningún modelo con el ID proporcionado
    return response.status(404).send("Modelo no encontrado");
  }

  const directoryPath = "assets/actors";
  const nextFolderName = model.name;

  fs.rmdir(`${directoryPath}/${nextFolderName}`, { recursive: true }, (err) => {
    if (err) {
      console.error("Error al eliminar la imagen de fondo:", err);
    }
  });

  await Model.findByIdAndDelete({ _id: id })
    .then((value) => {
      return response.status(200).send(value);
    })
    .catch((error) => {
      return response.status(400).send(value);
    });
}

module.exports = {
  upluadModel,
  modelCollection,
  findModel,
  editModel,
  deleteModel,
  getTotalModels,
  getAllModels,
};
