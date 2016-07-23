function parseResponse(response,library){
    console.log("parsing response...");

    var noresults = "This search returned no results.";
    var idx = response.indexOf(noresults);
    console.log("idx: " + idx);
    if(idx != -1){
        return false;
    }
    var newDoc = document.implementation.createHTMLDocument();
    var parsedHtml = $.parseHTML(response,newDoc,true);
    var trs = $("tr", parsedHtml);

    //if first row doesn't have a "Library" header, we didnt get the right result page
    if(trs[0].innerHTML.indexOf("Library") == -1){
        return false;
    }

    var libraryIds = getLibraryIds(trs);
    // if the library isn't in the list, it doesn't have a copy
    if(! libraryIds.hasOwnProperty(library)){
        return false;
    }

    var avlRegex = /parseDetailAvailabilityJSON\(({[\s\S]*?})\)/m;
    var avlJson = response.match(avlRegex)[1];
    var availability = JSON.parse(avlJson);

    var avlIdx = availability.ids.indexOf(libraryIds[library]);
    if(avlIdx == -1){
        return false;
    }

    var avlString = availability.strings[avlIdx];

    // if it's "Due", then it's not available.
    // AFAIK, that's the only unavailable state.
    // otherwise, it's available! yay!
    if(avlString.startsWith("Due")){
        return false;
    }else{
        return true;
    }
}

function getLibraryIds(trs){
    var libraryIds = {}

    // start with 1, since row 0 is headers
    for(i=1; i < trs.length; i++){
        var libraryName = trs[i].firstChild.innerHTML.trim();
        var avlStr = trs[i].lastChild.firstChild.id;
        var id = /availabilityDiv(.*)/.exec(avlStr)[1];
        libraryIds[libraryName] = id;
    }
    return libraryIds;
}


function checkLibrary(isbn, library, callback, error){
    var url = "http://mdpl.ent.sirsi.net/client/catalog/search/results?qu=" + isbn;
    console.log("requesting url=" + url);
    var request = $.ajax(url); 
    request.done(function(data){
        var parsed = parseResponse(data,library);
        callback(parsed);
    }).fail(error);
}
