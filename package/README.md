# Cortona3D Solo Library

## Introduction
The Cortona3D Solo library is a JavaScript framework used to display and control the interactive procedures and catalogs created by RapidAuthor tools on the Web pages. Since it is based on a standard browser technology, the Web browser does not need any plug-in to display the interactive procedures and catalogs. The main requirement is that the Web browser should support HTML5 and WebGL technologies.

## Solo Sample Usage
For example, the following sample represents the basic usage of the Solo library on the HTML page.

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Cortona3D Solo Samples - Procedure - Trivial</title>
    <script src="Cortona3DSolo.js"></script>
</head>

<body>
    <script>
        Cortona3DSolo.use('core');
        Cortona3DSolo.app.initialize('data/pump-procedure.interactivity.xml');
        Cortona3DSolo.app.didFinishLoadDocument = function (doc) {
            if (doc.type == 'procedure') {
                Cortona3DSolo.app.procedure.play();
            }
        }
    </script>
</body>

</html>
```
