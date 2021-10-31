webos-service-minifier
======================

Description
-----------

This minifier takes a webos service "manifest.json" as input, and outputs a "node_module.js" file which is a
concatenated and minified version of the javascript source files.

Usage
-----

General use:
```
node minify.js --destdir output/path path/to/manifest.json
```

To use this nodejs module in a recipe, the following might be used:
- add this repository in the sources of the recipe
- during do_install of the service, add a line like this:
```
node ${WORKDIR}/minifier/minify.js --destdir ${D}${webos_frameworksdir}/$FRAMEWORK_DIR/version/1.0/ ${S}/manifest.json
```


