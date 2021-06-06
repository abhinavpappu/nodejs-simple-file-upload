var express = require('express');
var multer = require('multer');
var fs = require('fs');
const progress = require('progress-stream');
const terminalOverwrite = require('terminal-overwrite');
const prettyBytes = require('pretty-bytes');
const humanizeDuration = require('humanize-duration');

const UPLOAD_DIR = './uploads';

let startTime = Date.now();

var app = express();
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
});

var storage = multer.diskStorage({
    destination: function (req, file, callback) {
        var dir = UPLOAD_DIR;
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        callback(null, dir);
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});
var upload = multer({ storage: storage }).array('files');
app.post('/upload', function (req, res, next) {
    const requestSize = Number(req.get('content-length'));
    const p = progress({ time: 1000, length: requestSize });
    console.log(`New request with size: ${prettyBytes(requestSize)}\n`);
    req.pipe(p);
    p.headers = req.headers;
    startTime = Date.now();

    p.on('progress', prog => {
        terminalOverwrite(`${prog.percentage}% complete\n${prettyBytes(prog.transferred)} transferred\n ${prettyBytes(prog.speed)} per second\n${humanizeDuration(Date.now() - startTime)}\n${prettyBytes(prog.length)} total\n${prettyBytes(prog.remaining)} remaining`);
    });

    upload(p, res, function (err) {
        if (err) {
            return res.end("Something went wrong :(");
        }
        res.end("Upload completed.");
        terminalOverwrite.done();
        console.log();
    });
});

app.use(function (err, req, res, next) {
    console.log(err.status);
    console.error(err.stack);
    res.status(500).send('Something broke!');
})

app.listen(3000, () => console.log('Listening on port 3000...\n'));