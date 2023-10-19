import fs from 'fs';
import path from "path";
import { fileURLToPath } from "url";
import archiver from "archiver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function pack() {

    await new Promise(async (resolve, reject) => {
        
        const packageData = await fs.promises.readFile(path.join(__dirname, "package.json"), { encoding: "utf8" });            

        const data = JSON.parse(packageData);
        const destinationFolder = path.join(__dirname, "out");
        const destination = path.join(destinationFolder, `${data.name}-${data.version}.zip`);

        // make sure directory exists    
        await fs.promises.mkdir(destinationFolder,  { recursive: true });

        // create a file to stream archive data to.
        const output = fs.createWriteStream(destination);

        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        // listen for all archive data to be written
        // 'close' event is fired only when a file descriptor is involved
        output.on('close', function() {
            console.log(`${archive.pointer().toLocaleString()} bytes written to ${destination}`);
        });

        // This event is fired when the data source is drained no matter what was the data source.
        // It is not part of this library but rather from the NodeJS Stream API.
        // @see: https://nodejs.org/api/stream.html#stream_event_end
        output.on('end', function() {
            console.log('Data has been drained');
        });

        // good practice to catch warnings (ie stat failures and other non-blocking errors)
        archive.on('warning', function(err) {
            if (err.code === 'ENOENT') {
                // log warning
                console.warn(err);
            } else {
                // throw error
                throw err;
            }
        });

        // good practice to catch this error explicitly
        archive.on('error', function(err) {
            throw err;
        });

        // pipe archive data to the file
        archive.pipe(output);

        // append files from a sub-directory, putting its contents at the root of archive
        archive.directory(path.join(__dirname, "dist"), false);

        // finalize the archive (ie we are done appending files but streams have to finish yet)
        // 'close', 'end' or 'finish' may be fired right after calling this method so register to them beforehand
        await archive.finalize();    
    });
}

pack();