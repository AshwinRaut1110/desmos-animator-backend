const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { parse } = require("svg-parser");
const cmd = require("node-cmd");
const fs = require("fs");
const Path = require("path");

const app = express();
app.use(cors());

// setting up the storage destination and filenames and extentions
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, Path.join(__dirname, "../videos/"));
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

const PORT = 3000;

app.post("/convertVideo", upload.single("video"), async (req, res) => {
  // extracting the video name and extension
  const [videoName, videoExtension] = req.file.originalname.split(".");

  // fps for potrace frames
  const fps = req.query.fps || 1;

  const frames = {};

  try {
    // create the frames folder for the video
    fs.mkdirSync(`../videos/${videoName}frames`);

    // convert the video into bitmap frames
    cmd.runSync(
      `ffmpeg -i ../videos/${
        videoName + "." + videoExtension
      } -vf fps=${fps} -pix_fmt bgr8 ../videos/${videoName}frames/${videoName}%d.bmp`
    );

    // getting the number of frames generated
    const numberOfFrames = fs.readdirSync(
      `../videos/${videoName}frames/`
    ).length;

    for (let i = 1; i <= numberOfFrames; i++) {
      // convert the bitmap frames into svgs using potrace
      cmd.runSync(
        `potrace ../videos/${videoName}frames/${videoName}${i}.bmp -b svg`
      );

      // take the svg file, parse it and extract all the paths from the svg file

      // extracting the contents of the svg file
      const svgContent = fs.readFileSync(
        `../videos/${videoName}frames/${videoName}${i}.svg`,
        {
          encoding: "utf-8",
        }
      );

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
    fs.rmSync(`../videos/${videoName + "." + videoExtension}`);
    fs.rmSync(`../videos/${videoName}frames`, { recursive: true, force: true });
  } catch (e) {
    console.log(e);
  }

  res.send(frames);
});

app.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});
