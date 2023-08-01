const MongoClient = require("mongodb").MongoClient;
const Category = require("../models/categoryModel");

async function categoryCollection(request, response) {
  Category.find()
    .then((value) => {
      return response.status(200).send(value);
    })
    .catch((error) => {
      return response.status(400).send({ msg: "Error" });
    });
}

async function uploadCategory(request, response) {
  const { name } = request.body;
  const { miniature } = request.files;

  console.log(request.body);
  console.log(request.files);

  const miniaturePath = miniature ? miniature.path.replace('assets/', '') : null;

  const cat = new Category({
    name,
    miniature: miniature ? miniaturePath : '',
  });

  cat
    .save()
    .then((objectStore) => {
      response.status(200).send(objectStore);
    })
    .catch((error) => {
      response.status(400).send({ msg: error });
    });
}

module.exports = { categoryCollection, uploadCategory };
