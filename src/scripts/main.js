let textBoxl = $('#left_ta')[0];
let textBoxr = $('#right_ta')[0];

textBoxl.onfocus = () => {
    textBoxl.select();
    textBoxl.onmouseup = () => {
        textBoxl.onmouseup = null;
        return false;
    };
};

textBoxr.onfocus = () => {
    textBoxr.select();
    textBoxr.onmouseup = () => {
        textBoxr.onmouseup = null;
        return false;
    };
};

/* clipboard.js */
let clipboard = new Clipboard('.btn');

clipboard.on('success', (e) => {
    if (textBoxr.value == '') {
        Materialize.toast('Nothing to copy.', 2000);
        return;
    }
    console.log(e);
    Materialize.toast('Copied to clipboard!', 3000);
})

clipboard.on('error', (e) => {
    console.log(e);
})

/* Main conversion */
function convert() {
    let left = $('#left_ta')[0];
    let right = $('#right_ta')[0];

    let leftval = left.value;
    /*
     * Mini pipeline-ish-like thingy.
     * Which replacement "comes first"" matters.
     */
    leftval = leftval


        // Urls & Image
        .replace(/!\[\]\((.*)\)/gmi, "[img]$1[/img]") // Image
        .replace(/!\[(.*)\]\((.*)\)/gmi, "[img=$1]$2[/img]") // Image
        .replace(/\[(.+?)\]\((.+?)(\s".*")?\)/gmi, '[url=$2]$1[/url]') // Url

        // Quoted h1
        .replace(/^(.+)(\n|\r\n)([=]{3,3}\s*(\n|\r\n)?)$/gmi, "[quote][size=7]$1[/size][/quote]")
        
        // Quoted h2
        .replace(/^(.+)(\n|\r\n)([-]{3,3}\s*(\n|\r\n)?)$/gmi, "[quote][size=6]$1[/size][/quote]") // h2

        /* h6 is left out because it's the default size on AB. */

        // h5
        .replace(/^[#]{5,5}\s*(.*[^\s])\s*[#]{5,5}\n?$/gmi, "[size=3]$1[/size]")
        .replace(/^[#]{5,5}\s+(.*)\n?$/gmi, "[size=3]$1[/size]")

        // h4
        .replace(/^[#]{4,4}\s*(.*[^\s])\s*[#]{4,4}\n?$/gmi, "[size=4]$1[/size]")
        .replace(/^[#]{4,4}\s+(.*)\n?$/gmi, "[size=4]$1[/size]")

        // h3
        .replace(/^[#]{3,3}\s*(.*[^\s])\s*[#]{3,3}\n?$/gmi, "[size=5]$1[/size]")
        .replace(/^[#]{3,3}\s+(.*)\n?$/gmi, "[size=5]$1[/size]")
        
        // h2
        .replace(/^[#]{2,2}\s*(.*[^\s])\s*[#]{2,2}\n?$/gmi, "[size=6]$1[/size]")
        .replace(/^[#]{2,2}\s+(.*)\n?$/gmi, "[size=6]$1[/size]")
        
        // h1
        .replace(/^[#]{1,1}\s*(.*[^\s])\s*[#]{1,1}\n?$/gmi, "[size=7]$1[/size]")
        .replace(/^(?!\n*[`]{3,3})[#]{1,1}\s+(.*)\n?$/gmi, "[size=7]$1[/size]")
        
        //.replace(/^\t|[ ]{4,4}(.*)/gmi, "$1")  // Strip tabs

        // Code
        .replace(/^\`{3,3}(.*)\n((?:.|\n)+?)\n\`{3,3}\n?$/gmi, "[code]$2[/code]") // Backticks
        .replace(/^\~{3,3}(.*)\n((?:.|\n)+?)\n\~{3,3}\n?$/gmi, "[code]$2[/code]") // Tilde
        .replace(/\`([^\`].*?)\`/gmi, "[code]$1[/code]") // Inline (AB shoves everything in a code tag to a box that gets newline'd, so pretty redundant.)

        // Stylization
        .replace(/\*\*\*([^\*].*?)\*\*\*/gmi, "[b][i]$1[/i][/b]") // bold + italic
        .replace(/\*\*([^\*].*?)\*\*/gmi, "[b]$1[/b]") // bold
        .replace(/\*([^\*].*?)\*/gmi, "[i]$1[/i]") // italic
        //.replace(/(\s)\*((?!\/[0-9]|\s|\*).*?)\*(\s)/gmi, "$1[i]$2[/i]$3") // italic
        
        // Quote
        .replace(/^>\s(.*)?[^\n]?$/gmi, "[quote]$1[/quote]") // Quotes

        // Lists
        .replace(/^\*\s+(.*)/gmi, "[*] $1") // Star list
        .replace(/^\-\s+(.*)/gmi, "[*] $1") // Minus list
        .replace(/^\+\s+(.*)/gmi, "[*] $1") // Plus list
        .replace(/^\d\.\s+(.*)/gmi, "[#] $1") // Numbered list.
    right.value = leftval;
    $('#right_ta').trigger('autoresize');
}