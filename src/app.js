const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { parse } = require("svg-parser");
const cmd = require("node-cmd");
const fs = require("fs");
const Path = require("path");

const app = express();
app.use(cors());

// setting up the storage destination and filenames and extentions for videos
const storageVideo = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, Path.join(__dirname, "../videos/"));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const uploadVideo = multer({ storage: storageVideo });

// setting up the image destination folder, and name and extentions for image
const storageImage = multer.diskStorage({
  destination: function (req, file, cb) {
    const imageFolder = Path.join(__dirname, "../images");
    cb(null, imageFolder);
  },
  filename: function (req, file, cb) {
    const imageName = file.originalname;
    cb(null, imageName);
  },
});

const uploadImage = multer({ storage: storageImage });

const PORT = 3000;

app.post("/convertVideo", uploadVideo.single("video"), async (req, res) => {
  console.log(req.file);
  // extracting the video name and extension
  const [videoName, videoExtension] = req.file.originalname.split(".");

  // fps for potrace frames
  const fps = req.query.fps || 1;

  const frames = {};

  try {
    // create the frames folder for the video
    fs.mkdirSync(Path.join(__dirname, `../videos/${videoName}frames`));

    // defining the paths required
    const videoPath = Path.join(
      __dirname,
      `../videos/${videoName}.${videoExtension}`
    );

    const videoFramesPath = Path.join(
      __dirname,
      `../videos/${videoName}frames/${videoName}%d.bmp`
    );

    const videoFramesDirPath = Path.join(
      __dirname,
      `../videos/${videoName}frames`
    );

    // convert the video into bitmap frames
    cmd.runSync(
      `ffmpeg -i "${videoPath}" -vf fps=${fps} -pix_fmt bgr8 "${videoFramesPath}"`
    );

    // getting the number of frames generated
    const numberOfFrames = fs.readdirSync(videoFramesDirPath).length;

    for (let i = 1; i <= numberOfFrames; i++) {
      // convert the bitmap frames into svgs using potrace
      const framePath = Path.join(
        __dirname,
        `../videos/${videoName}frames/${videoName}${i}.bmp`
      );

      cmd.runSync(`potrace "${framePath}" --opttolerance 0.1 -b svg `);

      // take the svg file, parse it and extract all the paths from the svg file

      const svgFilePath = Path.join(
        __dirname,
        `../videos/${videoName}frames/${videoName}${i}.svg`
      );
      // extracting the contents of the svg file
      const svgContent = fs.readFileSync(svgFilePath, {
        encoding: "utf-8",
      });

      frames[i] = [];

      // parse the svg files content
      const parsedSvg = parse(svgContent);
      // get the g tag which contains all the path tags
      const pathTags = parsedSvg.children[0].children[1].children;

      // add the paths to the final frames object
      pathTags.forEach((path) => {
        const svgPathString = path.properties.d; // get the path string
        frames[i].push(svgPathString.replace(/\n/g, " ")); // get rid of all the \n
      });
    }

    // delete the video and the frames once the processing is done
    fs.rmSync(videoPath);
    fs.rmSync(videoFramesDirPath, { recursive: true, force: true });

    res.send(frames);
  } catch (e) {
    res.status(500).send({
      error: {
        message: e.message || "some error occurred, please try again",
      },
    });
  }
});

app.post("/convertImage", uploadImage.single("image"), (req, res) => {
  const [imageName, imageExtention] = req.file.originalname.split(".");

  // setting the paths required
  const imagePath = Path.join(__dirname, `../images/${req.file.originalname}`);

  const svgFilePath = Path.join(__dirname, `../images/${imageName}.svg`);

  // converting the image to svg
  try {
    cmd.runSync(`potrace "${imagePath}" -b svg`);

    // extract the content of the svg file and parse it
    const svgString = fs.readFileSync(svgFilePath, {
      encoding: "utf-8",
    });

    const parsedSvg = parse(svgString);

    // get the path tags from the parsed svg
    const svgPathTags = parsedSvg.children[0].children[1].children;

    const svgPaths = [];

    // remove the \n from the path string and add them to the path string array
    svgPathTags.forEach((svgPathTag) => {
      svgPaths.push(svgPathTag.properties.d.replace(/\n/g, " "));
    });

    // delete the image files
    fs.rmSync(imagePath, { recursive: true, force: true });
    fs.rmSync(svgFilePath, { recursive: true, force: true });

    res.send(svgPaths);
  } catch (e) {
    res.status(500).send({
      error: {
        message: e.message || "some error occurred, please try again",
      },
    });
  }
});

app.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});
