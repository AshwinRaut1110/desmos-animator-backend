const express = require("express");
const { parse } = require("svg-parser");
const cmd = require("node-cmd");
const fs = require("fs");

const app = express();

const PORT = 3000;

app.get("/convertVideo", async (req, res) => {
  const frames = {};

  try {
    // convert the video into bitmap frames
    cmd.runSync(
      `ffmpeg -i ../videos/badapple.webm -vf fps=1 -pix_fmt bgr8 ../videos/frames/badapple%d.bmp`
    );

    // getting the number of frames generated
    const numberOfFrames = fs.readdirSync("../videos/frames/").length;

    for (let i = 1; i <= numberOfFrames; i++) {
      // convert the bitmap frames into svgs using potrace
      cmd.runSync(`potrace ../videos/frames/badapple${i}.bmp -b svg`);

      // take the svg file, parse it and extract all the paths from the svg file

      // extracting the contents of the svg file
      const svgContent = fs.readFileSync(`../videos/frames/badapple${i}.svg`, {
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
  } catch (e) {
    console.log(e);
  }

  res.send(frames);
});

app.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});
