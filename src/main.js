var file = "CookieHttpOnlyAPIJava.java";
var files = ['CookieHttpOnlyAPIJava.java'];
var fileContents = ['//This is a line before.\nHttpCookie var;\nvar.setSecure(true);\n\nsession.getCookie().setSecure(true);\n\nmyCookie.setSecure(true);\n\ngetCookie("sessionID", config)\n. setSecure (  true  );\n\n//GOOD CODE\nvar1.setSecure(false);\n\nsession.getCookie().setSecure(true);\n\n//This is the final text.', '', ''];

var updatedFile = 'Cookie var;\nvar.setHttpOnly(true);\n\nsession.getCookie().setHttpOnly(true);\n\nmyCookie.setHttpOnly(true);\n\ngetCookie("sessionID", config)\n. setHttpOnly (  true  );\n\n//GOOD CODE\nvar1.setHttpOnly(false);\n\nsession.getCookie().setHttpOnly(true);';

service.scanFile(file)
.then((response) => {
    return service.scanFiles(file);
    //return service.loopOverFindingsMap(response.body, file); old
})
.then((findingsMap) => {
	return applyfixes.reviewFindingsMap(findingsMap);
})
.then((rep) => {
    //console.log(rep);
})

