var fs = require('fs');
var readline = require('readline');
var {google} = require('googleapis');
var OAuth2 = google.auth.OAuth2;

var SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
var TOKEN_PATH = './credentialsyoutube-nodejs-quickstart.json';

// Carga las credenciales del cliente desde un archivo local.
fs.readFile('./client_secret.json', function processClientSecrets(err, content) {
  if (err) {
    console.log('Error cargando el archivo de secret client: ' + err);
    return;
  }
  authorize(JSON.parse(content), uploadVideo);
});

function authorize(credentials, callback) {
  var clientSecret = credentials.web.client_secret;
  var clientId = credentials.web.client_id;
  var redirectUrl = credentials.web.redirect_uri;  // Nota: Cambia a "redirect_uris" en lugar de "redirect_uri"
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  fs.readFile(TOKEN_PATH, function(err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Autoriza esta app visitando esta URL: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Introduce el código de esa página aquí: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error al intentar obtener el token de acceso', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw err;
    console.log('Token almacenado en ' + TOKEN_PATH);
  });
}

function uploadVideo(auth) {
  var service = google.youtube('v3');
  service.videos.insert({
    auth: auth,
    part: 'snippet,status',
    resource: {
      snippet: {
        title: 'Video Prueba de ClipResume',
        description: 'Descripción del Video',
        tags: ['ClipResume', 'ORTHerramienta'],
        categoryId: '22'
      },
      status: {
        privacyStatus: 'public',
        madeForKids: false
      }
    },
    media: {
      body: fs.createReadStream('./video.mp4')
    }
  }, function(err, response) {
    if (err) {
      console.log('La API devolvió un error: ' + err);
      return;
    }
    console.log('Video subido con éxito. ID del video: ' + response.data.id);
  });
}
