const MongoClient = require("mongodb").MongoClient;
const mongoose = require("mongoose");
const Video = require("../models/videoModel");
const User = require("../models/userModel");
const Ad = require("../models/adsModel");
const Storage = require("megajs").Storage;
const { Readable } = require("stream");
const fs = require("fs");
const path = require("path");
const { log } = require("console");

async function videoCollection(request, response) {
  const { page } = request.body; // <-- Recibe un numero
  const skip = (page - 1) * 9; // <-- Calcula los videos a saltar
  const limit = 9; // <-- El numero de video por pagina
  Video.find() // <-- Busca los registros
    .sort({ publishingDate: -1, _id: 1 }) // <-- Ordena los rgeistros en orden de publicacion
    .skip(skip) // <-- Aqui se saltan los registros
    .limit(limit) // <-- Aqui se limitan los registros recibidos
    .populate("models.model", "name")
    .then((values) => {
      return response.status(200).send(values);
    })
    .catch((error) => {
      return response.status(400).send({ msg: error });
    });
}

async function videoCount(request, response) {
  const { website, categoryIds } = request.body;
  //Esta funcion sirve para saber cuantos registros existen
  //en la tabla de video, sirve para que en front saquen la paginacion

  let query = { website: website, status: "public" };

  if (categoryIds && categoryIds.length > 0) {
    query["categories.category"] = { $all: categoryIds };
  }

  if (!website) {
    const total = await Video.countDocuments();
    return response.status(200).send({ total: total });
  } else {
    const total = await Video.countDocuments(query);
    return response.status(200).send({ total: total });
  }
}

async function videosPrivate(request, response) {
  const { website } = request.body;

  if (!website) {
    Video.find({ status: "private" })
      .populate("models.model", "name")
      .then((values) => {
        const filteredValues = values.filter((video) => video.launchDate);
        return response.status(200).send(filteredValues);
      })
      .catch((error) => {
        return response.status(400).send({ msg: error });
      });
  } else {
    Video.find({ website: website, status: "private" })
      .populate("models.model", "name")
      .then((values) => {
        const filteredValues = values.filter((video) => video.launchDate);
        return response.status(200).send(filteredValues);
      })
      .catch((error) => {
        return response.status(400).send({ msg: error });
      });
  }
}

async function videosById(request, response) {
  //Esta funcion busca el video segun su ID
  //solo recibe el ID
  const { id } = request.body;
  Video.findById(id)
    .populate("categories.category", "name")
    .populate("models.model", "name")
    .then((values) => {
      return response.status(200).send(values);
    })
    .catch((error) => {
      return response.status(400).send({ msg: error });
    });
}

async function videosByCategory(request, response) {
  //Esta funcion busca videos por categoria
  //y recibe la pagina para mandar los videos segun la pagina
  const { categories, page } = request.body;
  const skip = (page - 1) * 9;
  const limit = 9;
  const categoriesFormat = categories.map((category) => {
    return new mongoose.Types.ObjectId(category);
  }); // <-- Esta funcion le da el formato correcto al array de categorias
  // sin esto, mongo no va a reconocer los id de la categorias
  Video.find({ "categories.category": { $all: categoriesFormat } })
    .skip(skip)
    .limit(limit)
    .populate("models.model", "name")
    .sort({ publishingDate: -1, _id: 1 })
    .then((values) => {
      return response.status(200).send(values);
    })
    .catch((error) => {
      return response.status(400).send({ msg: error });
    });
}

async function videosByModel(request, response) {
  //Esta funcion busca lo video por categoria
  //Recibe la pagina y el numero de videos por pagina
  const { models, page, videos } = request.body;
  const skip = (page - 1) * videos;
  const limit = videos;
  const modelsFormat = models.map((model) => {
    return new mongoose.Types.ObjectId(model);
  });
  const obj = Video.find({ "models.model": { $all: modelsFormat } })
    .skip(skip)
    .limit(limit)
    .populate("models.model", "name")
    .sort({ publishingDate: -1, _id: 1 })
    .then((values) => {
      return response.status(200).send(values);
    })
    .catch((error) => {
      return response.status(400).send({ msg: error });
    });
}

async function countModelVideos(request, response) {
  //Esta funcion cuenta cuantos videos hay por modelo
  //Recibe el id del model
  const { model } = request.body;
  const modelFormat = new mongoose.Types.ObjectId(model);
  const total = await Video.find({
    "models.model": { $all: modelFormat },
  }).countDocuments();
  return response.status(200).send({ total: total });
}

async function viewsPerModel(request, response) {
  //Esta funcion saca cuantas vistas en total tiene un modelo
  //Recibe el id del model
  const { id } = request.body;
  try {
    const result = await Video.aggregate([
      { $match: { "models.model": new mongoose.Types.ObjectId(id) } },
      { $group: { _id: null, views: { $sum: "$views" } } },
    ]); // <-- La funcion aggrgate junsto con $sum, buscan, agrupan y suman los videos donde
    //salga la modelo
    return response.status(200).json(result);
  } catch (error) {
    console.log(error);
    return response.status(400).json({ msg: error });
  }
}

async function videosBySearch(request, response) {
  //Esta funcion busca segun el titulo
  //Recibe la cadena a buscar en title y el numero de pagina donde se buscara
  //La cadena se comparara con los titulos de los videos para dar resultados
  const { title, page } = request.body;
  const skip = (page - 1) * 9;
  const limit = 9;
  Video.find({ title: { $regex: title, $options: "i" } })
    .populate("models.model", "name")
    .skip(skip)
    .limit(limit)
    .then((values) => {
      return response.status(200).send(values);
    })
    .catch((error) => {
      console.log(error);
      return response.status(400).send({ msg: error });
    });
}

async function videosByDate(request, response) {
  const { publishingDate, page, website, videos, categoryIds } = request.body;
  const skip = (page - 1) * videos;
  const limit = videos;

  let query = { website: website, status: "public" };

  if (categoryIds && categoryIds.length > 0) {
    query["categories.category"] = { $all: categoryIds };
  }

  if (!website) {
    Video.find()
      .skip(skip)
      .limit(limit)
      .populate("models.model", "name")
      .sort({ publishingDate: publishingDate, _id: 1 })
      .then((values) => {
        return response.status(200).send(values);
      })
      .catch((error) => {
        return response.status(400).send({ msg: error });
      });
  } else {

    Video.find(query)
      .skip(skip)
      .limit(limit)
      .populate("models.model", "name")
      .sort({ publishingDate: publishingDate, _id: 1 })
      .then((values) => {
        return response.status(200).send(values);
      })
      .catch((error) => {
        return response.status(400).send({ msg: error });
      });
  }
}


async function videosByViews(request, response) {
  const { website, categoryIds } = request.body;
  //Esta funcion ordena y pagina los videos segun las vistas
  //views es una 1 o -1, page es el numero de pagina y
  //videos es la cantidad de videos por pagina
  const { views, page, videos } = request.body;

  let query = { website: website, status: "public" }

  if (categoryIds && categoryIds.length > 0) {
    query["categories.category"] = { $all: categoryIds };
  }

  const skip = (page - 1) * videos;
  const limit = videos;

  console.log(website);

  if (!website) {
    Video.find()
      .skip(skip)
      .limit(limit)
      .populate("models.model", "name")
      .sort({ views: views, _id: 1 })
      .then((values) => {
        return response.status(200).send(values);
      })
      .catch((error) => {
        return response.status(400).send({ msg: error });
      });
  } else {
    Video.find(query)
      .skip(skip)
      .limit(limit)
      .populate("models.model", "name")
      .sort({ views: views, _id: 1 })
      .then((values) => {
        return response.status(200).send(values);
      })
      .catch((error) => {
        return response.status(400).send({ msg: error });
      });
  }
}

async function search(request, response) {
  const { website, categoryIds, query } = request.body;
  const { views, page, videos } = request.body;

  console.log(request.body);

  let queryObject = { website: website, status: "public" };

  if (categoryIds && categoryIds.length > 0) {
    queryObject["categories.category"] = { $all: categoryIds };
  }

  if (query && categoryIds.length < 1) {
    queryObject.title = { $regex: query, $options: "i" };
  }

  const skip = (page - 1) * videos;
  const limit = videos;
  let totalVideos = 0;

  totalVideos = await Video.countDocuments(queryObject);



  if (!website) {
    Video.find(queryObject)
      .skip(skip)
      .limit(limit)
      .populate("models.model", "name")
      .sort({ views: views, _id: 1 })
      .then((values) => {
        return response.status(200).send({ values, totalVideos });
      })
      .catch((error) => {
        return response.status(400).send({ msg: error });
      });
  } else {
    Video.find(queryObject)
      .skip(skip)
      .limit(limit)
      .populate("models.model", "name")
      .sort({ views: views, _id: 1 })
      .then((values) => {
        return response.status(200).send({ values, totalVideos });
      })
      .catch((error) => {
        return response.status(400).send({ msg: error });
      });
  }
}


async function videosByLikes(request, response) {
  //Acomoda los videos segun los likes
  //likes es un 1 o -1 y page es la pagina
  const { likes, page } = request.body;
  const skip = (page - 1) * 9;
  const limit = 9;
  Video.find()
    .skip(skip)
    .limit(limit)
    .populate("models.model", "name")
    .sort({ likes: likes, _id: 1 })
    .then((values) => {
      return response.status(200).send(values);
    })
    .catch((error) => {
      return response.status(400).send({ msg: error });
    });
}

async function videosByQuality(request, response) {
  //Busca videos segun su calidad
  //quality es la calidad del video (480, 720, 1080)
  //la funcion buscara los videos de la calidad especificada
  //page es el numero de la paginacion
  const { quality, page } = request.body;
  const skip = (page - 1) * 9;
  const limit = 9;
  Video.find({ quality: quality })
    .skip(skip)
    .limit(limit)
    .populate("models.model", "name")
    .then((values) => {
      return response.status(200).send(values);
    })
    .catch((error) => {
      return response.status(400).send({ msg: error });
    });
}

async function like(request, response) {
  const { videoId, like, userId } = request.body;

  try {
    // Obtener el usuario actual
    const user = await User.findById(userId);
    const dislikesUser = user.dislikes;
    const likesUser = user.likes ? user.likes : [];

    // Verificar si el usuario ya ha dado like al video
    const hasLiked = likesUser.some(
      (likedVideo) => likedVideo.toString() === videoId
    );

    if (like === 1 && !hasLiked) {
      if (dislikesUser.length > 0) {
        // Eliminar el ID del video del campo dislikes del usuario
        const updatedDislikes = dislikesUser.filter(
          (dislikedVideo) => dislikedVideo.toString() !== videoId
        );
        await User.findByIdAndUpdate(
          { _id: userId },
          { dislikes: updatedDislikes }
        );

        const index = dislikesUser.findIndex(
          (dislikedVideo) => dislikedVideo.toString() === videoId
        );

        if (index !== -1) {
          await Video.findByIdAndUpdate(videoId, {
            $inc: { likes: 1, dislikes: -1 },
          });
        } else {
          await Video.findByIdAndUpdate(videoId, {
            $inc: { likes: 1 },
          });
        }

        likesUser.push(videoId);

        await User.findByIdAndUpdate({ _id: userId }, { likes: likesUser });

        return response.status(200).send({ msg: "Like agregado" });
      } else {
        await Video.findByIdAndUpdate({ _id: videoId }, { $inc: { likes: 1 } });

        likesUser.push(videoId);

        await User.findByIdAndUpdate({ _id: userId }, { likes: likesUser });

        return response.status(200).send({ msg: "Like agregado" });
      }
    } else if (like === -1) {
      if (hasLiked) {
        // Actualizar el video para quitar el like
        await Video.findByIdAndUpdate(
          { _id: videoId },
          { $inc: { likes: -1 } }
        );

        // Eliminar el ID del video del campo likes del usuario
        const updatedLikes = likesUser.filter(
          (likedVideo) => likedVideo.toString() !== videoId
        );
        await User.findByIdAndUpdate({ _id: userId }, { likes: updatedLikes });

        return response.status(200).send({ msg: "Like eliminado" });
      } else {
        return response
          .status(400)
          .send({ msg: "El usuario no ha dado like a este video" });
      }
    } else {
      return response
        .status(400)
        .send({ msg: "Solo puedes darle like una vez" });
    }
  } catch (error) {
    return response.status(400).send({ msg: error });
  }
}

async function dislike(request, response) {
  const { videoId, dislike, userId } = request.body;

  try {
    // Obtener el usuario actual
    const user = await User.findById(userId);
    const likesUser = user.likes;
    const dislikesUser = user.dislikes ? user.dislikes : [];

    // Verificar si el usuario ya ha dado dislike al video
    const hasDisliked = dislikesUser.some(
      (dislikedVideo) => dislikedVideo.toString() === videoId
    );

    if (dislike === 1 && !hasDisliked) {
      if (likesUser.length > 0) {
        // Eliminar el ID del video del campo likes del usuario
        const updatedLikes = likesUser.filter(
          (likedVideo) => likedVideo.toString() !== videoId
        );
        await User.findByIdAndUpdate({ _id: userId }, { likes: updatedLikes });

        const index = likesUser.findIndex(
          (likedVideo) => likedVideo.toString() === videoId
        );

        if (index !== -1) {
          await Video.findByIdAndUpdate(videoId, {
            $inc: { dislikes: 1, likes: -1 },
          });
        } else {
          await Video.findByIdAndUpdate(videoId, {
            $inc: { dislikes: 1 },
          });
        }

        dislikesUser.push(videoId);

        await User.findByIdAndUpdate(
          { _id: userId },
          { dislikes: dislikesUser }
        );

        return response.status(200).send({ msg: "Dislike agregado" });
      } else {
        await Video.findByIdAndUpdate(
          { _id: videoId },
          { $inc: { dislikes: 1 } }
        );

        dislikesUser.push(videoId);

        await User.findByIdAndUpdate(
          { _id: userId },
          { dislikes: dislikesUser }
        );

        return response.status(200).send({ msg: "Dislike agregado" });
      }
    } else if (dislike === -1) {
      if (hasDisliked) {
        // Actualizar el video para quitar el dislike
        await Video.findByIdAndUpdate(
          { _id: videoId },
          { $inc: { dislikes: -1 } }
        );

        // Eliminar el ID del video del campo dislikes del usuario
        const updatedDislikes = dislikesUser.filter(
          (dislikedVideo) => dislikedVideo.toString() !== videoId
        );
        await User.findByIdAndUpdate(
          { _id: userId },
          { dislikes: updatedDislikes }
        );

        return response.status(200).send({ msg: "Dislike eliminado" });
      } else {
        return response
          .status(400)
          .send({ msg: "El usuario no ha dado dislike a este video" });
      }
    } else {
      return response
        .status(400)
        .send({ msg: "Solo puedes darle dislike una vez" });
    }
  } catch (error) {
    return response.status(400).send({ msg: error });
  }
}

async function view(request, response) {
  //Esta funcion le agrega una vista al video, solo es necesario mandarle el id del video
  const { id } = request.body;
  Video.findByIdAndUpdate({ _id: id }, { $inc: { views: 1 } }) // <-- Aqui se incrementan las vistas
    .then(() => {
      return response.status(200).send({ msg: "Listo" });
    })
    .catch((error) => {
      return response.status(400).send({ msg: error });
    });
}

async function buyVideo(request, response) {
  //Esta funcion se encarga de realizar la compra del video
  //Recibe el id del video y el id del usuario
  const { video, user } = request.body;

  try {
    const vid = await Video.findById(video); // <-- Busca el video
    const us = await User.findById(user); // <-- Basca al usuario

    const itCanBeBought = us.credits - vid.price; // <-- Verifica que el usuario tenga suficientes creditos
    if (itCanBeBought >= 0) {
      const alreadyBought = us.videos.find((v) => v.video == video); // <-- Ve si el usuario ya ha comprado el video antes
      if (!alreadyBought) {
        // <-- Si no lo ha comrpado antes
        const date = new Date();
        date.setDate(date.getDay() + 8); // <-- Establece la fecha de experiracion de compra
        const vidObj = { video: video, expiration: date }; // <-- Crea el objeto para gaurdar en el usuario
        const array = [...us.videos, vidObj]; // <-- Se agrega el video deseado al array de videos comprados
        User.findByIdAndUpdate(
          { _id: user },
          {
            $set: {
              credits: itCanBeBought,
              videos: array,
            },
          }
        ) // <-- Actualiza la informacion
          .then(() => {
            return response.status(200).send({ msg: "Listo" });
          })
          .catch((error) => {
            return response.status(400).send({ msg: error });
          });
      } else {
        // <-- Si ya compro el video antes
        const date = new Date();
        if (alreadyBought.expiration > date) {
          // <-- Verifica la fecha de expiracion del video
          return response.status(200).send({ msg: "Already Bought" }); // <-- Si la fecha es mayor a la fecha actual, te avisa que ya lo tienes
        } else {
          // <-- Si ya paso la fecha de expiracion, realiza el proceso de compra de nuevo y actualiza la fecha de expiracion
          date.setDate(date.getDay() + 7);
          const vidObj = { video: video, expiration: date };
          const filter = us.videos.filter((vi) => vi.video == video);
          const array = [...filter, vidObj];
          User.findByIdAndUpdate(
            { _id: video },
            {
              $set: {
                credits: itCanBeBought,
                videos: array,
              },
            }
          )
            .then(() => {
              return response.status(200).send({ msg: "Listo" });
            })
            .catch((error) => {
              return response.status(400).send({ msg: error });
            });
        }
      }
    }
  } catch (error) {
    console.log(error);
    return response.status(400).send(error);
  }
}

async function watchAd(request, response) {
  //Recibe add que es el id de la ad y user que es el id del usuario
  const { add, user } = request.body;

  const addVal = await Ad.findById(add); // <-- Busca la ad en la base de datos
  const us = await User.findById(user); // <-- Busca el usuario la base de datos

  const alreadyWatch = us.ads.find((ad) => ad.ad == add); // <-- Busca si el usuario ya vio la ad

  const date = new Date();
  if (!alreadyWatch) {
    // <-- Si no lo ha visto
    date.setDate(date.getDay() + 2);
    const vidObj = { ad: add, expiration: date }; // <-- Crea el objeto para el array de ads del usuario
    const array = [...us.ads, vidObj]; // <-- Crea el array para guardar en el usuario

    User.findByIdAndUpdate(
      { _id: user },
      {
        $set: {
          credits: us.credits + addVal.value,
          ads: array,
        },
      }
    ) // <-- Actualiza el registro del usuario
      .then(() => {
        return response.status(200).send({ msg: "Listo" });
      })
      .catch((error) => {
        return response.status(400).send({ msg: error });
      });
  } else {
    // <-- Si ya lo vio
    if (alreadyWatch.expiration > date) {
      // <-- Verifica la fecha de experiacion del ad
      return response.status(200).send({ msg: "Add already seen" });
    } else {
      // <-- Si la fecha ya paso, realiza el proceso para actualizar la fecha de expiracion
      const vidObj = { ad: add, expiration: date }; // <-- Crea el objeto para el array
      const filter = us.ads.filter((ad) => ad.ad === add);
      const array = [...filter, vidObj]; // <-- Agrega el objeto al array

      User.findByIdAndUpdate(
        { _id: user },
        {
          $set: {
            credits: us.credits + addVal.value,
            ads: array,
          },
        }
      ) // <-- Actualiza el registro del usuario
        .then(() => {
          return response.status(200).send({ msg: "Listo" });
        })
        .catch((error) => {
          return response.status(400).send({ msg: error });
        });
    }
  }
}

module.exports = {
  videoCollection,
  videoCount,
  videosById,
  videosByCategory,
  videosByModel,
  countModelVideos,
  videosBySearch,
  videosByDate,
  videosByViews,
  viewsPerModel,
  videosByLikes,
  videosByQuality,
  like,
  dislike,
  view,
  buyVideo,
  watchAd,
  search,
  videosPrivate
};
