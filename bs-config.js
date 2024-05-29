require('dotenv').config();

module.exports = {
    "ui": false,
	"files": [
		"public/js/**/*.js",
		"src/views/**/*.ejs"
	],
    "port": parseInt(process.env.PORT) + 1,
	"proxy": `127.0.0.1:${process.env.PORT}`
};
