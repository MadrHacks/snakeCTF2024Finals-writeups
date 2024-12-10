// https://medium.com/@benedictpmateo/next-js-13-render-a-pdf-file-to-canvas-using-pdf-js-typescript-2a4a53b27df0
"use client";

import { useEffect, useRef } from "react";
import getPDFDocument from "@/utils/getPDFDocument";
import createPDFPage from "@/utils/createPDFPage";
import renderPDFToCanvas from "@/utils/renderPDFToCanvas";
import Button from "./Button";

export const PDFCanvas = ({ emailId, attachmentId }) => {
    const ref = useRef(null);

    const renderPDF = async () => {
        // PDF Path or URL
        const url = window.location.origin + `/api/attachment?email=${emailId}&id=${attachmentId}`;

        // Page number you want to render
        const pageNumber = 1;

        // Fetch the PDF
        const pdfDocument = await getPDFDocument(url);

        // Get the PDF page
        const pdfPage = await createPDFPage(pdfDocument, pageNumber);

        // Get the viewport of the page to extract sizes
        const viewport = pdfPage.getViewport({ scale: 1 });
        const { height, width } = viewport;

        // Create the canvas
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        // Render the pdf to canvas
        const pdfCanvas = await renderPDFToCanvas(pdfPage, canvas);

        // then add the canvas with pdf to the div element
        ref.current?.replaceChildren(pdfCanvas)
    };

    useEffect(() => {
        renderPDF();
    }, []);

    return <div>
        <p className="text-center text-xl font-bold mb-4">
            Preview of the PDF
        </p>
        <div className="max-h-[500px] rounded-t-xl overflow-hidden border-2 border-white/15">
            <div ref={ref}></div>
        </div>
        <Button
            className={"rounded-t-none border-t-0"}
            onClick={() => window.open(`/api/attachment?email=${emailId}&id=${attachmentId}&download=true`)}
        >
            Download PDF
        </Button>
    </div>;
};