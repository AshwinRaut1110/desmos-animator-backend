const express = require("express");

const app = express();

const PORT = 3000;

app.get("/convertVideo", (req, res) => {
  res.send("Hello, World");
});

app.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});

// const ffmpeg = require("ffmpeg");

// const getVideo = async () => {
//   try {
//     const video = await new ffmpeg("../videos/badapple.webm");

//     video.addCommand("-vf");
//     video.addCommand("fps=1");
//     video.addCommand("-pix_fmt", "bgr8");
//     video.addCommand("../videos/frames/output%d.bmp");

//     video.save();
//   } catch (e) {
//     console.log(e);
//   }
// };

// getVideo();

// const { parse } = require("svg-parser");

// const Snap = require(`imports-loader?this=>window,fix=>module.exports=0!snapsvg/dist/snap.svg.js`);
// const Snap = require("snapsvg");

// const fs = require("fs");
// const cmd = require("node-cmd");
// cmd.runSync("potrace ../videos/frames/output55.bmp -b svg");

// // getting all the paths from a svg
// const svgContent = fs.readFileSync("../videos/frames/output55.svg", {
//   encoding: "utf-8",
// });

// const svgPaths = [];

// const parsedSvg = parse(svgContent);
// const paths = parsedSvg.children[0].children[1].children;

// paths.forEach((path) => {
//   const svgPathString = path.properties.d;
//   svgPaths.push(svgPathString);
// });

// console.log(svgPaths);


