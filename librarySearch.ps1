param( [string]$isbn="9780143038276",
    [string]$library="Silver Spring")
function CheckLibrary
{    
    param([string]$isbn="9780062351425",
        [string]$library="Silver Spring")

    $LibraryIds = @{}

    $url = "http://mdpl.ent.sirsi.net/client/catalog/search/results?qu=$isbn"

    $results = Invoke-WebRequest $url
    if($results -match "This search returned no results."){return $false}

    #get availabilityDiv ids for all libraries that have a copy
    $trs = $results.ParsedHtml.getElementsByTagName("tr")
    if($trs[0].innerHTML -notmatch "Library"){return $false}
    for($i = 1; $i -lt $trs.length; $i++){
        $lname = $trs[$i].firstChild.innerHTML.Trim();
        $id = ($trs[$i].lastChild.firstChild.id 
            | Select-String "availabilityDiv(.*)").Matches.Groups[1].Value
        $LibraryIds[$lname] = $id
    }


    $availabilityJson = ($results.Scripts[-1].InnerHtml 
        | Select-String "(?smi)^parseDetailAvailabilityJSON\(({.*?})\);").Matches[0].Groups[1]
    $availabilityObj = ConvertFrom-Json $availabilityJson

    #if the library isn't in the list, it doesn't even have a copy.
    if(!$LibraryIds.ContainsKey($library)){return $false}
    $idx = $availabilityObj.ids.IndexOf($LibraryIds[$library])
    if($idx -eq -1){ return $false }
    $str = $availabilityObj.strings[$idx]

    # if it's "Due", then it's not available. AFAIK, that's the only unavailable state.
    # ergo otherwise it's available! yay!
    if($str.StartsWith("Due")){return $false}else{return $true}
}

function GetOtherEditions
{  param([string]$isbn)

    $url="http://xisbn.worldcat.org/webservices/xid/isbn/$isbn"
    $response = Invoke-RestMethod $url
    return $response.rsp.isbn
}

######################################
## main
######################################

if(CheckLibrary $isbn){
    return $true
}else{
    $otherEditions = GetOtherEditions $isbn
    foreach($other in $otherEditions){
        if(CheckLibrary $other)
        {
            echo "found alternate edition: $other"
                return $true
        }
    }
    return $false
}

