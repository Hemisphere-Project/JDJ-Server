<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>Fullscreen Image viewer</title>
  <meta name="author" content="Hemisphere">
  <style>
  body{
    background: black;
  }
  .fullScreen {
    max-width: 100%;
    max-height: 100%;
    bottom: 0;
    left: 0;
    margin: auto;
    overflow: auto;
    position: fixed;
    right: 0;
    top: 0;
  }
  </style>
</head>

<body>
  <img src="../files/<?php echo str_replace('/','',$_GET['img']); ?>" class="fullScreen" />
</body>
</html>
