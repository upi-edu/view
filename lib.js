import { PDFDocument } from 'https://cdn.skypack.dev/pdf-lib';
import { isMobile } from 'https://cdn.jsdelivr.net/gh/jscroot/useragent@0.0.1/croot.js';

const loaderSection = document.getElementById('loaderSection');

export async function displayConcatenatedPDFs(pdfUrls) {
  const pdfDocs = [];

  try {
    // Load all PDFs
    for (const url of pdfUrls) {

      // Fetch PDF bytes
      const pdfBytes = await fetch(url).then(response => response.arrayBuffer());
      // Load PDF document
      const pdfDoc = await PDFDocument.load(pdfBytes);
      pdfDocs.push(pdfDoc);
    }

    // Create a new PDFDocument to hold the concatenated pages
    const concatenatedPdf = await PDFDocument.create();

    // Copy pages from all PDFs to the concatenated PDF
    for (const pdfDoc of pdfDocs) {
      const pages = await concatenatedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      pages.forEach(page => {
        concatenatedPdf.addPage(page);
      });
    }

    // Save concatenated PDF
    const concatenatedPdfBytes = await concatenatedPdf.save();

    const pdfUrl = URL.createObjectURL(new Blob([concatenatedPdfBytes], { type: 'application/pdf' }));
    if (isMobile()) {
      // Mobile mode
      const pdfjsLib = window['pdfjs-dist/build/pdf'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.worker.min.js';

      const loadingTask = pdfjsLib.getDocument({ data: concatenatedPdfBytes });
      loadingTask.promise.then(pdf => {
        const numPages = pdf.numPages;
        const canvasContainer = document.createElement('div');
        canvasContainer.style.width = '100%';
        canvasContainer.style.height = '100%';
        canvasContainer.style.position = 'fixed';
        canvasContainer.style.top = '0';
        canvasContainer.style.left = '0';
        canvasContainer.style.zIndex = '9999';
        canvasContainer.style.overflowY = 'scroll';
        document.body.appendChild(canvasContainer);

        for (let pageNumber = 1; pageNumber <= numPages; pageNumber++) {
          pdf.getPage(pageNumber).then(page => {
            const viewport = page.getViewport({ scale: 1 });
            const scale = Math.min(canvasContainer.clientWidth / viewport.width, canvasContainer.clientHeight / viewport.height);
            const scaledViewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = scaledViewport.height;
            canvas.width = scaledViewport.width;
            canvasContainer.appendChild(canvas);

            const renderContext = {
              canvasContext: context,
              viewport: scaledViewport
            };
            page.render(renderContext);
          });
        }

        if (canvasContainer.requestFullscreen) {
          canvasContainer.requestFullscreen();
        } else if (canvasContainer.webkitRequestFullscreen) {
          canvasContainer.webkitRequestFullscreen();
        }
      });
    } else {
      const embedElement = document.createElement('embed');
      embedElement.setAttribute('src', pdfUrl);
      embedElement.setAttribute('width', '100%');
      embedElement.setAttribute('height', '100%');
      document.body.replaceChild(embedElement, loaderSection);
    }

  } catch (error) {
    Swal.fire({
      icon: 'error',
      title: 'Oops...',
      text: 'Dokumen masih dalam proses pembuatan. Silahkan kembali lagi setelah 10 menit.',
    });
    const HomeLink = document.createElement('a');
    HomeLink.href = "javascript:window.location.reload(true)";
    HomeLink.textContent = 'Segarkan Laman';
    document.body.replaceChild(HomeLink, loaderSection);
    console.error('Error memroses PDFs:', error);
  }
}
