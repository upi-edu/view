import { displayConcatenatedPDFs } from "./lib.js";

const decodedURL = atob(decodeURIComponent(window.location.hash.substring(1)));

console.log("A2B: ", decodedURL);

if (!decodedURL) {
    // If hash URL is empty, redirect to 404.html
    window.location.href = '404.html';
}

const hashParams = decodedURL.substring(1).split('&');
const pdfUrls = [];

hashParams.forEach(param => {
    // Assuming param directly contains PDF URLs without keys
    const value = decodeURIComponent(param);
    pdfUrls.push(value);
});

// Load and display concatenated PDFs
displayConcatenatedPDFs(pdfUrls);