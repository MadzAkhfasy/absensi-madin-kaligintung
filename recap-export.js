(function () {
  const logoUrl = "./LOGO%20MADIN%20REMOVE%20BG.png";
  const configs = [
    { type: "reading", resultId: "readingRecapResult", classId: "readingRecapClass", monthId: "readingRecapMonth", title: "REKAP BULANAN PENILAIAN MEMBACA YANBU'A" },
    { type: "writing", resultId: "writingRecapResult", classId: "writingRecapClass", monthId: "writingRecapMonth", title: "REKAP BULANAN PENILAIAN MENULIS ARAB" }
  ];

  function monthLabel(value) {
    if (!value) return "";
    const p = value.split("-");
    return new Date(Number(p[0]), Number(p[1]) - 1, 1)
      .toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  }

  function buildSheet(config, format) {
    const source = document.getElementById(config.resultId);
    const classSelect = document.getElementById(config.classId);
    const monthInput = document.getElementById(config.monthId);

    if (!source || !source.children.length || !source.textContent.trim()) {
      throw new Error("Rekap belum tampil. Tekan Tampilkan Rekap terlebih dahulu.");
    }

    const className = classSelect && classSelect.selectedOptions[0]
      ? classSelect.selectedOptions[0].textContent.trim() : "";
    const month = monthLabel(monthInput ? monthInput.value : "");
    const clone = source.cloneNode(true);
    // Hilangkan paragraf periode dari isi tabel. Bulan/tahun tetap ditampilkan pada kop ekspor.
    clone.querySelectorAll("p").forEach(el => {
      const text = (el.textContent || "").replace(/\\s+/g, " ").trim();
      if (/rekap\\s+bulan/i.test(text) || (month && text.toLocaleLowerCase("id-ID").includes(month.toLocaleLowerCase("id-ID")))) {
        el.remove();
      }
    });
    // Hilangkan baris "Rekap bulan YYYY-MM" dari salinan ekspor PDF maupun PNG.
    // Teks dinormalisasi agar tetap terdeteksi meskipun ada spasi atau baris baru dari template.
    clone.querySelectorAll("p, h3, h4, small, div, span").forEach(el => {
      const text = (el.textContent || "").replace(/\s+/g, " ").trim();
      // Keterangan teknis ini hanya untuk admin/petugas di aplikasi, bukan untuk file ekspor.
      const internalNote = /^Halaman ditampilkan sampai halaman terjauh yang dicapai pada bulan terpilih\. Sel kosong berarti belum ada hasil penilaian pada bulan tersebut\.?$/i;
      if ((/^rekap\s+bulan\b/i.test(text) || internalNote.test(text)) && el.children.length === 0) {
        el.remove();
      }
    });
    // Nama kelas sudah dicantumkan pada kop; hilangkan judul kelas duplikat di atas tabel.
    clone.querySelectorAll("h3").forEach(el => {
      if ((el.textContent || "").replace(/\s+/g, " ").trim() === className) el.remove();
    });
    clone.removeAttribute("id");
    clone.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));

    // Lepaskan batas gulir dan sticky agar seluruh kolom ikut tercetak/tergambar.
    [clone, ...clone.querySelectorAll("*")].forEach(el => {
      el.style.maxHeight = "none";
      el.style.height = "auto";
      el.style.overflow = "visible";
      el.style.position = "static";
      el.style.top = "auto";
      el.style.left = "auto";
      el.style.transform = "none";
      el.style.opacity = "1";
      el.style.visibility = "visible";
      el.style.webkitOverflowScrolling = "auto";
    });

    if (format === "pdf" || format === "png") {
      // Sisakan jarak nyata antara huruf dan garis bawah agar tidak menempel.
      clone.querySelectorAll('span[style*="padding-bottom"]').forEach(el => {
        const underline = el.querySelector("span");
        if (underline) underline.remove();
        el.style.position = "static";
        el.style.display = "inline-block";
        el.style.paddingBottom = "6px";
        el.style.borderBottom = "2px solid #c62828";
        el.style.lineHeight = "1.2";
        el.style.textDecoration = "none";
      });
    }

    const sheet = document.createElement("div");
    sheet.className = "madin-export-sheet madin-export-" + format;
    sheet.innerHTML =
      '<div class="madin-export-header"><div class="madin-export-brand">' +
        '<img src="' + logoUrl + '" alt="Logo Madin">' +
        '<div class="madin-export-heading">' +
          '<div class="madin-export-madin">MADRASAH DINIYAH KALIGINTUNG</div>' +
          '<div class="madin-export-title">' + config.title + '</div>' +
          '<div class="madin-export-meta">' + className + (month ? ' • ' + month : '') + '</div>' +
        '</div></div>' +
      '</div><div class="madin-export-content"></div>' +
      '<div class="madin-export-footer">Madrasah Diniyah Kaligintung</div>';
    const exportContent = sheet.querySelector(".madin-export-content");
    exportContent.appendChild(clone);

    // Legenda ringkas: kotak simbol berwarna dengan keterangan di sampingnya.
    if (config.type === "reading") {
      const legend = document.createElement("section");
      legend.style.cssText = "display:block!important;clear:both;width:100%;box-sizing:border-box;margin:14px 0 2px;padding:8px 10px;border:1px solid #d9e2dc;background:#f8fbf9;color:#17251d;font-family:Arial,sans-serif;font-size:12px;line-height:1.4;page-break-inside:avoid";
      legend.innerHTML =
        '<div style="font-weight:700;margin-bottom:6px;color:#104b32">Keterangan:</div>' +
        '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:7px 18px">' +
          '<span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap"><b style="display:inline-flex;align-items:center;justify-content:center;width:27px;height:25px;box-sizing:border-box;border:1px solid #b7c9bd;border-radius:3px;background:#d9f2df;font-size:16px;line-height:25px;padding:0"><span style="display:block;position:relative;top:-7px;line-height:25px">ص</span></b> Lancar</span>' +
          '<span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap"><b style="display:inline-flex;align-items:center;justify-content:center;width:27px;height:25px;box-sizing:border-box;border:1px solid #b7c9bd;border-radius:3px;background:#fff1b8;font-size:16px;line-height:25px;padding:0"><span style="display:block;position:relative;top:-7px;line-height:25px">ص</span></b> Diulang sekali</span>' +
          '<span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap"><b style="display:inline-flex;align-items:center;justify-content:center;width:27px;height:25px;box-sizing:border-box;border:1px solid #b7c9bd;border-radius:3px;background:#ffdfbd;font-size:16px;line-height:25px;padding:0"><span style="display:block;position:relative;top:-7px;line-height:25px">ص</span></b> Diulang dua kali</span>' +
          '<span style="display:inline-flex;align-items:center;gap:6px;white-space:nowrap"><b style="display:inline-flex;align-items:center;justify-content:center;width:27px;height:25px;box-sizing:border-box;border:1px solid #b7c9bd;border-radius:3px;background:#ffd6d6;font-size:16px;line-height:25px;padding:0;text-decoration:none"><span style="display:block;position:relative;top:-7px;line-height:25px;text-decoration:underline;text-decoration-color:#c62828;text-decoration-thickness:2px;text-underline-offset:7px">ص</span></b> Diulang tiga kali</span>' +
        '</div>';
      exportContent.appendChild(legend);
    }
    return sheet;
  }

  function addExportStyles() {
    if (document.getElementById("madin-export-styles")) return;
    const style = document.createElement("style");
    style.id = "madin-export-styles";
    style.textContent =
      ".madin-export-sheet{box-sizing:border-box;display:block;width:max-content;min-width:100%;padding:22px;background:#fff;color:#17251d;font-family:Arial,sans-serif}" +
      ".madin-export-header{display:flex;align-items:center;gap:16px;border-bottom:3px solid #c9a64f;padding:0 0 14px;margin:0 0 16px;background:#fff}" +
      ".madin-export-brand{display:flex;align-items:center;gap:16px;width:max-content;max-width:100%;margin:0 auto}" +
      ".madin-export-header img{display:block;flex:0 0 76px;width:76px;height:76px;object-fit:contain;margin:0}" +
      ".madin-export-sheet .madin-export-header{justify-content:center;text-align:center}" +
      ".madin-export-sheet .madin-export-brand{justify-content:center}" +
      ".madin-export-sheet .madin-export-heading{text-align:center;flex:0 1 auto;min-width:0}" +
      ".madin-export-madin{font-size:20px;font-weight:800;color:#104b32;letter-spacing:.4px}" +
      ".madin-export-title{font-size:15px;font-weight:700;margin-top:5px;color:#17251d}" +
      ".madin-export-meta{font-size:13px;margin-top:5px;color:#17251d}" +
      ".madin-export-content{display:block;width:max-content;min-width:100%;background:#fff}" +
      ".madin-export-content>div{max-height:none!important;height:auto!important;overflow:visible!important;opacity:1!important;visibility:visible!important}" +
      ".madin-export-content [style*='display:grid']{display:grid!important}" +
      ".madin-export-footer{font-size:10px;color:#65736a;border-top:1px solid #dce5df;margin-top:14px;padding-top:8px}" +
      "@media print{@page{size:landscape;margin:8mm}body.madin-printing>*:not(#madin-print-sheet){display:none!important}body.madin-printing{margin:0!important;background:#fff!important}#madin-print-sheet{display:block!important;position:static!important;width:max-content!important;max-width:none!important;padding:0!important}#madin-print-sheet *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}";
    document.head.appendChild(style);
  }

  function printPdf(config) {
    addExportStyles();
    const sheet = buildSheet(config, "pdf");
    sheet.id = "madin-print-sheet";
    sheet.style.display = "none";
    document.body.appendChild(sheet);
    document.body.classList.add("madin-printing");

    let restored = false;
    const restore = () => {
      if (restored) return;
      restored = true;
      document.body.classList.remove("madin-printing");
      sheet.remove();
      window.removeEventListener("afterprint", restore);
    };
    window.addEventListener("afterprint", restore);
    // Android Chrome tidak selalu mengirim afterprint; sediakan pemulihan cadangan.
    setTimeout(restore, 120000);
    requestAnimationFrame(() => {
      sheet.style.display = "block";
      requestAnimationFrame(() => window.print());
    });
  }

  function loadHtml2Canvas() {
    if (window.html2canvas) return Promise.resolve(window.html2canvas);
    if (window.__madinHtml2CanvasPromise) return window.__madinHtml2CanvasPromise;
    window.__madinHtml2CanvasPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
      script.onload = () => window.html2canvas
        ? resolve(window.html2canvas)
        : reject(new Error("Alat pembuat gambar tidak berhasil dimuat."));
      script.onerror = () => reject(new Error("Gagal memuat alat pembuat gambar. Periksa koneksi internet."));
      document.head.appendChild(script);
    });
    return window.__madinHtml2CanvasPromise;
  }

  async function savePng(config) {
    const html2canvas = await loadHtml2Canvas();
    addExportStyles();
    const sheet = buildSheet(config, "png");
    sheet.id = "madin-png-sheet";
    sheet.style.cssText =
      "position:absolute;left:0;top:0;z-index:2147483000;display:block;" +
      "width:max-content;max-width:none;height:auto;max-height:none;overflow:visible;padding:30px;box-sizing:border-box;" +
      "background:#fff;";
    document.body.appendChild(sheet);

    try {
      const logo = sheet.querySelector("img");
      if (logo && !logo.complete) {
        await new Promise(resolve => {
          logo.onload = resolve;
          logo.onerror = resolve;
        });
      }
      if (document.fonts && document.fonts.ready) await document.fonts.ready;

      const canvas = await html2canvas(sheet, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: sheet.scrollWidth,
        height: Math.ceil(sheet.getBoundingClientRect().height),
        windowWidth: Math.max(document.documentElement.clientWidth, sheet.scrollWidth),
        windowHeight: Math.max(document.documentElement.clientHeight, sheet.scrollHeight),
        scrollX: 0,
        scrollY: 0
      });

      if (!canvas.width || !canvas.height) {
        throw new Error("Isi rekap tidak berhasil diubah menjadi gambar.");
      }

      const link = document.createElement("a");
      link.download = "Rekap-" + config.type + "-Madin-" +
        (document.getElementById(config.monthId).value || "bulanan") + ".png";
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      sheet.remove();
    }
  }

  function addControls(config) {
    const result = document.getElementById(config.resultId);
    if (!result || result.dataset.exportControls === "ready") return;
    result.dataset.exportControls = "ready";

    const controls = document.createElement("div");
    controls.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 18px";
    controls.innerHTML =
      '<button type="button" class="secondary" data-export-format="pdf">Simpan sebagai PDF</button>' +
      '<button type="button" class="secondary" data-export-format="png">Simpan sebagai Gambar (PNG)</button>' +
      '<span class="message" aria-live="polite" style="width:100%;margin:0"></span>';
    result.insertAdjacentElement("afterend", controls);

    controls.querySelectorAll("button").forEach(button => {
      button.addEventListener("click", async () => {
        const format = button.dataset.exportFormat;
        const status = controls.querySelector(".message");
        controls.querySelectorAll("button").forEach(b => b.disabled = true);
        status.textContent = format === "pdf" ? "Menyiapkan tampilan cetak..." : "Menyiapkan gambar...";
        status.classList.remove("error");
        try {
          if (format === "pdf") printPdf(config);
          else await savePng(config);
          status.textContent = format === "pdf"
            ? "Tampilan cetak dibuka. Pilih Simpan sebagai PDF."
            : "Gambar rekap berhasil dibuat.";
        } catch (error) {
          console.error(error);
          status.textContent = error.message || "Gagal menyiapkan dokumen.";
          status.classList.add("error");
        } finally {
          controls.querySelectorAll("button").forEach(b => b.disabled = false);
        }
      });
    });
  }

  function initialize() {
    configs.forEach(addControls);
    configs.forEach(config => {
      const target = document.getElementById(config.resultId);
      if (!target) return;
      new MutationObserver(() => addControls(config))
        .observe(target, { childList: true, subtree: true });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
  } else {
    initialize();
  }
})();