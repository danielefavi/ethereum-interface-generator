import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

var app = express();

// loading the public folder as static
app.use('/public', express.static(__dirname + '/../public'));

// showing the dist/index.html file for all the routes
var indexFile = __dirname + '/../dist/index.html';
if (process.argv.includes('--temp_dist_folder')) {
   const inx = process.argv.indexOf('--temp_dist_folder') + 1;
   indexFile = process.argv[inx].replace(/\/+$/, '') + '/index.html';
}

// serving the index file for all the requests
app.use((req, res) => {
   fs.readFile(indexFile, 'utf8', (err, text) => {
      res.send(text);
   });
});

// getting the port from the argument --port form the CLI
var port = 5432;
if (process.argv.includes('--port')) {
   const inx = process.argv.indexOf('--port') + 1;
   port = process.argv[inx];
}

// starting the server and showing the details to the console
var server = app.listen(port, function () {
   var host = server.address().address;
   
   console.info(
      "App listening at http://%s:%s", 
      host == '::' ? 'localhost' : host, 
      server.address().port
   )
})
