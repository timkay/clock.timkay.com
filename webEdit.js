let webEdit = (function webEdit() {
    return {

        displayAssets: (elt = 'ul') => {
            $.getJSON('.files.json')
            .then(data => {
                data
                .map(item => typeof item === 'string'? item: item.name)
                .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
                .forEach(item => {
                    if (true || item.match(/\.html$/)) $(elt).append('<li><a href="' + item + '">' + item + '</a></li>');
                });
            });
        },

        displayRandomImage: (key, sel, srcs) => {
            let k = parseInt(localStorage[key] || '0');
            localStorage[key] = (k + 1) % srcs.length;
            $('#bg').attr('src', srcs[k]);
        },
        
    };
})();
