# Rimworld Stories (BACK-END)

Thinkful (https://www.thinkful.com/) final portfolio project.

## Live version

https://www.rimworld-stories.com

## Front-end repo

https://github.com/NicolasMachado/Rimworld-Stories-Client

## Technology

<img src="https://raw.githubusercontent.com/NicolasMachado/Help-Expat-Berlin/master/views/images/icons/nodejs.png" height="40px" alt="Node JS" title="Node JS" /> <img src="https://raw.githubusercontent.com/NicolasMachado/Help-Expat-Berlin/master/views/images/icons/express.png" height="40px" alt="Express" title="Express" /> <img src="https://raw.githubusercontent.com/NicolasMachado/Help-Expat-Berlin/master/views/images/icons/mongodb.png" height="40px" alt="Mongo DB" title="Mongo DB" /> <img src="http://res.cloudinary.com/cloudinary/image/upload/w_128/cloudinary_logo_square.png" height="40px" alt="Cloudinary" title="Cloudinary" />


## Description
Rimworld is a sci-fi colony sim driven by an intelligent AI storyteller. Each game you play is full of surprises, incredible interactions, hilarious events, dramatic misfortunes and heroic actions.

I love reading these stories and each one has its special grain of salt. You can find them all over the internet, but here is the thing: there is no central place for them to be gathered. This is why I have created Rimworld Stories, a website for all Rimworld players to post their stories on.

## User interface

This single-page app is designed to work on mobile, tablets and desktop. Its interface is meant to be simple and intuitive.

## Under the hood

* The frontend is entirely built using React and Redux.
* The website is fully responsive, adapting for mobile, table and desktop viewports.
* Asynchronous requests are fired using thunk.
* A draft system has been implemented for users to save automatically, or manually, their work.
* A new draft is created automatically if the user doesn't already have one in waiting.
* If the user already has a draft, or multiple drafts waiting, the latest one is automatically loaded.
* Loading a specific draft can be done through the profile section
* An image uploader for avatars and screenshots has been implemented. It uses a combination of the plugin DropZone, multer and Cloudinary for cloud serving/saving.
* An infinite scroller has been implemented on the main page, using a visibility sensor.
* A test suite has been implemented in the API for most endpoints.
* A React test suite has been implemented for all components, as well as the reducer and the actions.
* Login is made through the facebook authentication API, or through regular account creation, and is handled using Passport in the backend.

## To work on the project locally:

* Install node
* Install mongo
* Clone the repository and install all dependencies (npm install)
* Copy the config.js file from the config/ folder into a config/local folder
* In the file you've just created, set DATABASE_URL and TEST_DATABASE_URL to your local databases
* Set CLIENT_URL to 'http://localhost:3000'
* Create a FB app for FB login
* Create a Cloudinary account and get a key/secret/cloud name. Insert them in your config file
* Set FACEBOOKAUTH clientID, clientSecret, callbackURL as well in your local config file
* Run node server.js
* Run mongod
* The API should be running and available at following address: http://127.0.0.1:8080/
* The React server must be running in the background for the website to work. Please refer to the Front-end repo.
