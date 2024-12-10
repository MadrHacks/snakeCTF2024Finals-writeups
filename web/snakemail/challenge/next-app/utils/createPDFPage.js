// https://medium.com/@benedictpmateo/next-js-13-render-a-pdf-file-to-canvas-using-pdf-js-typescript-2a4a53b27df0
import { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";

// this function takes a document from the getPDFDocument function and
// page argument for the page number we want to get
const createPDFPage = (document, page)=> {
    return new Promise((resolve, reject) => {
        if (!document || !page) return reject();
        document
            .getPage(page)
            .then((pageDocument) => {
                resolve(pageDocument);
            })
            .catch((error) => reject(error));
    });
};

export default createPDFPage;
