import { showAlert } from '@/Helpers/alert';

const IMAGE_TYPES = ['image/jpeg', 'image/png'];
const EXT_OK = /\.(jpe?g|png)$/i;
const PDF_OK = /\.pdf$/i;

const size = (b) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.ceil(b / 1024)} KB`);

/**
 * Validate files picked in a file input. Returns only the valid files and shows
 * one clear message listing every rejected file and why.
 *
 *   const [file] = validFiles(e.target.files, { maxMB: 5, pdf: true }, e.target);
 *
 * opts.maxMB  – size limit per file (default 5)
 * opts.pdf    – also accept PDF (default: JPG/JPEG/PNG only)
 * opts.title  – alert title
 * input       – the <input>; it is cleared when nothing valid was picked, so the
 *               same file can be re-selected after the user fixes it.
 */
export function validFiles(fileList, opts = {}, input = null) {
    const { maxMB = 5, pdf = false, title = 'File not accepted' } = opts;
    const files = Array.from(fileList || []);
    const accepted = [];
    const problems = [];

    files.forEach((f) => {
        const isImage = IMAGE_TYPES.includes(f.type) || (!f.type && EXT_OK.test(f.name));
        const isPdf = pdf && (f.type === 'application/pdf' || PDF_OK.test(f.name));
        if (!isImage && !isPdf) {
            problems.push(`"${f.name}" is not allowed. Use ${pdf ? 'PDF, ' : ''}JPG, JPEG or PNG only.`);
        } else if (f.size > maxMB * 1048576) {
            problems.push(`"${f.name}" is too large (${size(f.size)}). The maximum is ${maxMB} MB per file.`);
        } else if (f.size === 0) {
            problems.push(`"${f.name}" is empty. Please choose a different file.`);
        } else {
            accepted.push(f);
        }
    });

    if (problems.length) {
        showAlert.warning(problems.join('\n'), title);
    }
    if (input && accepted.length === 0) {
        input.value = '';
    }
    return accepted;
}
