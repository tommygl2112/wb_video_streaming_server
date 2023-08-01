const BonusCodeSchema = require("../models/bonusCodeModel");
const User = require("../models/userModel");
const fs = require("fs-extra");

async function addBonusCode(req, res) {
  const { name, value, expirationDate } = req.body;
  console.log(req.body);
  const miniature = req.files.miniature;
  console.log(miniature);

  if (!name) return res.status(400).send({ msg: "name required" });
  if (!value) return res.status(400).send({ msg: "value required" });
  if (!expirationDate)
    return res.status(400).send({ msg: "expirationDate required" });

  const directoryPath = "assets/bonuscode";
  const nextFolderName = name;

  try {
    if (miniature) {
      await fs.mkdir(`${directoryPath}/${nextFolderName}`);
      const oldPath = miniature.path;
      const newPath = `${directoryPath}/${nextFolderName}/${miniature.name}`;
      await fs.move(oldPath, newPath);

      const bonuscode = new BonusCodeSchema({
        name: name,
        value: value,
        expirationDate: expirationDate,
        miniature: newPath,
      });

      const savedBonuscode = await bonuscode.save();
      return res.status(200).send(savedBonuscode);
    } else {
      const bonuscode = new BonusCodeSchema({
        name: name,
        value: value,
        expirationDate: expirationDate,
      });

      const savedBonuscode = await bonuscode.save();
      return res.status(200).send(savedBonuscode);
    }
  } catch (error) {
    console.error("Error al crear el directorio o mover el archivo: ", error);
    return res.status(400).send({ msg: "Error" });
  }
}

async function getAllBonusCodes(req, res) {
  try {
    const bonusCodesList = await BonusCodeSchema.find();
    res.status(200).send(bonusCodesList);
  } catch (error) {
    res.status(400).send(error);
  }
}

async function verifyBonusCode(req, res) {
  const { bonusCode, id } = req.body;

  const user = await User.findById(id);

  if (!bonusCode) {
    return res.status(400).send({ msg: "bonusCode required" });
  }

  if (!user) {
    return res.status(400).send({ msg: "user required" });
  }

  const foundBonusCode = await BonusCodeSchema.findOne({ name: bonusCode });

  if (foundBonusCode) {
    const isCodeUsed = user.bonusCode.includes(bonusCode);

    if (isCodeUsed) {
      return res.status(400).send({ msg: "Bonus code already used" });
    }

    const currentDate = new Date();
    const expirationDate = new Date(foundBonusCode.expirationDate);

    if (currentDate > expirationDate) {
      return res.status(400).send({ msg: "Bonus code has expired" });
    }

    const userTokens = parseInt(user.credits);
    const newTokens = userTokens + foundBonusCode.value;

    user.bonusCode.push(bonusCode);

    await User.findByIdAndUpdate(id, {
      credits: newTokens,
      bonusCode: user.bonusCode,
    })
      .then((updatedUser) => {
        // Devolver una respuesta exitosa
        return res.status(200).send(updatedUser);
      })
      .catch((error) => {
        return res.status(400).send({ msg: "Error updating user credits" });
      });
  } else {
    return res.status(400).send({ msg: "Bonus code not found" });
  }
}

module.exports = {
  addBonusCode,
  getAllBonusCodes,
  verifyBonusCode,
};
