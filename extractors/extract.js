const { Observable } = require('rxjs');
const { MongoClient } = require('mongodb');
const fileExtension = require('file-extension');
const conStrParse = require('connection-string');
const csv = require('csv-parser');
const fs = require('file-system');
const now = require('performance-now');

// An object containing all the extract methods
const extract = {};

/**
 * Imports a CSV file from the file system using file path parameter and processes the file
 *
 * @param {string} - a path to the input file
 * @returns {Observable} - an observable containing the parsed CSV data
 */
extract.fromCSV = (filePath) => {
  // Check if a file path was passed into the function
  if (filePath === undefined) throw new Error('ERROR: A file path does not appear to have been passed.\n');

  // Check if the file extension is CSV
  if (!fileExtension(filePath).toLowerCase() === 'csv') throw new Error('ERROR: File does not appear to be CSV.\n');

  // Return an observable containing the CSV data
  return Observable.create((observer) => {
    const data = fs.createReadStream(filePath).pipe(csv());
    data.on('error', () => { throw new Error('Error: there was an error reading the extract file.'); });
    data.on('data', chunk => observer.next(chunk));
    data.on('end', () => observer.complete());

    // Closing the stream
    return () => data.pause();
  });
};

/**
 * Import a JSON file from the file system using file path parameter and processes the file
 *
 * @param {string} - a path to the input file
 * @return {Observable} - an observable containing the parsed JSON data
 */
extract.fromJSON = (filePath) => {
  // Check if a file path was passed into the function
  if (filePath === undefined) throw new Error('ERROR: A file path does not appear to have been passed.\n');

  // Check if the file extension is JSON
  if (!fileExtension(filePath).toLowerCase() === 'json') throw new Error('ERROR: File does not appear to be JSON.\n');

  // Return an observable containing the JSON data
  return Observable.create((observer) => {
    const data = fs.createReadStream(filePath, { encoding: 'utf-8' });
    data.on('error', () => { throw new Error('Error: there was an error reading the extract file.'); });
    data.on('data', chunk => observer.next(chunk));
    data.on('end', () => observer.complete());

    // Closing the stream
    return () => data.pause();
  });
};

/**
 * Imports a XML file from the file system using file path parameter and processes the file
 *
 * @param {string} - a path to the input file
 * @return {Observable} - an observable containing the parsed XML data
 */
extract.fromXML = (filePath) => {
  // Check if a file path was passed into the function
  if (filePath === undefined) throw new Error('ERROR: A file path does not appear to have been passed.\n');

  // Check if the file extension is XML
  if (!fileExtension(filePath).toLowerCase() === 'xml') throw new Error('ERROR: File does not appear to be JSON.\n');

  return Observable.create((observer) => {
    // Add smart stuff here...
  });
};

/**
 * Import data from a Mongo collection
 *
 * @param {string} connectionString - connection string for the Mongo database
 * @param {string} collectionName - name of the desired collection
 * @return {Observable} - an observable containing the parsed Mongo collection data
 */
extract.fromMongoDB = (connectionString, collectionName) => {
  console.log('Starting fromMongoDB...');

  // Capturing start time for performance testing
  const start = now();

  // Setting batch size for Mongo query
  const bSize = 10000;

  // Check if a file path was passed into the function
  if (connectionString === '') throw new Error('Error: You must provide a valid connection string!');

  // Check if the connection string uses the Mongo protocol
  const conStrObj = conStrParse(connectionString);
  if (conStrObj.protocol !== 'mongodb') throw new Error('Error: Connection string does not appear to use the Mongo protocol!');

  // Check if a collection name was passed into the function
  if (collectionName === '') throw new Error('Error: You must provide a valid collection name!');

  // Create a new observable
  return Observable.create((observer) => {
    // Connect to the database
    MongoClient.connect(connectionString, (err, db) => {
      // Handle errors connecting to the Mongo database
      if (err) return console.error(err);

      // Adding the collection name to the database connection
      const collection = db.collection(collectionName);

      // Find all the documents in the collection
      const stream = collection.find({}).batchSize(bSize).stream();

      // On error streaming data from Mongo...
      stream.on('error', () => { throw new Error('Error: there was an error streaming the Mongo data!'); });

      // On next streaming data from Mongo...
      stream.on('data', chunk => observer.next(chunk));

      // On completion of streaming data from Mongo...
      stream.on('end', () => {
        console.log('Mongo streaming completed...');
        console.log('Ending fromMongoDB...');

        // Captruing end time for performance testing
        const end = now();

        // Logging runtime
        console.log('Runtime:', msToTime(Math.abs(start - end)));

        // Closing database connection
        db.close();

        // Completing observer
        observer.complete();
      });

      // Closing the stream
      return () => stream.pause();
    });
  });
};

/**
 * Description
 *
 * @param {} - 
 * @return {} - 
 */
extract.fromPostgres = () => {
  // Add smart stuff here...
};


// Helper function for performance testing
function msToTime(ms) {
  const milliseconds = parseInt((ms%1000)/100);
  let seconds = parseInt((ms/1000)%60);
  let minutes = parseInt((ms/(1000*60))%60);
  let hours = parseInt((ms/(1000*60*60))%24);

  hours = (hours < 10) ? `0${hours}` : hours;
  minutes = (minutes < 10) ? `0${minutes}` : minutes;
  seconds = (seconds < 10) ? `0${seconds}` : seconds;

  return `${hours}:${minutes}:${seconds}.${milliseconds}`;
}

module.exports = extract;
