#Pokeweb

Pokeweb is a simple web interface for searching nearby pokemon. It is based on the wonderful node lib [Pokemon-GO-node-api](https://github.com/Armax/Pokemon-GO-node-api) by [@Armax](https://github.com/Armax).

## How to use

* To use the app you need to install the latest vrsion of node and clone the repo to your disk. After that you run:

`npm update`

* You need to rename .env.example to .env. Then open the file in your favorite text editor and enter your login informations.

* The web is runninh over secure ssl conection only. That's why you need to get a SSL server certificate. You can get one for free at [letsencrypt](https://letsencrypt.org/). Onece you haveyour certificate place cert.pem, privkey.pem and fullchain.pem in ssl folder.

* run the app with:

`node index.js`

* once the app is running point your browser to :

https://localhost:3000