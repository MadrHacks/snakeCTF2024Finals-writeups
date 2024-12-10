// https://medium.com/@benedictpmateo/next-js-13-render-a-pdf-file-to-canvas-using-pdf-js-typescript-2a4a53b27df0
import * as PDFJS from 'pdfjs-dist/build/pdf';

// this function takes an argument we named path that 
// can be a path to the file or can be an external link
// that contains the PDF
const getPDFDocument = async (path) => {
    PDFJS.GlobalWorkerOptions.workerSrc =
        window.location.origin + "/pdf.worker.min.mjs";

    return new Promise((resolve, reject) => {
        PDFJS
            .getDocument(path)
            .promise.then((document) => {
                resolve(document);
            })
            .catch(reject);
    });
};

export default getPDFDocument
