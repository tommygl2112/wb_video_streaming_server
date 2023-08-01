const MongoClient = require("mongodb").MongoClient;
const Ads = require("../models/adsModel");
const { Readable } = require("stream");
const fs = require("fs-extra");
const { log } = require("console");
const { promisify } = require("util");
const mkdir = promisify(fs.mkdir);
const move = promisify(fs.rename);
const ffmpeg = require("fluent-ffmpeg");
const ffprobePath = require("ffprobe-static").path;

ffmpeg.setFfprobePath(ffprobePath);

async function getVideoDurationInSeconds(videoPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, function (err, metadata) {
      if (err) {
        console.error("Error al obtener la duración del video:", err);
        reject(err);
        return;
      }
      resolve(metadata.format.duration);
    });
  });
}

async function addAd(req, res) {
  const { name, value, blank, website } = req.body;
  const { thumbnail, adVideo } = req.files;

  const videoDirectoryPath = "./assets/ad";
  const thumbnailDirectoryPath = "./assets/ad_thumbnail";

  try {
    await mkdir(videoDirectoryPath, { recursive: true });
    await mkdir(thumbnailDirectoryPath, { recursive: true });
  } catch (err) {
    console.error("Error al crear los directorios: ", err);
    return;
  }

  const videoPath = `${videoDirectoryPath}/${adVideo.name}`;
  const thumbnailPath = `${thumbnailDirectoryPath}/${thumbnail.name}`;

  try {
    await move(adVideo.path, videoPath);
    await move(thumbnail.path, thumbnailPath);

    let duration;
    if (adVideo.fieldName === "adVideo") {
      duration = await getVideoDurationInSeconds(videoPath);
    }

    const ad = new Ads({
      name: name,
      value: value,
      blank: blank,
      website: website,
      thumbnail: thumbnailPath,
      path: videoPath,
      time: Math.floor(duration),
      views: 0,
      viewDates: [],
    });

    ad.save()
      .then((object) => {
        res.status(200).send(object);
      })
      .catch((error) => {
        res.status(400).send({ msg: error });
      });
  } catch (error) {
    console.log(error);
  }
}

async function fetchAds(req, res) {
    const { website } = req.body;

    if (!website) {
        Ads.find()
            .then(ad => {
                return res.status(200).send(ad);
            })
            .catch(error => {
                return res.status(400).send(error);
            });
    } else {
        Ads.find({ website: website })
            .then(ad => {
                return res.status(200).send(ad);
            })
            .catch(error => {
                return res.status(400).send(error);
            });
    }
}

async function fetchSingleAd(req, res) {
    const id = req.body.id;

    Ads.findById(id)
        .then((ad) => {
            if (ad) {
                return res.status(200).send(ad);
            } else {
                return res.status(400).send({ msg: "Ad dont found" });
            }
        })
        .catch((error) => {
            return res.status(400).send(error);
        });
}

async function updateView(req, res) {
    const adId = req.body.id;

    // Ads.findByIdAndUpdate(id, { $inc: { views: 1 } })
    //     .then((ad) => {
    //         // Actualizaci車n exitosa
    //         res.status(200).send({msg: "View updated"});
    //     })
    //     .catch((error) => {
    //         // Manejar el error
    //         res.status(500).send('Error al actualizar la vista');
    //     });
    try {
        const ad = await Ads.findById(adId);
        ad.addView();
        await ad.save();
        return res.status(200).send({msg: "View updated"});
    } catch (error) {
        return res.status(500).send('Error al actualizar la vista');
    }
}

module.exports = {
  addAd,
  fetchAds,
  fetchSingleAd,
  updateView
}

